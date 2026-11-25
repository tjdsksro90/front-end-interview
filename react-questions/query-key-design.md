# Q : TanStack Query의 queryKey는 어떻게 설계해야 하나요?

<br />

# A : queryKey는 **캐시의 주소**입니다. TanStack Query는 키가 같으면 같은 데이터로 보고 캐시를 공유하고, 키가 바뀌면 다른 데이터로 보고 새로 요청합니다. 그래서 가장 중요한 규칙은 공식 문서의 말 그대로 **"queryFn이 쓰는 변수는 모두 queryKey에 넣는다"**입니다. 페이지 번호나 필터를 키에서 빠뜨리면 1페이지와 2페이지가 같은 캐시를 써서 **다른 데이터가 섞여 보이고**, 값이 바뀌어도 다시 요청하지 않습니다. 구조는 **넓은 것에서 좁은 것 순서**(`['todos', 'list', { filters }]`, `['todos', 'detail', id]`)로 만듭니다. `invalidateQueries`가 키의 **앞부분(prefix)으로 일치**하기 때문에, 이렇게 계층을 두면 "할 일 전체", "목록만", "이 상세만"처럼 무효화 범위를 정확히 고를 수 있습니다. 키를 여기저기 문자열로 쓰지 말고 **쿼리 키 팩토리**로 한 곳에서 만들면 오타와 불일치를 막습니다.

### 규칙 1: queryFn이 쓰는 값은 모두 키에

```jsx
// X: page가 키에 없다 → page를 바꿔도 같은 캐시, 다시 요청하지 않음
useQuery({ queryKey: ['todos'], queryFn: () => fetchTodos({ page, status }) });

// O
useQuery({ queryKey: ['todos', 'list', { page, status }], queryFn: () => fetchTodos({ page, status }) });
```

- 키는 Effect의 의존성 배열과 같은 역할이다. 키 안의 값이 바뀌면 새 쿼리로 보고 요청한다(`staleTime`에 따라).
- 사용자별 데이터라면 **사용자 ID도 키에** 넣는다. 로그아웃 후 다른 계정으로 로그인했을 때 이전 사용자의 캐시가 보이는 사고를 막는다.

### 규칙 2: 키는 배열이고, 직렬화할 수 있어야 한다

```js
['todos']                              // 전체 목록
['todo', 5]                            // id 5
['todos', { type: 'done' }]            // 조건이 있는 목록
```

- 키는 `JSON.stringify`로 직렬화할 수 있어야 한다. 함수, 클래스 인스턴스, Date 객체를 넣지 않는다(Date는 문자열로).
- 키는 결정적으로 해시된다. **객체 안의 속성 순서는 상관없다.**

```js
['todos', { status, page }]  ===  ['todos', { page, status }]          // 같은 키
['todos', status, page]      !==  ['todos', page, status]              // 배열 순서는 중요
```

- 그래서 조건이 여러 개면 배열에 나열하지 말고 **객체 하나로** 묶는 편이 안전하다.

### 규칙 3: 넓은 것 → 좁은 것 (계층)

```
['todos']                                 ← 할 일과 관련된 모든 것
['todos', 'list']                         ← 모든 목록
['todos', 'list', { status: 'done' }]     ← 완료 목록
['todos', 'detail']                       ← 모든 상세
['todos', 'detail', 5]                    ← 5번 상세
```

```js
queryClient.invalidateQueries({ queryKey: ['todos'] });                      // 위 전부
queryClient.invalidateQueries({ queryKey: ['todos', 'list'] });              // 목록만 (상세는 유지)
queryClient.invalidateQueries({ queryKey: ['todos', 'list'], exact: true }); // 정확히 이 키만
```

- `invalidateQueries`는 앞부분이 일치하는 모든 쿼리를 무효화한다. 계층이 없으면 "목록만 새로고침"을 표현할 수 없다.
- 할 일 하나를 수정했다면: 상세는 `setQueryData`로 바로 고치고, 목록은 `['todos', 'list']`로 무효화하는 식으로 범위를 고른다.

### 쿼리 키 팩토리

```js
// features/todos/queries.js
export const todoKeys = {
  all: ['todos'],
  lists: () => [...todoKeys.all, 'list'],
  list: (filters) => [...todoKeys.lists(), filters],
  details: () => [...todoKeys.all, 'detail'],
  detail: (id) => [...todoKeys.details(), id],
};

// 사용
useQuery({ queryKey: todoKeys.detail(id), queryFn: () => fetchTodo(id) });
queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
```

- 키를 쓰는 곳(useQuery)과 무효화하는 곳(mutation)이 **같은 함수**를 쓰므로, `'todo'`와 `'todos'` 같은 오타로 무효화가 조용히 실패하는 일이 없다.
- TanStack Query 메인테이너의 블로그(TkDodo)는 팩토리를 전역 파일 하나가 아니라 **기능 폴더마다** 두는 방식을 소개한다.

### 자주 하는 실수

| 실수 | 증상 |
|---|---|
| 필터·페이지·검색어를 키에서 뺌 | 조건을 바꿔도 화면이 그대로, 다른 페이지 데이터가 보임 |
| 사용자 ID를 키에서 뺌 | 계정을 바꿨는데 이전 사용자 데이터가 보임 |
| 같은 데이터에 다른 키 (`['user', id]`, `['users', id]`) | 한쪽만 갱신돼 화면끼리 어긋남, 중복 요청 |
| 목록·상세를 계층 없이 (`['todoList']`, `['todoDetail', id]`) | 한 번에 무효화할 수 없음 |
| `useQuery`와 `useInfiniteQuery`에 같은 키 | 캐시 데이터 모양이 달라 충돌 |

- 면접 답변 요약: "queryKey는 캐시의 주소라서 키가 같으면 캐시를 공유하고, 바뀌면 새로 요청합니다. 그래서 queryFn이 쓰는 페이지, 필터, 검색어, 사용자 ID 같은 값은 모두 키에 넣어야 하고, 빠뜨리면 다른 조건의 데이터가 섞여 보이거나 값이 바뀌어도 다시 요청하지 않습니다. 키는 직렬화할 수 있는 배열이고, 객체 속성 순서는 상관없지만 배열 순서는 중요해서 조건은 객체로 묶습니다. 구조는 todos, list, 필터처럼 넓은 것에서 좁은 것 순서로 만들어 invalidateQueries의 앞부분 일치로 무효화 범위를 고르고, 쿼리 키 팩토리로 한 곳에서 만들어 오타와 불일치를 막습니다."

### 관련 질문

- [TanStack Query의 setQueryData와 invalidateQueries는 언제 사용하나요?](./setquerydata-invalidatequeries.md)
- [React Query의 staleTime에 대해서 설명해주세요.](./react-query-staletime.md)
- [낙관적 업데이트(optimistic update)는 어떻게 구현하고, 실패하면 어떻게 되돌리나요?](./optimistic-update.md)
- [검색창처럼 요청이 연달아 나갈 때 응답 순서가 뒤바뀌는 문제(race condition)는 어떻게 막나요?](./request-race-condition.md)

### 참고

- [Query Keys (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Query Invalidation (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Effective React Query Keys (TkDodo 블로그)](https://tkdodo.eu/blog/effective-react-query-keys)
