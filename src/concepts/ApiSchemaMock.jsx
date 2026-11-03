import { Section, H3, List, Code, OneLiner, WhenToUse, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function ApiSchemaMock() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          OpenAPI는 <u>API의 경로·요청·응답 형식을 기계가 읽을 수 있게 적은 명세(스키마)</u>이고, Swagger UI는 그 명세를 문서 화면으로 보여주는 도구입니다.
          프론트엔드는 이 명세로 TypeScript 타입을 자동 생성하고, 백엔드가 아직 없어도 Mock 서버(MSW)로 같은 형식의 가짜 응답을 받아 먼저 개발합니다.
        </OneLiner>

        <Table
          head={['도구', '역할']}
          rows={[
            ['OpenAPI Spec (openapi.yaml)', 'API 계약서. 백엔드가 코드에서 자동 생성하거나 먼저 설계(API First)'],
            ['Swagger UI', '명세를 보고 직접 요청을 보내볼 수 있는 문서 페이지 (/swagger-ui, /docs)'],
            [<Code>openapi-typescript</Code>, '명세 → TypeScript 타입 파일 생성. orval·openapi-generator는 API 함수·React Query Hook까지 생성'],
            ['MSW (Mock Service Worker)', '브라우저의 Service Worker가 실제 fetch/axios 요청을 가로채 가짜 응답을 준다 → 앱 코드는 수정 없이'],
            ['Zod', '런타임에 실제 응답이 타입과 맞는지 검증 (타입은 컴파일 때만 검사하므로)'],
          ]}
        />
        <List
          items={[
            <><b>왜 자동 생성?</b> 손으로 쓴 interface는 백엔드가 필드를 바꿔도 모른다. 명세에서 생성하면 다시 생성하는 순간 <b>바뀐 필드를 쓰는 곳에서 컴파일 에러</b>가 나서 바로 안다.</>,
            <><b>MSW가 json-server보다 좋은 점</b>: 별도 서버나 URL 변경 없이, 실제 요청 코드 그대로 가로챈다. 같은 핸들러를 테스트(Vitest, Storybook)에서도 재사용.</>,
            <><b>협업 흐름</b>: 기획 → 백엔드와 API 명세 합의 → 프론트는 명세로 타입 생성 + MSW로 개발 → 백엔드 완성 후 MSW만 끄면 연동 끝.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>백엔드와 동시에 개발</b>해야 할 때 — API가 완성될 때까지 기다리지 않는다</>,
            'API가 많고 자주 바뀌는 프로젝트 — 타입 자동 생성으로 불일치를 컴파일 단계에서 잡는다',
            '에러·빈 목록·느린 응답 같은 상황을 재현해야 할 때 (MSW로 500, 지연 응답)',
            '테스트·Storybook에서 네트워크 없이 안정적인 데이터가 필요할 때',
          ]}
          avoid={[
            '백엔드가 명세를 관리하지 않는 경우 생성 자동화 — 명세가 틀리면 타입도 틀린다. 먼저 명세를 신뢰할 수 있게',
            'MSW를 프로덕션 번들에 포함 — 개발 환경에서만 켜도록 조건 처리',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: 'API 문서', path: ['백엔드 서버 주소', '/swagger-ui/index.html 또는 /docs'], what: '엔드포인트별 요청/응답 예시, "Try it out"으로 직접 호출. 명세 원본은 /v3/api-docs 같은 JSON 경로.' },
            { where: 'MSW가 동작하는지', path: ['F12', 'Console'], what: '"[MSW] Mocking enabled." 로그, 그리고 가로챈 요청마다 [MSW] GET /api/... 로그.' },
            { where: 'MSW 요청 확인', path: ['F12', 'Network', '요청 클릭'], what: '실제 요청처럼 보이지만 Size 열에 "(ServiceWorker)"로 표시된다.' },
            { where: 'Service Worker 상태', path: ['F12', 'Application', 'Service Workers'], what: 'mockServiceWorker.js가 activated 상태인지.' },
          ]}
        />
        <Screen title="Swagger UI — /docs">
          <div className="space-y-2 p-4">
            {[['GET', '/api/products/{id}', '상품 상세 조회', 'bg-sky-500'], ['POST', '/api/orders', '주문 생성', 'bg-emerald-500'], ['DELETE', '/api/cart/{itemId}', '장바구니 삭제', 'bg-rose-500']].map(([m, p, d, c]) => (
              <div key={p} className="flex items-center gap-3 rounded border border-zinc-200 p-2 dark:border-zinc-700">
                <span className={`w-16 rounded px-2 py-1 text-center font-bold text-white ${c}`}>{m}</span>
                <span className="font-mono font-semibold">{p}</span>
                <span className="text-zinc-500">{d}</span>
              </div>
            ))}
            <div className="rounded border border-zinc-200 p-3 font-mono dark:border-zinc-700">
              <div className="mb-1 text-zinc-400">Responses · 200 · Example Value</div>
              <pre>{`{
  "id": 42,
  "name": "무선 이어폰 X2",
  "price": 89000,
  "stock": 12
}`}</pre>
            </div>
          </div>
        </Screen>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="1. 명세 → 타입 생성"
          code={`
npx openapi-typescript https://api.shop.com/v3/api-docs -o src/shared/api/schema.d.ts

// 사용: 경로와 응답 타입이 명세와 자동으로 맞는다
import type { paths, components } from './schema';
type Product = components['schemas']['Product'];
type ProductRes = paths['/api/products/{id}']['get']['responses']['200']['content']['application/json'];

// openapi-fetch를 쓰면 경로 오타·잘못된 파라미터도 컴파일 에러
const { data } = await client.GET('/api/products/{id}', { params: { path: { id: 42 } } });`}
        />
        <CodeBlock
          title="2. MSW 핸들러"
          code={`
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  http.get('/api/products/:id', async ({ params }) => {
    await delay(500);                                  // 느린 응답 재현
    return HttpResponse.json({ id: Number(params.id), name: '무선 이어폰 X2', price: 89000, stock: 12 });
  }),
  http.post('/api/orders', () => HttpResponse.json({ message: '재고 부족' }, { status: 409 })),  // 에러 재현
];

// src/main.tsx — 개발 환경에서만
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser');  // setupWorker(...handlers)
  await worker.start();
}
// 최초 1회: npx msw init public/`}
        />
        <CodeBlock
          title="3. 런타임 검증 (Zod)"
          code={`
const ProductSchema = z.object({ id: z.number(), name: z.string(), price: z.number() });
const product = ProductSchema.parse(await res.json());   // 형식이 다르면 여기서 바로 에러`}
        />
      </Section>
    </>
  );
}
