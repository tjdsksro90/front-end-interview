import { Section, H3, List, Code, OneLiner, WhenToUse, Table, CodeBlock, CodeCompare } from '../components/kit.jsx';
import { WhereToCheck, FolderTree } from '../components/screens.jsx';

export default function DomainLayer() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          비즈니스 로직 분리는 <u>"쿠폰은 최소 주문금액 이상일 때만 적용" 같은 규칙을 컴포넌트에서 꺼내, React도 API도 모르는 순수한 함수·타입(도메인 층)으로 두는 것</u>입니다.
          Clean Architecture와 DDD는 이걸 층과 의존 방향 규칙으로 정리한 설계 방법입니다.
        </OneLiner>

        <Table
          head={['층', '알고 있는 것', '프론트엔드 예']}
          rows={[
            ['Domain (도메인)', <b>아무것도 모름</b>, '타입(Order, Coupon), 규칙 함수 calculateTotal(), canApplyCoupon()'],
            ['Application / Service', '도메인 + "무엇을 할지"의 흐름', 'applyCoupon(): 쿠폰 조회 → 규칙 검사 → 저장 요청'],
            ['Infrastructure', '외부 세계: HTTP, localStorage', 'orderApi.ts (axios), DTO → 도메인 타입 변환'],
            ['UI (Presentation)', '화면, React', 'CartPage, useCart Hook'],
          ]}
        />
        <List
          items={[
            <><b>의존 방향은 안쪽으로만</b>: UI → Service → Domain. 도메인은 React·axios를 import하지 않는다. 그래서 프레임워크를 바꿔도, API 형식이 바뀌어도 규칙은 그대로다.</>,
            <><b>DTO와 도메인 타입 분리</b>: 서버 응답(<Code>order_total_price</Code>)을 그대로 쓰지 않고, 변환 함수(mapper)에서 도메인 타입(<Code>totalPrice</Code>)으로 바꾼다. 백엔드 필드 이름이 바뀌어도 고칠 곳은 한 군데.</>,
            <><b>TypeScript Interface</b>: 도메인 타입과 "API 저장소" 같은 경계를 interface로 정의하면, 테스트에선 가짜 구현을 넣을 수 있다.</>,
            <><b>DDD 용어</b>: 같은 업무 용어(Ubiquitous Language)를 기획·백엔드·프론트가 같이 쓰고, 기능을 도메인(주문, 결제, 회원) 단위로 나눈다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>규칙이 복잡한 화면</b>: 가격·할인·배송비 계산, 권한별 버튼 노출, 예약 가능 시간 계산</>,
            '같은 규칙을 여러 화면(장바구니, 주문서, 관리자)에서 써야 할 때',
            '규칙을 단위 테스트로 확실히 검증해야 할 때 — 순수 함수라 렌더링 없이 테스트',
            '백엔드 API가 자주 바뀌거나 여러 버전이 섞일 때 (mapper로 흡수)',
          ]}
          avoid={[
            '단순 조회 화면(받아서 보여주기만) — 층만 늘고 이득이 없다',
            '모든 프로젝트에 4개 층을 형식적으로 — 작은 앱은 "규칙 함수만 컴포넌트 밖으로" 정도로 충분',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <FolderTree
          title="도메인 단위로 나눈 구조 예"
          lines={[
            'src/',
            '  domains/',
            '    order/',
            '      model/',
            '        types.ts          # Order, OrderItem (도메인 타입)',
            '        rules.ts          # calculateTotal, canApplyCoupon (순수 함수)',
            '        rules.test.ts     # React 없이 테스트',
            '      api/',
            '        orderApi.ts       # axios 호출',
            '        mapper.ts         # OrderDTO → Order',
            '      service/',
            '        applyCoupon.ts    # 흐름: 조회 → 검사 → 저장',
            '      ui/',
            '        CartPage.tsx',
            '        useCart.ts',
          ]}
        />
        <WhereToCheck
          items={[
            { where: '도메인이 React/axios에 의존하지 않는지', path: ['터미널', 'grep -r "from \'react\'" src/domains/*/model'], what: '아무것도 안 나와야 정상. eslint no-restricted-imports 규칙으로 강제할 수 있다.' },
            { where: '규칙 테스트', path: ['터미널', 'npx vitest rules.test.ts'], what: '브라우저·렌더링 없이 밀리초 단위로 돈다.' },
          ]}
        />
      </Section>

      <Section step={3} title="코드">
        <CodeCompare
          before={{
            label: '컴포넌트 안에 규칙',
            code: `
function CartPage() {
  const { data } = useQuery(...);            // data.order_items, data.coupon_info
  const total = data.order_items.reduce((s, i) => s + i.unit_price * i.qty, 0);
  const shipping = total >= 50000 ? 0 : 3000;
  const canUse = data.coupon_info && total >= data.coupon_info.min_price
    && new Date(data.coupon_info.expired_at) > new Date();
  const final = total + shipping - (canUse ? data.coupon_info.discount : 0);
  // 주문서 페이지에도 똑같은 계산이 복붙되어 있다
}`,
            note: '규칙·서버 필드명·화면이 뒤섞여, 규칙이 바뀌면 여러 페이지를 찾아 고쳐야 하고 테스트하려면 렌더링해야 한다.',
          }}
          after={{
            label: '도메인 분리',
            code: `
// domains/order/model/types.ts
export interface OrderItem { price: number; quantity: number }
export interface Coupon { discount: number; minPrice: number; expiresAt: Date }

// domains/order/model/rules.ts — 순수 함수, 의존성 없음
export const subtotal = (items: OrderItem[]) =>
  items.reduce((s, i) => s + i.price * i.quantity, 0);
export const shippingFee = (amount: number) => (amount >= 50_000 ? 0 : 3_000);
export const canApplyCoupon = (c: Coupon, amount: number, now = new Date()) =>
  amount >= c.minPrice && c.expiresAt > now;

// domains/order/api/mapper.ts — 서버 형식은 여기서만
export const toOrder = (dto: OrderDTO): Order => ({
  items: dto.order_items.map((i) => ({ price: i.unit_price, quantity: i.qty })),
  coupon: dto.coupon_info && { discount: dto.coupon_info.discount,
    minPrice: dto.coupon_info.min_price, expiresAt: new Date(dto.coupon_info.expired_at) },
});

// ui/CartPage.tsx — 화면은 규칙을 "사용"만
const amount = subtotal(order.items);
const final = amount + shippingFee(amount) - (canApplyCoupon(order.coupon, amount) ? order.coupon.discount : 0);`,
            note: '규칙은 한 곳, 서버 형식 변환도 한 곳. 규칙 테스트는 함수 호출 한 줄이다.',
          }}
        />
        <CodeBlock
          title="rules.test.ts"
          code={`
test('5만원 이상이면 배송비 무료', () => {
  expect(shippingFee(50_000)).toBe(0);
  expect(shippingFee(49_999)).toBe(3_000);
});
test('만료된 쿠폰은 적용 불가', () => {
  const coupon = { discount: 5000, minPrice: 0, expiresAt: new Date('2020-01-01') };
  expect(canApplyCoupon(coupon, 100_000)).toBe(false);
});`}
        />
      </Section>
    </>
  );
}
