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

- **Mock 서버**: 백엔드가 아직 없으면 명세의 예시 응답으로 Mock 서버(MSW 등)를 띄워 먼저 개발한다.
- 주의: 명세가 실제 동작과 다를 수 있다(문서 업데이트 누락). 이상하면 Try it out으로 실제 응답을 확인하고 백엔드와 맞춘다.
