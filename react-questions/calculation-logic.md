# Q : 합계·할인 같은 금액 계산 로직은 어디에 두고, 무엇을 조심해야 하나요?

<br />

# A : 금액 계산은 컴포넌트 안에 흩어 두지 말고 **React와 상관없는 순수 함수로 분리**하는 것이 좋습니다. 같은 입력이면 항상 같은 결과를 내는 함수로 만들어 두면 **단위 테스트로 경계값을 검증**할 수 있고, 장바구니·주문서·결제 화면이 **같은 규칙을 공유**해서 화면마다 금액이 달라지는 일을 막습니다. 조심할 것은 세 가지입니다. 첫째, JavaScript의 숫자는 2진 부동소수점이라 `0.1 + 0.2`가 `0.3`이 아니듯 **소수 계산에 오차**가 생기므로, 금액은 원·센트 같은 **가장 작은 단위의 정수**로 계산하고 반올림 시점과 방식을 정해 둡니다. 둘째, 할인 적용 순서, 최소 금액, 0원 이하 같은 **경계값**을 규칙으로 명확히 합니다. 셋째, 화면의 계산은 보여 주기용이고 **최종 금액은 서버가 다시 계산**해야 합니다.

### 순수 함수로 분리

```js
// src/domain/cart.js — React를 모르는 순수 함수
export function calcCartTotal(items, coupon) {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0); // 원 단위 정수
  const discount = calcDiscount(subtotal, coupon);
  const shipping = subtotal - discount >= 50000 ? 0 : 3000;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

function calcDiscount(subtotal, coupon) {
  if (!coupon) return 0;
  if (subtotal < coupon.minAmount) return 0;              // 최소 주문 금액
  const raw = coupon.type === 'rate'
    ? Math.floor((subtotal * coupon.rate) / 100)          // 원 미만은 버림 (규칙으로 정함)
    : coupon.amount;
  return Math.min(raw, coupon.maxDiscount ?? raw, subtotal); // 최대 할인, 상품 금액 초과 금지
}
```

```jsx
// 컴포넌트는 결과를 보여 주기만 한다 (파생 값이므로 state에 넣지 않는다)
function CartSummary({ items, coupon }) {
  const { subtotal, discount, shipping, total } = calcCartTotal(items, coupon);
  return <p>결제 금액 {formatKRW(total)}</p>;
}
```

- 규칙이 한 곳에 있으니 "배송비 기준이 바뀌었다"면 함수 하나만 고친다.
- 계산 결과는 state가 아니라 렌더링 중에 계산한다. 원본(`items`, `coupon`)과 어긋날 수 없다.

### 부동소수점 오차

```js
0.1 + 0.2;          // 0.30000000000000004
0.1 + 0.2 === 0.3;  // false
```

- 2진수는 `0.1`을 정확히 표현할 수 없다. 금액에 소수가 섞이면 이런 오차가 쌓인다.
- **해결: 가장 작은 단위의 정수로 계산한다.** 원화는 원 단위, 달러는 센트 단위(12.34달러 → 1234). 정수끼리의 덧셈·곱셈은 `Number.MAX_SAFE_INTEGER` 안에서 정확하다.
- 비율(할인율, 세율)을 곱하면 소수가 나오므로, **반올림을 언제 어떻게 할지**를 규칙으로 정한다(항목마다? 합계에서 한 번?). 둘의 결과가 다를 수 있다.
- 비교할 때 `Number.EPSILON`을 허용 오차로 쓰는 방법도 있지만, MDN은 값이 커지면 이 값이 너무 작아 맞지 않는다고 경고한다. 금액은 정수로 계산하는 편이 낫다.
- 소수 계산이 꼭 필요하면 decimal 라이브러리를 쓴다.

### 반올림 함정

```js
Math.round(20.5);   // 21
Math.round(-20.5);  // -20  ← 음수 .5는 0 쪽이 아니라 +∞ 쪽으로
Math.round(-20.51); // -21
```

- `Math.round`는 정확히 .5일 때 **+∞ 방향**으로 올린다. 많은 언어의 "0에서 멀어지는 반올림"과 다르다. 환불·차감처럼 음수가 나오는 계산에서 결과가 어긋날 수 있다.
- 할인은 보통 "원 미만 버림(`Math.floor`)"처럼 업무 규칙이 따로 있다. 기획·백엔드와 같은 규칙을 쓰는지 확인한다.

### 표시는 Intl.NumberFormat

```js
const krw = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });
krw.format(123456); // "₩123,456"
```

- 계산과 표시를 분리한다. 계산 함수는 숫자를 돌려주고, 쉼표·통화 기호는 표시할 때만 붙인다.
- 엔화처럼 소수 단위가 없는 통화도 있다. MDN 예시에서 `JPY`로 `123456.789`를 포맷하면 `￥123,457`이 된다.

### 테스트할 경계값

```js
import { describe, it, expect } from 'vitest';

describe('calcCartTotal', () => {
  it('최소 주문 금액 미만이면 쿠폰을 적용하지 않는다', () => { /* ... */ });
  it('할인은 최대 할인 금액을 넘지 않는다', () => { /* ... */ });
  it('할인 후 금액이 정확히 50000원이면 배송비가 0원이다', () => { /* ... */ });
  it('빈 장바구니는 0원이다', () => { /* ... */ });
  it('할인이 상품 금액보다 커도 결제 금액은 0원 밑으로 가지 않는다', () => { /* ... */ });
});
```

- `>=`와 `>` 하나 차이로 49,999원, 50,000원, 50,001원의 결과가 바뀐다. 경계 바로 아래·정확히·바로 위를 모두 테스트한다.
- 수량 0, 음수, 품절 상품, 쿠폰 두 개 중복 같은 비정상 입력도 정한다.

### 서버가 최종 기준

- 화면의 금액은 사용자에게 보여 주기 위한 값이다. 클라이언트 코드는 조작할 수 있으므로 **결제할 금액은 서버가 상품 가격과 쿠폰을 다시 조회해서 계산**한다.
- 그래서 클라이언트와 서버의 계산 규칙이 같아야 한다. 가능하면 서버가 계산한 견적(합계·할인·배송비)을 받아서 보여 주는 방식이 가장 안전하다.

- 면접 답변 요약: "금액 계산은 컴포넌트에 흩어 두지 않고 React와 무관한 순수 함수로 분리해서 여러 화면이 같은 규칙을 쓰게 하고, 최소 주문 금액이나 무료 배송 기준 같은 경계값을 단위 테스트로 검증합니다. JavaScript 숫자는 부동소수점이라 0.1 더하기 0.2가 0.3이 아니므로 금액은 원이나 센트 단위의 정수로 계산하고, 할인율을 곱할 때의 반올림 시점과 방식을 규칙으로 정합니다. Math.round는 음수 .5를 +무한대 쪽으로 올리는 점도 주의합니다. 표시는 Intl.NumberFormat으로 분리하고, 클라이언트 계산은 보여 주기용이라 최종 결제 금액은 서버가 다시 계산해야 합니다."

### 관련 질문

- [props나 state로 계산할 수 있는 값을 state로 따로 두면 왜 문제가 되나요?](./derived-state.md)
- [일반 함수 대신 커스텀 훅을 사용하는 이유는 무엇인가요?](./custom-hook.md)

### 참고

- [Number.EPSILON (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON)
- [Math.round() (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)
- [Intl.NumberFormat (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
