# Q : 낙관적 업데이트(optimistic update)는 어떻게 구현하고, 실패하면 어떻게 되돌리나요?

<br />

# A : 낙관적 업데이트는 서버 응답을 기다리지 않고 **"성공할 것"이라고 가정해서 화면을 먼저 바꾸는** 방법입니다. 좋아요, 할 일 체크, 댓글 작성처럼 대부분 성공하는 작업에서 화면이 즉시 반응해 빠르게 느껴집니다. TanStack Query에서는 두 가지 방법이 있습니다. 결과를 한 곳에서만 보여 주면 **mutation의 `variables`와 `isPending`으로 화면에만 임시 항목을 그리는 방법**이 간단합니다. 여러 화면에 반영해야 하면 **`onMutate`에서 캐시를 직접 고칩니다.** 이때 순서가 중요합니다. ① 진행 중인 조회를 `cancelQueries`로 취소해 늦게 온 응답이 낙관적 값을 덮지 않게 하고, ② 이전 데이터를 스냅샷으로 저장하고, ③ 캐시를 새 값으로 바꿉니다. 실패하면 `onError`에서 **스냅샷으로 되돌리고**, 성공이든 실패든 `onSettled`에서 **`invalidateQueries`로 서버와 다시 맞춥니다.**

### 흐름

```
클릭 ─▶ onMutate: 조회 취소 → 스냅샷 저장 → 캐시를 새 값으로 (화면 즉시 변경)
          │
          ├─ 서버 성공 ─┐
          └─ 서버 실패 ─▶ onError: 스냅샷으로 되돌림 (+ 에러 안내)
                        ▼
                 onSettled: invalidateQueries → 서버 값으로 최종 확인
```

### 방법 1: 화면에서만 (variables 사용)

```jsx
const addTodo = useMutation({
  mutationFn: (text) => api.post('/todos', { text }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }), // Promise를 return
});

<ul>
  {todos.map((todo) => <li key={todo.id}>{todo.text}</li>)}
  {addTodo.isPending && <li style={{ opacity: 0.5 }}>{addTodo.variables}</li>}
  {addTodo.isError && (
    <li>
      {addTodo.variables} 추가 실패 <button onClick={() => addTodo.mutate(addTodo.variables)}>다시 시도</button>
    </li>
  )}
</ul>
```

- 캐시를 건드리지 않으므로 **되돌릴 것도 없다.** 실패하면 임시 항목이 에러 표시로 바뀔 뿐이다.
- `onSettled`에서 invalidate의 Promise를 **return**하면, 다시 받아올 때까지 mutation이 pending으로 남아 임시 항목과 실제 항목이 동시에 보이는 깜빡임이 없다.
- 실패해도 `variables`는 남아 있어서 "다시 시도"에 그대로 쓸 수 있다.
- 다른 컴포넌트에서 진행 중인 mutation을 보려면 `useMutationState`와 `mutationKey`를 쓴다.

### 방법 2: 캐시를 직접 고치기 (onMutate)

```jsx
const queryClient = useQueryClient();

const toggleTodo = useMutation({
  mutationFn: (todo) => api.patch(`/todos/${todo.id}`, { done: !todo.done }),

  onMutate: async (todo) => {
    // ① 진행 중인 조회 취소: 늦게 도착한 옛 응답이 낙관적 값을 덮어쓰지 않게
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    // ② 되돌릴 때 쓸 스냅샷
    const previousTodos = queryClient.getQueryData(['todos']);
    // ③ 캐시를 새 값으로 (불변성 유지: 새 배열·새 객체)
    queryClient.setQueryData(['todos'], (old = []) =>
      old.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
    );
    return { previousTodos }; // onError, onSettled에 전달된다
  },

  onError: (err, todo, onMutateResult) => {
    // ④ 실패: 스냅샷으로 되돌림
    queryClient.setQueryData(['todos'], onMutateResult?.previousTodos);
    toast.error('변경하지 못했어요. 다시 시도해 주세요.');
  },

  onSettled: () =>
    // ⑤ 성공이든 실패든 서버 값으로 다시 맞춤
    queryClient.invalidateQueries({ queryKey: ['todos'] }),
});
```

