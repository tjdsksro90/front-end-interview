# Q : 버튼을 연타해서 같은 저장 요청이 두 번 나가는 문제(중복 제출)는 어떻게 막나요?

<br />

# A : 저장·결제·주문 버튼을 빠르게 두 번 누르거나, 응답이 느려서 사용자가 다시 누르면 **같은 요청이 두 번 서버에 도착해서 주문이 두 개 생기는** 문제가 생깁니다. 막는 방법은 층을 나눠서 겹칩니다. 화면에서는 **요청이 진행 중인 동안 버튼을 비활성화**하고(`isPending`), 클릭 핸들러 안에서도 **진행 중이면 바로 return**합니다. 하지만 클라이언트 방어는 네트워크 재시도, 새로고침, 여러 탭 앞에서는 완벽하지 않습니다. 그래서 돈이 오가거나 데이터가 생기는 요청은 **멱등 키(idempotency key)**를 함께 보내서, 서버가 같은 키로 온 두 번째 요청에 **처음 결과를 그대로 돌려주게** 만드는 것이 확실한 방법입니다.

### 왜 생기나

| 상황 | 결과 |
|---|---|
| 더블 클릭, 연타 | 같은 요청 2번 이상 |
| 응답이 느려서 다시 누름 | 첫 요청은 이미 처리 중 |
| 네트워크 끊김 후 자동 재시도 | 서버는 처리했는데 응답만 못 받음 → 재시도 |
| Enter 키 + 버튼 클릭 | 폼 제출 두 번 |

- 특히 세 번째가 까다롭다. 클라이언트는 실패로 알지만 서버는 이미 저장했다. 버튼 비활성화로는 막을 수 없다.

### 1단계: 버튼 막기 (화면)

```jsx
const createOrder = useMutation({ mutationFn: api.createOrder });

<button
  type="submit"
  disabled={createOrder.isPending}
  onClick={() => createOrder.mutate(order)}
>
  {createOrder.isPending ? '주문 중...' : '주문하기'}
</button>
```

- TanStack Query v5는 진행 중 상태를 `isPending`으로 알려 준다.
- **한계**: `disabled`는 상태가 바뀌고 다시 렌더링된 뒤에 적용된다. 그 사이 아주 빠른 두 번째 클릭은 통과할 수 있다.

### 2단계: 핸들러에서 한 번 더 막기

```jsx
const submittingRef = useRef(false);

async function handleSubmit() {
  if (submittingRef.current) return; // 렌더링을 기다리지 않고 바로 막는다
  submittingRef.current = true;
  try {
    await api.createOrder(order);
  } finally {
    submittingRef.current = false; // 실패해도 다시 누를 수 있게
  }
}
```

- state는 다음 렌더링부터 바뀌지만 ref는 **즉시** 바뀐다. 같은 이벤트 처리 중 두 번째 호출을 확실히 막는다.
- `finally`에서 꼭 풀어 준다. 안 풀면 실패 후 버튼이 영원히 막힌다.

### React 19 폼 Action

```jsx
function SubmitButton() {
  const { pending } = useFormStatus(); // 부모 <form>이 제출 중이면 true
  return <button type="submit" disabled={pending}>{pending ? '저장 중...' : '저장'}</button>;
}

<form action={saveAction}>
  ...
  <SubmitButton />
</form>
```

- `useFormStatus`는 `<form>` **안에서 렌더링되는 컴포넌트**에서 불러야 한다. 같은 컴포넌트에 있는 form의 상태는 알려 주지 않는다.
- `useActionState`의 `isPending`도 쓸 수 있다. 이 Hook은 여러 번 호출된 action을 **순서대로 하나씩** 실행한다. 겹쳐 실행되지는 않지만, 두 번 누르면 두 번 실행되는 것은 같다.

### 3단계: 멱등 키 (서버와 함께)

```js
// 주문 화면을 열 때(또는 폼마다) 키를 한 번 만든다
const idempotencyKey = crypto.randomUUID();

await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
  body: JSON.stringify(order),
});
// 재시도할 때도 같은 키를 보낸다
```

- 서버는 키와 첫 요청의 결과를 저장해 두고, **같은 키로 다시 오면 다시 처리하지 않고 저장한 결과를 돌려준다.**
- 결제 API를 만드는 Stripe가 이 방식을 쓴다. 예를 들어:
  - 헤더 이름은 `Idempotency-Key`이고, 키는 클라이언트가 UUID v4 같은 충분히 무작위인 값으로 만든다.
  - 같은 키로 다른 내용을 보내면 에러를 낸다.
  - 키는 24시간이 지나면 지워질 수 있다.
  - GET·DELETE는 원래 여러 번 보내도 결과가 같으므로 키가 필요 없다.
- **키는 "같은 의도"마다 하나**다. 클릭할 때마다 새로 만들면 의미가 없다. 사용자가 내용을 고쳐 새로 주문하면 그때 새 키를 만든다.

### 그 밖의 서버 방어

- DB 고유 제약(unique constraint): 같은 주문 번호나 같은 사용자·같은 날의 신청 같은 중복을 DB가 거부하게 한다.
- 상태 확인: "결제 대기" 상태일 때만 결제 처리하게 해서 두 번째 요청은 건너뛰게 한다.

### 정리

| 층 | 방법 | 막는 것 | 못 막는 것 |
|---|---|---|---|
| 화면 | `disabled={isPending}` | 대부분의 연타 | 렌더링 전 아주 빠른 클릭 |
| 핸들러 | ref 플래그 | 같은 탭의 중복 호출 | 새로고침, 다른 탭, 재시도 |
| 서버 | 멱등 키, 고유 제약 | **모든 중복 처리** | — |

- 면접 답변 요약: "중복 제출은 연타뿐 아니라 느린 응답에 다시 누르거나, 서버는 처리했는데 응답을 못 받아 재시도할 때도 생깁니다. 화면에서는 isPending으로 버튼을 비활성화하고, 렌더링 전의 빠른 클릭까지 막기 위해 핸들러에서 ref 플래그로 진행 중이면 바로 return합니다. 하지만 클라이언트 방어는 재시도나 다른 탭을 막지 못하므로, 결제나 주문처럼 중요한 요청은 Idempotency-Key 헤더로 멱등 키를 보내서 서버가 같은 키의 두 번째 요청에 처음 결과를 그대로 돌려주게 합니다. DB 고유 제약도 함께 걸어 둡니다."

### 관련 질문

- [검색창처럼 요청이 연달아 나갈 때 응답 순서가 뒤바뀌는 문제(race condition)는 어떻게 막나요?](./request-race-condition.md)
- [useState와 useRef의 차이점을 설명해주세요.](./useRef-useState-diffrence.md)
- [TanStack Query의 setQueryData와 invalidateQueries는 언제 사용하나요?](./setquerydata-invalidatequeries.md)

### 참고

- [Mutations (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [useFormStatus (React 문서)](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [useActionState (React 문서)](https://react.dev/reference/react/useActionState)
- [Idempotent requests (Stripe API 문서)](https://docs.stripe.com/api/idempotent_requests)
