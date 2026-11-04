# Q : Swagger란 무엇이고, 프론트엔드에서는 어떻게 활용하나요?

<br />

# A : Swagger는 OpenAPI 명세(API의 경로·요청·응답 형식을 정해진 형식으로 적은 문서)를 만들고 보여주는 도구 모음입니다. 프론트엔드는 주로 Swagger UI 화면에서 API 사용법을 확인하고, 직접 요청을 보내보고, 명세로부터 TypeScript 타입을 만들어 씁니다.

### OpenAPI와 Swagger

- **OpenAPI Specification**: API 명세를 쓰는 표준 형식(JSON/YAML). 원래 이름이 "Swagger Specification"이었는데, 2017년 3.0부터 OpenAPI로 이름이 바뀌었다.
- **Swagger**: 그 명세를 다루는 도구들의 이름으로 남았다.
  - **Swagger UI**: 명세를 웹 문서 화면으로 보여주고, 화면에서 바로 요청을 보내볼 수 있다. (가장 많이 쓰는 것)
  - **Swagger Editor**: 명세를 작성하면서 미리보기
  - **Swagger Codegen**: 명세로 클라이언트·서버 코드를 생성
- 그래서 "Swagger 문서 주세요"라고 하면 보통 **Swagger UI 페이지 주소**를 말한다.

### 명세는 누가, 어떻게 만드나

- 대부분 **백엔드 코드에서 자동으로** 만든다. 컨트롤러와 DTO를 읽어서 명세 JSON을 생성하고, Swagger UI 페이지를 함께 띄워준다.
  - Spring: springdoc-openapi → `/swagger-ui/index.html`
  - NestJS: `@nestjs/swagger` → 설정한 경로 (예: `/api-docs`)
  - FastAPI: 기본으로 `/docs`
- 명세를 먼저 쓰고 코드를 맞추는 방식(API First, Design First)도 있다. 프론트와 백엔드가 명세를 계약서처럼 합의하고 동시에 개발한다.

### Swagger UI에서 주로 쓰는 기능

- **엔드포인트 목록**: 태그(users, orders 등)별로 묶여 있고, 메서드(GET·POST·PUT·DELETE)가 색으로 구분된다.
- **파라미터·요청 본문 확인**: 어떤 값이 필수인지, 타입과 예시가 무엇인지 본다.
- **응답 확인**: 상태 코드별(200, 400, 401…) 응답 형식과 예시를 본다.
- **Try it out → Execute**: 값을 넣고 실제로 요청을 보낸다. 응답 코드와 본문, 같은 요청을 보내는 curl 명령어도 보여준다.
- **Authorize**: 로그인 토큰(Bearer)을 한 번 넣으면 이후 요청에 자동으로 붙는다.
- **Schemas**: 요청·응답에 쓰이는 데이터 모델(User, Order 등)의 필드 정의를 본다.
- **Servers 선택**: 개발·스테이징 서버를 골라서 요청을 보낸다.

### 프론트엔드에서 활용

- **연동 전에 확인**: 화면을 만들기 전에 Try it out으로 실제 응답을 보고, 필드 이름과 null 가능 여부를 확인한다.
- **타입 자동 생성**: 명세 JSON에서 TypeScript 타입을 만든다. 백엔드가 필드를 바꾸면 타입 에러로 바로 드러난다.

```bash
npx openapi-typescript https://api.example.com/v3/api-docs -o src/api/schema.d.ts
```

- **Mock 서버**: 백엔드가 아직 없으면 명세의 예시 응답으로 Mock 서버(MSW 등)를 띄워 먼저 개발한다. (아래 순서 참고)
- 주의: 명세가 실제 동작과 다를 수 있다(문서 업데이트 누락). 이상하면 Try it out으로 실제 응답을 확인하고 백엔드와 맞춘다.

### 복붙 vs 코드 생성

Swagger UI는 **확인**용이고, 코드와 **연결**하는 건 코드 생성 도구가 한다.

| | 복붙 (직접 작성) | 코드 생성 |
|---|---|---|
| 방법 | Swagger를 보고 URL·타입·API 함수를 손으로 작성 | 명세 JSON 주소로 명령어 실행 → 타입·함수·훅 파일 생성 |
| 백엔드가 필드를 바꾸면 | 화면이 깨질 때까지 모름 | 다시 생성하면 바뀐 곳이 **타입 에러**로 드러남 |
| 실수 | nullable, enum 값 등을 옮기다 빠뜨리기 쉬움 | 명세 그대로 반영 |
| 어울리는 곳 | API가 몇 개 안 되는 작은 프로젝트 | API가 많고 자주 바뀌는 프로젝트 |

| 도구 | 만들어 주는 것 |
|---|---|
| **openapi-typescript** (+ openapi-fetch) | 타입만. 기존 axios 코드를 그대로 두고 타입만 맞출 때, 처음 도입하기 가장 쉽다 |
| **orval** | 타입 + API 함수 + **React Query 훅** + **MSW Mock 핸들러** |
| **@hey-api/openapi-ts** | 타입 + API 클라이언트 (플러그인으로 React Query 등) |

### 백엔드 개발 전: Mock 서버로 개발하기 (React Query 기준)

