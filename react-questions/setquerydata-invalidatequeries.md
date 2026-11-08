# Q : TanStack Query의 setQueryData와 invalidateQueries는 언제 사용하나요?

<br />

# A : 둘 다 데이터를 바꾼 뒤(mutation 후) 화면의 캐시를 최신으로 맞추는 방법입니다. setQueryData는 서버에 다시 묻지 않고 캐시를 직접 고치는 것이고, invalidateQueries는 캐시를 "오래됨(stale)"으로 표시해서 서버에서 다시 받아오게 하는 것입니다. 응답만으로 정확한 결과를 알 수 있으면 setQueryData, 서버가 계산한 결과가 필요하거나 영향받는 목록이 많으면 invalidateQueries를 씁니다.

### 한 줄로

- **setQueryData = "내가 결과를 아니까 캐시를 직접 고칠게"** → 요청 0번, 즉시 반영
- **invalidateQueries = "이 데이터는 이제 믿을 수 없으니 다시 받아와"** → 요청 1번 이상, 서버와 정확히 일치

### setQueryData

```ts
const queryClient = useQueryClient();

const updateTodo = useMutation({
  mutationFn: (todo) => api.patch(`/todos/${todo.id}`, todo),
  onSuccess: (updated, variables) => {
    // 서버가 수정된 객체를 돌려줬으니, 그 값으로 상세 캐시를 바로 교체
    queryClient.setQueryData(['todo', variables.id], updated);
  },
});
```

- **언제**: mutation 응답에 바뀐 데이터가 **그대로 들어 있을 때**. 상세 페이지 수정, 좋아요 수처럼 결과가 분명한 경우.
- 다시 요청하지 않으니 빠르고 네트워크를 아낀다.
- **불변성 유지**: 캐시 객체를 직접 바꾸면 안 되고 새 객체를 돌려줘야 한다. 그래야 React가 변경을 감지한다.

```ts
// 나쁜 예: 캐시를 직접 수정
queryClient.setQueryData(['todo', id], (old) => { old.title = '새 제목'; return old; });

// 좋은 예: 새 객체 반환
queryClient.setQueryData(['todo', id], (old) => (old ? { ...old, title: '새 제목' } : old));
```

- **약점**: 이 변경이 영향을 주는 다른 캐시(목록, 개수, 정렬된 결과, 다른 페이지)를 직접 다 찾아 고쳐야 한다. 놓치면 화면끼리 데이터가 어긋난다.

### invalidateQueries

```ts
const addTodo = useMutation({
  mutationFn: (todo) => api.post('/todos', todo),
  // Promise를 return하면 다시 받아올 때까지 isPending이 true로 유지된다
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});
```

- 하는 일 두 가지
  1. 해당 쿼리를 **stale로 표시**한다. `staleTime`이 남아 있어도 무시한다.
  2. 지금 화면에서 쓰고 있는(`useQuery`로 렌더 중인) 쿼리는 **백그라운드에서 다시 요청**한다. 화면에 없는 쿼리는 다음에 쓸 때 다시 받아온다.
- **queryKey는 앞부분만 맞아도 된다(prefix 매칭)**: `['todos']`를 무효화하면 `['todos', { page: 1 }]`, `['todos', 'done']`도 같이 무효화된다. 하나만 원하면 `exact: true`.
- **언제**
  - 응답에 결과가 없거나(`204 No Content`), 서버가 정렬·페이지네이션·집계를 다시 계산하는 경우 (새 글 추가 → 목록 순서, 전체 개수가 바뀜)
  - 한 번의 변경이 **여러 목록**에 영향을 줄 때 (카테고리별 목록, 검색 결과, 대시보드 숫자)
  - 다른 사용자가 바꿨을 수도 있어서 서버 값을 다시 확인하는 게 안전할 때
- **약점**: 요청이 한 번 더 나가고, 받아오는 동안 잠깐 예전 값이 보인다.

### 비교

| | setQueryData | invalidateQueries |
|---|---|---|
| 네트워크 요청 | 없음 | 있음 (다시 받아오기) |
| 반영 속도 | 즉시 | 응답이 와야 반영 |
| 정확성 | 내가 계산한 값 (틀릴 수 있음) | 서버 값 그대로 |
| 영향 범위 | 지정한 key 하나 | prefix로 관련 쿼리 전부 |
| 맞는 경우 | 응답에 바뀐 객체가 있음, 상세 데이터 | 목록·정렬·개수가 바뀜, 여러 화면에 영향 |

### 실무에서는 둘을 같이 쓴다

1. **응답으로 상세는 바로 고치고, 목록은 무효화**

```ts
onSuccess: (updated) => {
  queryClient.setQueryData(['todo', updated.id], updated);           // 상세: 즉시
  return queryClient.invalidateQueries({ queryKey: ['todos', 'list'] }); // 목록: 서버 기준으로 다시
},
```

2. **낙관적 업데이트(Optimistic Update)**: 요청을 보내기 **전에** setQueryData로 화면을 먼저 바꾸고, 실패하면 되돌리고, 끝나면 invalidateQueries로 서버와 맞춘다.

```ts
useMutation({
  mutationFn: toggleLike,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['post', id] });      // 진행 중인 요청이 덮어쓰지 않게 취소
    const previous = queryClient.getQueryData(['post', id]);          // 되돌릴 값 저장
    queryClient.setQueryData(['post', id], (old) => ({ ...old, liked: !old.liked }));
    return { previous };
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(['post', id], context.previous);         // 실패하면 되돌리기
  },
  onSettled: (data, err, id) => queryClient.invalidateQueries({ queryKey: ['post', id] }), // 최종 확인
});
```

- 낙관적 결과를 보여줄 곳이 한 군데뿐이면, 캐시를 건드리지 않고 `isPending`과 `variables`로 화면에만 임시 항목을 그리는 방법이 코드가 더 적다.

### 면접 답변 요약

- "응답으로 결과를 정확히 알 수 있고 영향 범위가 좁으면 `setQueryData`로 요청 없이 바로 반영하고, 목록이나 개수처럼 서버가 다시 계산해야 하거나 영향 범위가 넓으면 `invalidateQueries`로 다시 받아옵니다. 실무에서는 상세는 setQueryData, 목록은 invalidate처럼 섞어 쓰고, 낙관적 업데이트에서는 setQueryData로 먼저 바꾸고 onSettled에서 invalidate로 서버와 맞춥니다."

### 관련 질문

- [Tanstack-Query란 무엇이며 이를 사용하는 이유는 무엇일까요?](./tanstack-query.md)
- [빠르게 검색 조건을 바꿨을 때 이전 응답이 덮어쓰면 어떻게 하나요?](../web-questions/search-race-condition.md)
- [예약·결제 버튼을 두 번 누르면 어떻게 막나요?](../web-questions/double-submit.md)

### 참고

- [Updates from Mutation Responses (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses)
- [Query Invalidation (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Invalidations from Mutations (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [Optimistic Updates (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
