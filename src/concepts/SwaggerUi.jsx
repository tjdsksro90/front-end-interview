import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, ui } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

export default function SwaggerUi() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Swagger UI는 <u>OpenAPI 명세(JSON/YAML)를 읽어서, API 목록·파라미터·응답 형식을 문서 화면으로 보여주고 그 자리에서 요청을 보내볼 수 있게 해주는 페이지</u>입니다.
          프론트엔드는 이 화면으로 <u>연동 전에 실제 응답을 확인</u>하고, 같은 명세로 <u>TypeScript 타입을 자동 생성</u>합니다.
        </OneLiner>

        <H3>용어 정리</H3>
        <Table
          head={['용어', '뜻']}
          rows={[
            ['OpenAPI Specification', 'API 명세를 쓰는 표준 형식. 3.0부터 이 이름 (그 전 이름이 Swagger Specification)'],
            ['Swagger UI', '명세를 문서 화면으로 보여주고 직접 호출해 보는 도구 (보통 "Swagger"라고 하면 이것)'],
            ['Swagger Editor', '명세를 작성하면서 미리보기'],
            ['명세 원본', <>Swagger UI가 읽는 JSON. <Code>/v3/api-docs</Code>, <Code>/openapi.json</Code> 같은 주소에 있다 — 타입 생성은 이걸 쓴다</>],
          ]}
        />

        <H3>명세의 구조</H3>
        <List
          items={[
            <><Code>info</Code>: API 이름, 버전, 설명</>,
            <><Code>servers</Code>: 요청을 보낼 서버 주소 목록 (개발·스테이징·운영)</>,
            <><Code>paths</Code>: 엔드포인트별 메서드, 파라미터, 요청 본문, 응답 → 화면의 <b>엔드포인트 목록</b></>,
            <><Code>components.schemas</Code>: 요청·응답에 쓰는 데이터 모델 → 화면 아래 <b>Schemas</b></>,
            <><Code>components.securitySchemes</Code>: 인증 방식(Bearer 토큰 등) → 화면 오른쪽 위 <b>Authorize</b> 버튼</>,
            <><Code>tags</Code>: 엔드포인트를 묶는 그룹 → 화면의 섹션 제목</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>API 연동 전</b>: 필드 이름, 필수 여부, null 가능 여부, 에러 응답 형식을 확인</>,
            <><b>화면 없이 API만 먼저 테스트</b>: Try it out으로 실제 서버에 요청을 보내 응답을 본다 (Postman 없이)</>,
            <><b>타입 생성</b>: 명세 JSON → openapi-typescript, orval로 타입·API 함수·React Query 훅 생성</>,
            <><b>백엔드와 협의</b>: "이 필드가 명세엔 있는데 응답엔 없어요"처럼 명세를 기준으로 이야기</>,
          ]}
          avoid={[
            <>운영 서버의 Swagger UI에서 데이터를 바꾸는 요청(POST·DELETE)을 함부로 실행 — 실제 데이터가 바뀐다</>,
            '명세를 100% 믿기 — 문서 업데이트가 빠질 수 있으니 이상하면 실제 응답으로 확인',
            '운영 환경에 Swagger UI를 공개 — 보통 개발·스테이징에서만 열거나 인증을 건다',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"백엔드가 springdoc으로 만든 Swagger UI에서 응답 형식을 먼저 확인하고, 명세 JSON으로 openapi-typescript를 돌려 타입을 자동 생성했다. 그래서 백엔드가 필드를 바꾸면 타입 에러로 바로 알 수 있었다"처럼 협업 경험으로 말하면 좋아요.</p>
          <p>Mock 서버와 타입 생성은 <Link className={linkCls} to="/web/rest-api/deep/api-schema-mock">API 스키마 & Mock 서버 심화</Link>에 더 자세히 있어요.</p>
        </Callout>
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: 'Spring (springdoc-openapi)', path: ['서버 주소', '/swagger-ui/index.html'], what: '명세 원본 JSON은 /v3/api-docs' },
            { where: 'NestJS (@nestjs/swagger)', path: ['서버 주소', '/api-docs (SwaggerModule.setup에서 정한 경로)'], what: '명세 JSON은 /api-docs-json' },
            { where: 'FastAPI', path: ['서버 주소', '/docs'], what: '기본으로 켜져 있다. 명세 JSON은 /openapi.json, ReDoc 화면은 /redoc' },
            { where: 'Try it out이 CORS 에러로 실패할 때', path: ['F12', 'Console'], what: 'Swagger UI 주소와 API 서버 주소가 다르면 서버의 CORS 설정이 필요하다' },
          ]}
        />

        <H3>직접 눌러 보기</H3>
        <p>
          실제 Swagger UI 화면을 단순화해서 재현했어요. 엔드포인트를 펼치고 <b>Try it out → Execute</b>를 눌러 보세요.
          <b> 인증이 필요한 API</b>(자물쇠 표시)는 <b>Authorize</b>에 아무 토큰이나 넣은 뒤 다시 실행하면 401이 200으로 바뀝니다. 요청은 실제로 나가지 않고 화면 안에서 흉내만 냅니다.
        </p>
        <MockSwaggerUi />
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="openapi.yaml — 위 화면을 만든 명세 (일부)"
          code={`
openapi: 3.0.3
info: { title: Shop API, version: 1.2.0 }
servers:
  - url: https://dev-api.example.com
  - url: https://staging-api.example.com
tags:
  - name: users
  - name: orders
paths:
  /users/{id}:
    get:
      tags: [users]
      summary: 회원 조회
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        '200': { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
        '404': { description: 회원 없음 }
  /orders:
    post:
      tags: [orders]
      summary: 주문 생성
      security: [{ bearerAuth: [] }]        # 자물쇠 표시 → Authorize 필요
      requestBody:
        content: { application/json: { schema: { $ref: '#/components/schemas/OrderCreate' } } }
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer }
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id: { type: integer }
        email: { type: string }
        nickname: { type: string, nullable: true }`}
        />

        <H3>백엔드에서 명세 만들기</H3>
        <CodeBlock
          title="NestJS — 데코레이터로 명세를 만들고 Swagger UI를 띄운다"
          code={`
// main.ts
const config = new DocumentBuilder().setTitle('Shop API').setVersion('1.2.0').addBearerAuth().build();
SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, config));

// users.controller.ts
@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse({ description: '회원 없음' })
  findOne(@Param('id') id: number) { ... }
}`}
        />

        <H3>프론트엔드에서 명세 쓰기</H3>
        <CodeBlock
          title="openapi-typescript + openapi-fetch — 타입이 맞는 API 호출"
          code={`
// 1) 명세에서 타입 생성 (package.json scripts에 넣어 두고 백엔드 변경 시 실행)
//    npx openapi-typescript https://dev-api.example.com/v3/api-docs -o src/api/schema.d.ts

// 2) 생성된 타입으로 호출
import createClient from 'openapi-fetch';
import type { paths } from './schema';

const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });

const { data, error } = await api.GET('/users/{id}', {
  params: { path: { id: 42 } },        // 경로·파라미터 이름이 틀리면 타입 에러
});
data?.nickname;                          // string | null — 명세의 nullable이 타입에 반영됨`}
        />
        <CodeBlock
          title="orval — React Query 훅까지 생성"
          code={`
// orval.config.ts
export default {
  shop: {
    input: 'https://dev-api.example.com/v3/api-docs',
    output: { target: 'src/api/generated.ts', client: 'react-query' },
  },
};

// 사용: 엔드포인트마다 훅이 만들어진다
const { data: user } = useGetUsersId(42);`}
        />

        <H3>복붙 vs 코드 생성</H3>
        <p>Swagger UI는 <b>확인</b>용이고, 코드와 <b>연결</b>하는 건 코드 생성 도구가 합니다.</p>
        <Table
          head={['', '복붙 (직접 작성)', '코드 생성']}
          rows={[
            ['방법', 'Swagger를 보고 URL·타입·함수를 손으로 작성', '명세 주소로 명령어 실행 → 타입·함수·훅 파일 생성'],
            ['백엔드가 필드를 바꾸면', '화면이 깨질 때까지 모름', <>다시 생성하면 바뀐 곳이 <b>타입 에러</b>로 드러남</>],
            ['실수', 'nullable, enum 값을 옮기다 빠뜨리기 쉬움', '명세 그대로 반영'],
            ['도구', '-', <><b>openapi-typescript</b>(타입만), <b>orval</b>(타입 + React Query 훅 + MSW Mock), @hey-api/openapi-ts</>],
          ]}
        />

        <H3>백엔드 개발 전: Mock 서버로 먼저 개발하기 (React Query 기준)</H3>
        <p>명세만 있고 API가 아직 없을 때, <b>orval로 React Query 훅과 MSW Mock을 함께 생성</b>하면 나중에 컴포넌트 코드를 거의 바꾸지 않고 실제 서버로 넘어갈 수 있습니다. 아래 스위치로 요청이 어디서 응답받는지 비교해 보세요.</p>
        <MockFlow />

        <CodeBlock
          title="1. 설치"
          code={`
npm i @tanstack/react-query axios
npm i -D orval msw @faker-js/faker
npx msw init public/ --save          # public/mockServiceWorker.js 생성`}
        />
        <CodeBlock
          title="2. src/api/http.ts — 모든 요청이 지나가는 axios 인스턴스 (실서버 전환 때 여기만 신경 쓰면 된다)"
          code={`
const instance = axios.create({ baseURL: import.meta.env.VITE_API_URL });

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

export const http = <T>(config: AxiosRequestConfig): Promise<T> =>
  instance(config).then((res) => res.data);`}
        />
        <CodeBlock
          title="3. orval.config.ts → npx orval"
          code={`
export default {
  shop: {
    input: './openapi.yaml',               // 백엔드에게 받은 명세 (나중에 실서버 URL로)
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',              // useQuery·useMutation 훅
      mock: true,                         // MSW 핸들러 + faker 가짜 데이터 → generated.msw.ts
      override: { mutator: { path: 'src/api/http.ts', name: 'http' } },
    },
  },
};`}
        />
        <CodeBlock
          title="4. 개발할 때만 MSW 켜기 — src/mocks/browser.ts, src/main.tsx, .env.development"
          code={`
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { getShopAPIMock } from '../api/generated.msw';   // 이름은 명세 title에 따라 생성됨
export const worker = setupWorker(...getShopAPIMock());

// src/main.tsx
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'true') return;
  const { worker } = await import('./mocks/browser');    // 동적 import → 배포 번들에 안 들어감
  return worker.start({ onUnhandledRequest: 'bypass' });
}
enableMocking().then(() => createRoot(root).render(<App />));

# .env.development
VITE_API_URL=https://dev-api.example.com    # 아직 없는 서버여도 된다 (MSW가 가로챔)
VITE_API_MOCKING=true`}
        />
        <CodeBlock
          title="5. 컴포넌트는 생성된 훅만 쓴다 — 이 코드는 실서버로 바뀌어도 그대로"
          code={`
const { data: user, isLoading } = useGetUsersId(id);     // GET /users/{id}
const createOrder = usePostOrders();                      // POST /orders
createOrder.mutate({ data: { productId: 3, quantity: 1 } });

// 에러·빈 화면을 만들 땐 특정 API만 덮어쓰기
worker.use(http.get('*/users/:id', () => HttpResponse.json({ code: 'USER_NOT_FOUND' }, { status: 404 })));`}
        />

        <H3>백엔드 개발이 끝나면 바꿀 것</H3>
        <Table
          head={['순서', '바꿀 것', '이유']}
          rows={[
            ['1', <><Code>VITE_API_MOCKING=false</Code></>, '지우지 말고 꺼두면 백엔드 장애 때 다시 켤 수 있다'],
            ['2', <>orval <Code>input</Code>을 실서버 명세 URL로 → <Code>npx orval</Code></>, '처음 받은 명세와 달라진 부분이 타입 에러로 드러난다 → 그 부분만 수정'],
            ['3', <><Code>VITE_API_URL</Code>, CORS 또는 Vite <Code>server.proxy</Code></>, 'Mock 때는 없던 CORS 에러가 실서버에서 처음 나온다'],
            ['4', <><Code>http.ts</Code> 인터셉터의 토큰·401 처리</>, 'Mock은 인증을 검사하지 않았으니 실제 로그인 흐름을 확인'],
            ['5', '실제 데이터로 화면 점검', 'null, 빈 배열, 긴 문자열, 페이지네이션, 에러 형식, 느린 응답(로딩)'],
            ['6', 'MSW는 남겨두기', <>테스트(<Code>msw/node</Code>)와 에러 화면 개발에 계속 쓴다</>],
          ]}
        />
        <Callout title="코드 없이 Mock 서버만 띄우려면: Prism">
          <p><Code>npx @stoplight/prism-cli mock ./openapi.yaml</Code> → <Code>http://127.0.0.1:4010</Code>에서 명세의 예시 응답을 돌려줍니다. <Code>VITE_API_URL</Code>을 이 주소로 두고 개발하다가, 백엔드가 완성되면 주소만 바꾸면 됩니다. 설정은 더 간단하지만, 특정 API만 에러로 바꾸거나 테스트에 같이 쓰기는 MSW가 편합니다.</p>
        </Callout>
      </Section>
    </>
  );
}

