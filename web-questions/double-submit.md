# Q : 예약·결제 버튼을 두 번 누르면 어떻게 막나요?

<br />

# A : 프론트엔드에서는 요청이 진행 중일 때 버튼을 비활성화하고, 같은 함수가 다시 실행되지 않도록 진행 중 상태를 즉시 확인하는 잠금(lock)을 둡니다. 하지만 이것만으로는 완벽하지 않습니다. 새로고침, 네트워크 재시도, 여러 탭, 직접 API 호출은 화면에서 막을 수 없기 때문입니다. 그래서 요청마다 고유한 멱등성 키(Idempotency Key)를 함께 보내고, 서버가 같은 키의 요청은 한 번만 처리하도록 하는 것이 최종 방어선입니다.

### 왜 문제가 되나

- 결제·예약·주문은 **두 번 실행되면 안 되는 요청**이다. 두 번 누르면 결제가 두 번 되거나, 같은 좌석이 두 번 잡힌다.
- 두 번 눌리는 경우는 생각보다 많다.
  - 응답이 느려서 사용자가 다시 누름 (더블클릭, 연타)
  - 응답을 받기 전에 네트워크가 끊겨 **클라이언트가 자동 재시도** → 사실 서버는 첫 요청을 이미 처리했음
  - 결제 완료 후 뒤로 가기·새로고침으로 폼 다시 제출
  - 같은 페이지를 탭 두 개에서 열고 각각 누름

### 1단계: 버튼 비활성화 + 로딩 표시

```tsx
const pay = useMutation({ mutationFn: requestPayment });

<button onClick={() => pay.mutate(order)} disabled={pay.isPending}>
  {pay.isPending ? '결제 중...' : '결제하기'}
</button>
```

- 사용자에게 "처리 중"이라는 걸 보여줘서 다시 누를 이유를 없앤다.
- **한계**: `disabled`는 state가 바뀌고 **다시 렌더된 뒤**에 적용된다. 아주 빠른 더블클릭은 렌더 전에 두 번째 클릭이 들어올 수 있다. 엔터 키 제출, form의 `onSubmit`도 따로 막아야 한다.

### 2단계: 즉시 확인하는 잠금 (useRef)

```tsx
const submitting = useRef(false);

async function handlePay() {
  if (submitting.current) return; // 렌더를 기다리지 않고 바로 막는다
  submitting.current = true;
  try {
    await requestPayment(order);
    navigate('/complete', { replace: true }); // 완료 페이지로 교체 → 뒤로 가기로 다시 제출 방지
  } finally {
    submitting.current = false;
  }
}
```

- `useRef`는 값을 바꾸면 **즉시** 반영되므로, 같은 이벤트 루프 안에서 들어온 두 번째 클릭도 막는다. (`useState`는 다음 렌더 전까지 이전 값이 보인다)
- 디바운스/쓰로틀로 막기도 하지만, "첫 클릭은 바로 실행하고 진행 중에는 무시"가 결제에는 더 맞다. 디바운스는 첫 클릭을 늦춘다.

### 3단계: 멱등성 키 (Idempotency Key) — 서버와 함께

```ts
// 결제 화면에 들어올 때(또는 주문을 만들 때) 키를 한 번 만든다
const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
  body: JSON.stringify({ orderId, amount }),
});
```

- 같은 결제 시도에는 **같은 키**를 쓴다. 재시도나 두 번째 클릭도 같은 키로 간다.
- 서버는 키를 저장해 두고
  - 처음 보는 키 → 처리하고 결과를 키와 함께 저장
  - 이미 처리한 키 → **다시 처리하지 않고 저장된 결과를 그대로 돌려준다**
  - 같은 키인데 내용(금액 등)이 다르면 → 에러
- 그래서 클라이언트는 "응답을 못 받았으면 같은 키로 안심하고 재시도"할 수 있다. Stripe 같은 결제 API가 이 방식을 쓴다 (Stripe는 같은 키로 다시 보내면 처음 저장한 응답을 그대로 돌려준다).
- 키는 한 번의 **결제 시도**를 뜻한다. 사용자가 실패 후 정보를 바꿔 새로 결제하면 새 키를 만든다.

### 서버에서 추가로 막는 것

- **주문 번호 기준 중복 확인**: 같은 주문 ID로 이미 결제 완료면 거절한다. 결제 API에 주문 ID(merchant order id)를 넘기면 결제사가 중복을 막아주기도 한다.
- **DB 유니크 제약**: 예약 테이블에 `(좌석, 회차)` 유니크 키를 걸면 동시에 두 요청이 와도 하나만 들어간다.
- **락 / 재고 차감을 원자적으로**: `UPDATE ... SET stock = stock - 1 WHERE stock > 0`처럼 조건부 업데이트로 초과 예약을 막는다.

### 정리

| 단계 | 방법 | 막는 것 | 못 막는 것 |
|---|---|---|---|
| UI | `disabled`, 로딩 표시 | 일반적인 재클릭 | 렌더 전 연타, 다른 탭, 재시도 |
| 클라이언트 잠금 | `useRef` 플래그 | 빠른 더블클릭, 엔터 연타 | 새로고침, 다른 탭, 재시도 |
| 화면 이동 | 완료 후 `replace` 이동 | 뒤로 가기로 다시 제출 | 다른 탭, 재시도 |
| 서버 | 멱등성 키, 주문 ID 중복 확인, 유니크 제약 | **모든 중복 요청** | — |

- 면접 답변 요약: "프론트에서는 진행 중 버튼을 비활성화하고, 렌더 전에 들어오는 연타는 useRef 잠금으로 막습니다. 완료 후에는 replace로 이동해 뒤로 가기 재제출을 막습니다. 다만 재시도·다른 탭·직접 호출은 화면에서 막을 수 없어서, 요청마다 멱등성 키를 보내 서버가 같은 키는 한 번만 처리하게 하는 것이 최종 방어선입니다."

### 관련 질문

- [빠르게 검색 조건을 바꿨을 때 이전 응답이 덮어쓰면 어떻게 하나요?](./search-race-condition.md)
- [TanStack Query의 setQueryData와 invalidateQueries는 언제 사용하나요?](../react-questions/setquerydata-invalidatequeries.md)

### 참고

- [Idempotent requests (Stripe API 문서)](https://docs.stripe.com/api/idempotent_requests)
- [useMutation (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