- `onMutate`에서 돌려준 값은 `onError`와 `onSettled`의 세 번째 인자로 들어온다. 최신 v5 문서는 이것을 `onMutateResult`로 부르고, 마지막 인자로 `context`(`context.client`로 QueryClient 접근)를 하나 더 준다. 버전에 따라 인자 모양이 다르니 설치한 버전의 문서를 확인한다.
- **왜 ①이 필요한가**: 클릭 직전에 시작된 목록 조회가 클릭 후에 도착하면, 바뀌기 전 데이터가 캐시를 덮어써서 체크가 풀린 것처럼 보인다. 경쟁 상태를 막는 단계다.
- 상세와 목록처럼 **여러 캐시**에 나오면 각각 스냅샷·수정·되돌리기를 해야 한다. 그래서 마지막 ⑤가 안전망 역할을 한다.

### 두 방법 비교

| | variables (화면) | onMutate (캐시) |
|---|---|---|
| 코드 양 | 적음 | 많음 |
| 되돌리기 | 필요 없음 | 스냅샷으로 직접 |
| 여러 화면에 반영 | 어려움 | 캐시를 보는 모든 화면에 반영 |
| 잘 맞는 곳 | 목록에 항목 추가, 한 화면 | 좋아요·체크처럼 여러 곳에 보이는 값 |

### 조심할 것

- **연속 클릭**: 같은 항목을 빠르게 여러 번 토글하면 mutation이 겹친다. 먼저 끝난 요청의 `onSettled`가 invalidate하면서 아직 진행 중인 낙관적 값을 서버 값으로 덮을 수 있다. 같은 `scope.id`를 주면 mutation이 순서대로 하나씩 실행된다. 또는 진행 중인 mutation이 남아 있을 때는 invalidate를 건너뛰는 방법도 있다.
- **임시 ID**: 새 항목은 아직 서버 ID가 없다. 임시 ID로 그리고, 성공하면 invalidate나 응답으로 진짜 항목으로 바꾼다. 임시 항목으로 상세 페이지 이동 같은 동작은 막는다.
- **쓰지 말아야 할 곳**: 결제, 재고 차감, 서버 검증이 자주 실패하는 작업. 실패 후 되돌아가면 사용자가 더 혼란스럽다. 이런 곳은 로딩을 보여 주고 응답을 기다린다.
- TanStack Query 없이 React 19의 폼 Action을 쓴다면, `useActionState` 문서가 안내하듯 즉시 피드백은 `useOptimistic`으로 보여 준다.

- 면접 답변 요약: "낙관적 업데이트는 서버 응답을 기다리지 않고 성공을 가정해 화면을 먼저 바꾸는 방식입니다. TanStack Query에서 한 화면에만 보이면 mutation의 variables와 isPending으로 임시 항목만 그려 되돌릴 필요가 없게 하고, 여러 화면에 반영해야 하면 onMutate에서 캐시를 고칩니다. 이때 cancelQueries로 진행 중인 조회를 취소해 늦은 응답이 덮어쓰지 않게 하고, 이전 데이터를 스냅샷으로 저장한 뒤 setQueryData로 바꿉니다. 실패하면 onError에서 스냅샷으로 되돌리고, onSettled에서 invalidateQueries로 서버 값과 다시 맞춥니다. 결제처럼 실패하면 혼란이 큰 작업에는 쓰지 않습니다."

### 관련 질문

- [TanStack Query의 setQueryData와 invalidateQueries는 언제 사용하나요?](./setquerydata-invalidatequeries.md)
- [검색창처럼 요청이 연달아 나갈 때 응답 순서가 뒤바뀌는 문제(race condition)는 어떻게 막나요?](./request-race-condition.md)
- [버튼을 연타해서 같은 저장 요청이 두 번 나가는 문제(중복 제출)는 어떻게 막나요?](./duplicate-submit.md)

### 참고

- [Optimistic Updates (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Mutations (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Query Cancellation (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [useActionState (React 문서)](https://react.dev/reference/react/useActionState)