Swagger 명세만 있고 API가 아직 없을 때, **orval로 React Query 훅과 MSW Mock을 같이 생성**하면 나중에 코드를 거의 바꾸지 않고 실제 서버로 넘어갈 수 있다.

**1. 설치와 Mock 서비스 워커 파일 생성**

```bash
npm i @tanstack/react-query axios
npm i -D orval msw @faker-js/faker
npx msw init public/ --save    # public/mockServiceWorker.js 생성
```

**2. 공통 axios 인스턴스 (나중에 실제 서버로 바꿀 때 여기만 신경 쓰면 된다)**

```ts
// src/api/http.ts
import axios, { AxiosRequestConfig } from 'axios';

const instance = axios.create({ baseURL: import.meta.env.VITE_API_URL });

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// orval이 생성한 모든 함수가 이 함수로 요청한다
export const http = <T>(config: AxiosRequestConfig): Promise<T> =>
  instance(config).then((res) => res.data);
```

**3. orval 설정과 생성**

```ts
// orval.config.ts
export default {
  shop: {
    input: './openapi.yaml',              // 백엔드에게 받은 명세 파일 (또는 명세 URL)
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',             // useQuery·useMutation 훅 생성
      mock: true,                        // MSW 핸들러 + faker 가짜 데이터 생성
      override: { mutator: { path: 'src/api/http.ts', name: 'http' } },
    },
  },
};
```

```bash
npx orval    # src/api/generated.ts, generated.msw.ts 생성
```

**4. 개발할 때만 MSW 켜기**

```ts
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { getShopAPIMock } from '../api/generated.msw';   // 이름은 명세의 title에 따라 생성됨

export const worker = setupWorker(...getShopAPIMock());
```

```tsx
// src/main.tsx
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'true') return;
  const { worker } = await import('./mocks/browser');     // 동적 import → 배포 번들에 안 들어감
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}><App /></QueryClientProvider>
  );
});
```

```bash
# .env.development
VITE_API_URL=https://dev-api.example.com    # 아직 없는 서버여도 된다 (MSW가 중간에서 가로챔)
VITE_API_MOCKING=true
```

**5. 컴포넌트에서는 생성된 훅만 쓴다**

```tsx
import { useGetUsersId, usePostOrders } from '@/api/generated';

function Profile({ id }: { id: number }) {
  const { data: user, isLoading } = useGetUsersId(id);   // GET /users/{id}
  const createOrder = usePostOrders();                    // POST /orders

  if (isLoading) return <Spinner />;
  return (
    <>
      <p>{user?.nickname ?? '닉네임 없음'}</p>
      <button onClick={() => createOrder.mutate({ data: { productId: 3, quantity: 1 } })}>주문</button>
    </>
  );
}
```

- 이 상태로 화면을 끝까지 만든다. 요청은 Network 탭에 그대로 보이고, MSW가 가짜 응답을 돌려준다.
- 에러·빈 목록 화면을 만들 땐 특정 API만 덮어쓴다.

```ts
import { http as mswHttp, HttpResponse } from 'msw';

worker.use(
  mswHttp.get('*/users/:id', () => HttpResponse.json({ code: 'USER_NOT_FOUND' }, { status: 404 }))
);
```

### 백엔드 개발이 끝나면 바꿀 것

컴포넌트와 훅 사용 코드는 **거의 그대로**다. 바꾸는 곳은 설정과 생성 파일이다.

1. **Mock 끄기**: `.env.development`의 `VITE_API_MOCKING=false`. (지우지 말고 꺼두면 백엔드 장애 때 다시 켤 수 있다)
2. **실제 명세로 다시 생성**: orval `input`을 실제 서버의 명세 URL(`/v3/api-docs`)로 바꾸고 `npx orval`. 처음 받은 명세와 달라진 부분이 **타입 에러로 표시**되니 그 부분만 고친다.
3. **서버 주소·CORS**: `VITE_API_URL`을 실제 서버로. 브라우저에서 CORS 에러가 나면 백엔드에 허용을 요청하거나, 개발 중에는 Vite proxy를 쓴다.

```ts
// vite.config.ts
server: { proxy: { '/api': { target: 'https://dev-api.example.com', changeOrigin: true } } }
```

4. **인증**: 실제 로그인 API로 토큰을 받아 `http.ts` 인터셉터가 붙이는지, 401일 때 토큰 갱신·로그아웃 처리가 되는지 확인한다.
5. **실제 데이터로 화면 점검**: 가짜 데이터에서는 안 보이던 null, 빈 배열, 긴 문자열, 페이지네이션, 에러 응답 형식, 느린 응답(로딩 화면)을 확인한다.
6. **MSW는 남겨두기**: 테스트(`msw/node`의 `setupServer`)와 에러 화면 개발에 계속 쓴다. 배포 번들에는 동적 import라서 포함되지 않는다.

### 코드 없이 Mock 서버만 띄우는 방법: Prism

```bash
npx @stoplight/prism-cli mock ./openapi.yaml    # http://127.0.0.1:4010 에서 명세의 예시 응답을 돌려줌
```

- `VITE_API_URL=http://127.0.0.1:4010`으로 두고 개발하다가, 백엔드가 완성되면 이 주소만 실제 서버로 바꾼다.
- 따로 실행하는 서버라 설정은 간단하지만, 특정 API만 에러로 바꾸거나 테스트에 같이 쓰기는 MSW가 더 편하다.