/* ---------- Mock ↔ 실서버 요청 흐름 ---------- */

function MockFlow() {
  const [mock, setMock] = useState(true);
  const node = (label, sub, tone) => (
    <div className={`min-w-[120px] rounded-xl border-2 px-3 py-2 text-center ${tone}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="font-mono text-[11px] text-zinc-400">{sub}</div>
    </div>
  );
  const same = 'border-zinc-200 dark:border-zinc-700';
  const on = 'border-amber-400 bg-amber-50 dark:bg-amber-500/10';
  const off = 'border-dashed border-zinc-300 opacity-40 dark:border-zinc-700';
  const arrow = <span className="text-zinc-400">→</span>;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap gap-2">
        <button className={mock ? ui.btnPrimary : ui.btn} onClick={() => setMock(true)}>백엔드 개발 전 (VITE_API_MOCKING=true)</button>
        <button className={!mock ? ui.btnPrimary : ui.btn} onClick={() => setMock(false)}>백엔드 완성 후 (false)</button>
      </div>
      <div className="mt-5 flex min-w-[460px] flex-wrap items-center gap-2 overflow-x-auto">
        {node('Profile', 'useGetUsersId(42)', same)}
        {arrow}
        {node('generated.ts', 'React Query 훅', same)}
        {arrow}
        {node('http.ts', 'axios + 토큰', same)}
        {arrow}
        <div className="flex flex-col gap-2">
          {node('MSW 서비스 워커', '가짜 응답 (faker)', mock ? on : off)}
          {node('실제 백엔드', 'VITE_API_URL', mock ? off : on)}
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        {mock
          ? '→ 요청은 실제로 보내지지만(Network 탭에 보임), 브라우저 안의 MSW 서비스 워커가 가로채서 명세 기반 가짜 응답을 돌려준다.'
          : '→ MSW를 끄면 같은 요청이 그대로 실제 서버로 간다. 컴포넌트·훅·http.ts 코드는 바뀌지 않는다(회색 칸은 그대로).'}
      </p>
    </div>
  );
}

/* ---------- 재현한 Swagger UI ---------- */

const METHOD_STYLE = {
  GET: { badge: 'bg-sky-500', row: 'border-sky-300 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10' },
  POST: { badge: 'bg-emerald-500', row: 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10' },
  PUT: { badge: 'bg-amber-500', row: 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10' },
  DELETE: { badge: 'bg-rose-500', row: 'border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10' },
};

const ENDPOINTS = [
  {
    tag: 'users', method: 'GET', path: '/users/{id}', summary: '회원 조회',
    params: [{ name: 'id', in: 'path', type: 'integer', required: true, example: '42' }],
    responses: [
      ['200', 'OK', { id: 42, email: 'user42@example.com', nickname: '리액트공부중' }],
      ['404', '회원 없음', { code: 'USER_NOT_FOUND', message: '회원을 찾을 수 없습니다' }],
    ],
    run: ({ id }) => (Number(id) > 0 && Number(id) < 1000
      ? [200, { id: Number(id), email: `user${id}@example.com`, nickname: Number(id) % 2 ? null : '리액트공부중' }]
      : [404, { code: 'USER_NOT_FOUND', message: '회원을 찾을 수 없습니다' }]),
  },
  {
    tag: 'users', method: 'PUT', path: '/users/me', summary: '내 정보 수정', secured: true,
    body: { nickname: '새닉네임' },
    responses: [['200', 'OK', { id: 7, email: 'me@example.com', nickname: '새닉네임' }], ['401', '인증 필요', { code: 'UNAUTHORIZED' }]],
    run: (_, body) => [200, { id: 7, email: 'me@example.com', ...body }],
  },
  {
    tag: 'orders', method: 'GET', path: '/orders', summary: '주문 목록',
    params: [
      { name: 'page', in: 'query', type: 'integer', required: false, example: '1' },
      { name: 'status', in: 'query', type: 'string (PAID | SHIPPED)', required: false, example: 'PAID' },
    ],
    responses: [['200', 'OK', { items: [{ id: 1001, status: 'PAID', total: 129000 }], page: 1, totalPages: 3 }]],
    run: ({ page, status }) => [200, { items: [{ id: 1000 + Number(page || 1), status: status || 'PAID', total: 129000 }], page: Number(page || 1), totalPages: 3 }],
  },
  {
    tag: 'orders', method: 'POST', path: '/orders', summary: '주문 생성', secured: true,
    body: { productId: 3, quantity: 1 },
    responses: [['201', 'Created', { id: 1004, status: 'PAID' }], ['400', '잘못된 요청', { code: 'INVALID_QUANTITY' }], ['401', '인증 필요', { code: 'UNAUTHORIZED' }]],
    run: (_, body) => (body.quantity > 0 ? [201, { id: 1004, status: 'PAID', ...body }] : [400, { code: 'INVALID_QUANTITY', message: '수량은 1 이상' }]),
  },
  {
    tag: 'orders', method: 'DELETE', path: '/orders/{id}', summary: '주문 취소', secured: true,
    params: [{ name: 'id', in: 'path', type: 'integer', required: true, example: '1001' }],
    responses: [['204', '취소됨', null], ['401', '인증 필요', { code: 'UNAUTHORIZED' }]],
    run: () => [204, null],
  },
];

const SERVERS = ['https://dev-api.example.com', 'https://staging-api.example.com'];

function MockSwaggerUi() {
  const [server, setServer] = useState(SERVERS[0]);
  const [token, setToken] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const tags = [...new Set(ENDPOINTS.map((e) => e.tag))];

  return (
    <Screen title={`${server}/swagger-ui/index.html`} caption="실제 Swagger UI를 단순화해서 재현했어요. 요청은 화면 안에서만 흉내 냅니다">
      <div className="relative p-4 text-[13px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">Shop API</span>
              <span className="rounded bg-zinc-500 px-1.5 py-0.5 text-[10px] font-bold text-white">1.2.0</span>
              <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">OAS 3.0</span>
            </div>
            <span className="mt-1 block text-xs text-sky-600 dark:text-sky-400">/v3/api-docs</span>
          </div>
          <button
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1.5 rounded border-2 border-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-600"
          >
            Authorize <Lock closed={!!token} />
          </button>
        </div>

        <label className="mt-4 block text-xs font-bold">
          Servers
          <select value={server} onChange={(e) => setServer(e.target.value)} className={`${ui.input} mt-1 block py-1 text-xs`}>
            {SERVERS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        {tags.map((tag) => (
          <div key={tag} className="mt-5">
            <div className="border-b border-zinc-200 pb-1.5 text-base font-bold dark:border-zinc-700">{tag}</div>
            <div className="mt-2 space-y-2">
              {ENDPOINTS.filter((e) => e.tag === tag).map((ep) => (
                <Operation key={ep.method + ep.path} ep={ep} server={server} token={token} />
              ))}
            </div>
          </div>
        ))}

        <SchemasBox />

        {authOpen && <AuthModal token={token} onSave={setToken} onClose={() => setAuthOpen(false)} />}
      </div>
    </Screen>
  );
}

function Lock({ closed }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-label={closed ? '인증됨' : '인증 필요'}>
      {closed ? (
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M14.5 1A4.5 4.5 0 0 0 10 5.5V9H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5V5.5a3 3 0 1 1 6 0v2.75a.75.75 0 0 0 1.5 0V5.5A4.5 4.5 0 0 0 14.5 1Z" clipRule="evenodd" />
      )}
    </svg>
  );
}

function Operation({ ep, server, token }) {
  const [open, setOpen] = useState(false);
  const [trying, setTrying] = useState(false);
  const [values, setValues] = useState(() => Object.fromEntries((ep.params ?? []).map((p) => [p.name, p.example])));
  const [body, setBody] = useState(() => (ep.body ? JSON.stringify(ep.body, null, 2) : ''));
  const [result, setResult] = useState(null);
  const s = METHOD_STYLE[ep.method];

  const execute = () => {
    let status;
    let data;
    let parsed = {};
    try {
      parsed = body ? JSON.parse(body) : {};
    } catch {
      setResult({ status: 400, data: { code: 'INVALID_JSON', message: '요청 본문이 올바른 JSON이 아닙니다' } });
      return;
    }
    if (ep.secured && !token) [status, data] = [401, { code: 'UNAUTHORIZED', message: '인증이 필요합니다' }];
    else [status, data] = ep.run(values, parsed);
    setResult({ status, data });
  };

  const path = ep.path.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? `{${k}}`);
  const query = (ep.params ?? []).filter((p) => p.in === 'query' && values[p.name]).map((p) => `${p.name}=${encodeURIComponent(values[p.name])}`).join('&');
  const url = `${server}${path}${query ? `?${query}` : ''}`;
  const curl = [
    `curl -X '${ep.method}' '${url}'`,
    `  -H 'accept: application/json'`,
    ep.secured && token ? `  -H 'Authorization: Bearer ${token}'` : null,
    body ? `  -H 'Content-Type: application/json'` : null,
    body ? `  -d '${body.replace(/\s+/g, ' ')}'` : null,
  ].filter(Boolean).join(' \\\n');

  return (
    <div className={`overflow-hidden rounded border ${s.row}`}>
      <button className="flex w-full items-center gap-3 px-2 py-1.5 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className={`w-16 rounded py-1 text-center text-xs font-bold text-white ${s.badge}`}>{ep.method}</span>
        <span className="font-mono font-semibold">{ep.path}</span>
        <span className="text-zinc-500 dark:text-zinc-400">{ep.summary}</span>
        {ep.secured && <span className="ml-auto text-zinc-400"><Lock closed={!!token} /></span>}
      </button>

      {open && (
        <div className="space-y-3 border-t border-inherit bg-white/60 p-3 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <span className="font-bold">Parameters</span>
            <button className={`rounded border px-3 py-1 text-xs font-bold ${trying ? 'border-rose-400 text-rose-500' : 'border-zinc-400'}`} onClick={() => { setTrying((t) => !t); setResult(null); }}>
              {trying ? 'Cancel' : 'Try it out'}
            </button>
          </div>
          {ep.params?.length ? (
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-zinc-200 dark:border-zinc-700"><th className="py-1 pr-4">Name</th><th>Description</th></tr></thead>
              <tbody>
                {ep.params.map((p) => (
                  <tr key={p.name}>
                    <td className="py-1.5 pr-4 align-top">
                      <div className="font-mono font-semibold">{p.name}{p.required && <span className="text-rose-500"> *</span>}</div>
                      <div className="text-[11px] text-zinc-400">{p.type} ({p.in})</div>
                    </td>
                    <td className="py-1.5">
                      <input
                        disabled={!trying}
                        value={values[p.name] ?? ''}
                        onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                        className={`${ui.input} w-40 py-1 text-xs disabled:opacity-60`}
                        aria-label={p.name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-zinc-400">No parameters</p>
          )}

          {ep.body && (
            <div>
              <div className="mb-1 font-bold">Request body <span className="text-xs font-normal text-zinc-400">application/json</span></div>
              <textarea
                disabled={!trying}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                className="w-full rounded bg-[#333] p-2 font-mono text-xs text-zinc-100 disabled:opacity-80"
                aria-label="Request body"
              />
            </div>
          )}

          {trying && (
            <button className="w-full rounded bg-sky-600 py-1.5 text-sm font-bold text-white hover:bg-sky-500" onClick={execute}>
              Execute
            </button>
          )}

          {result && (
            <div className="space-y-2">
              <div className="font-bold">Curl</div>
              <pre className="overflow-x-auto rounded bg-[#333] p-2 font-mono text-[11px] text-zinc-100">{curl}</pre>
              <div className="font-bold">Request URL</div>
              <pre className="overflow-x-auto rounded bg-[#333] p-2 font-mono text-[11px] text-zinc-100">{url}</pre>
              <div className="font-bold">Server response</div>
              <div className="flex gap-4 text-xs">
                <span className={`w-12 font-mono font-bold ${result.status < 300 ? 'text-emerald-600' : 'text-rose-500'}`}>{result.status}</span>
                <pre className="flex-1 overflow-x-auto rounded bg-[#333] p-2 font-mono text-[11px] text-zinc-100">{result.data ? JSON.stringify(result.data, null, 2) : '(본문 없음)'}</pre>
              </div>
            </div>
          )}

          <div>
            <div className="mb-1 font-bold">Responses</div>
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-zinc-200 dark:border-zinc-700"><th className="py-1 pr-4">Code</th><th>Description</th></tr></thead>
              <tbody>
                {ep.responses.map(([code, desc, example]) => (
                  <tr key={code} className="align-top">
                    <td className="py-1.5 pr-4 font-mono font-bold">{code}</td>
                    <td className="py-1.5">
                      <div>{desc}</div>
                      {example && <pre className="mt-1 overflow-x-auto rounded bg-[#333] p-2 font-mono text-[11px] text-zinc-100">{JSON.stringify(example, null, 2)}</pre>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const SCHEMAS = {
  User: [['id*', 'integer'], ['email*', 'string'], ['nickname', 'string, nullable']],
  OrderCreate: [['productId*', 'integer'], ['quantity*', 'integer (minimum: 1)']],
  Order: [['id*', 'integer'], ['status*', 'string (PAID | SHIPPED | CANCELED)'], ['total*', 'integer']],
};

function SchemasBox() {
  const [open, setOpen] = useState('User');
  return (
    <div className="mt-6 rounded border border-zinc-300 p-3 dark:border-zinc-700">
      <div className="text-base font-bold">Schemas</div>
      <div className="mt-2 space-y-1.5">
        {Object.entries(SCHEMAS).map(([name, fields]) => (
          <div key={name} className="rounded bg-zinc-50 dark:bg-zinc-800/60">
            <button className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono font-semibold" onClick={() => setOpen(open === name ? null : name)}>
              <span className="text-zinc-400">{open === name ? '▾' : '▸'}</span>{name}
            </button>
            {open === name && (
              <div className="px-8 pb-2 font-mono text-xs">
                {fields.map(([f, t]) => (
                  <div key={f} className="flex gap-4">
                    <span className="w-28">{f.replace('*', '')}{f.endsWith('*') && <span className="text-rose-500">*</span>}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuthModal({ token, onSave, onClose }) {
  const [value, setValue] = useState(token);
  return (
    <div className="absolute inset-0 z-10 grid place-items-start justify-center bg-black/40 pt-16" onClick={onClose}>
      <div className="w-80 rounded-lg bg-white p-4 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-bold">Available authorizations</span>
          <button onClick={onClose} aria-label="닫기" className="text-zinc-400">×</button>
        </div>
        <div className="mt-3 font-mono text-xs font-bold">bearerAuth (http, Bearer)</div>
        <p className="mt-1 text-[11px] text-zinc-400">데모용 입력칸이에요. 아무 글자나 넣으면 됩니다.</p>
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className={`${ui.input} mt-2 w-full py-1 text-xs`} aria-label="Bearer token" />
        <div className="mt-3 flex justify-end gap-2">
          {token && <button className="rounded border border-zinc-300 px-3 py-1 text-xs font-bold" onClick={() => { onSave(''); setValue(''); }}>Logout</button>}
          <button className="rounded border-2 border-emerald-500 px-3 py-1 text-xs font-bold text-emerald-600" onClick={() => { onSave(value.trim()); onClose(); }}>Authorize</button>
        </div>
      </div>
    </div>
  );
}
