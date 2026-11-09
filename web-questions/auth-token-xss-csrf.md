# Q : 인증 토큰과 XSS·CSRF는 어떻게 다루나요?

<br />

# A : 인증 토큰은 자바스크립트가 읽을 수 있는 곳(localStorage 등)에 두면 XSS 한 번에 탈취될 수 있어서, 보통 HttpOnly·Secure·SameSite를 건 쿠키에 담습니다. 대신 쿠키는 브라우저가 요청마다 자동으로 붙여 보내기 때문에 CSRF를 따로 막아야 합니다. 그래서 XSS는 출력 이스케이프·sanitize·CSP로, CSRF는 SameSite와 CSRF 토큰·Sec-Fetch-Site 확인으로 막습니다. 둘은 서로 연결돼 있어서 XSS가 뚫리면 CSRF 방어도 의미가 없어지므로, XSS 방어가 먼저입니다.

### 용어 정리

- **XSS** (Cross-Site Scripting): 악성 스크립트가 우리 페이지에서 실행되는 문제
- **CSRF** (Cross-Site Request Forgery): 사용자의 인증 정보를 이용해 원치 않는 요청을 보내게 하는 문제
- **HttpOnly**: 자바스크립트에서 쿠키를 읽지 못하도록 제한
- **Secure**: HTTPS 연결에서만 쿠키 전송
- **SameSite**: 다른 사이트에서 시작된 요청의 쿠키 전송을 제한

### 토큰을 어디에 저장하나

| 저장 위치 | XSS에 대해 | CSRF에 대해 |
|---|---|---|
| localStorage / sessionStorage | **위험**: 스크립트가 바로 읽어서 외부로 보낼 수 있다 | 안전: 자동으로 전송되지 않고, 코드가 헤더에 직접 넣어야 한다 |
| 일반 쿠키 | 위험: `document.cookie`로 읽힌다 | 위험: 요청마다 자동 전송 |
| **HttpOnly 쿠키** | 탈취는 막는다 (스크립트가 못 읽음) | 위험: 자동 전송되므로 CSRF 방어 필요 |
| 메모리 (JS 변수, 상태) | 새로고침하면 사라져서 노출 시간이 짧다. 다만 실행 중인 XSS는 접근 가능 | 안전: 자동 전송되지 않음 |

- OWASP는 localStorage에 세션 식별자를 저장하지 말라고 한다. JavaScript가 언제든 읽을 수 있어서 XSS 한 번이면 전부 가져갈 수 있기 때문이다. 쿠키라면 HttpOnly로 이 위험을 줄일 수 있다.
- 자주 쓰는 구성: **Refresh Token은 HttpOnly 쿠키**, **Access Token은 짧은 만료 시간으로 메모리**에 둔다. 새로고침하면 refresh 요청으로 access token을 다시 받는다.
- 주의: HttpOnly는 "쿠키를 **읽는 것**"만 막는다. XSS가 실행 중이면 `fetch()`로 요청을 보낼 수 있고, 쿠키는 그 요청에 그대로 붙는다. 즉 탈취는 막아도 **사용자 행세는 막지 못한다**. 그래서 XSS 자체를 막는 것이 먼저다.

### 쿠키 설정 예시

```http
Set-Cookie: __Host-refresh=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1209600
```

- `HttpOnly`: `document.cookie`로 읽을 수 없다. 단, `fetch()`/XHR 요청에는 그대로 실려 간다.
- `Secure`: `https:` 요청에만 보낸다 (localhost는 예외).
- `SameSite`
  - `Strict`: 같은 사이트에서 시작된 요청에만 보낸다. 다른 사이트의 링크로 들어와도 처음엔 로그인이 안 된 것처럼 보일 수 있다.
  - `Lax`: 같은 사이트 요청 + 다른 사이트에서 **링크를 눌러 이동하는 GET**에만 보낸다. 다른 사이트에서 온 POST, `fetch()`, 이미지·iframe 요청에는 안 보낸다.
  - `None`: 모든 요청에 보낸다. 반드시 `Secure`와 함께 써야 한다.
  - 지정하지 않으면 일부 브라우저는 `Lax`를 기본으로 쓴다. 브라우저마다 다를 수 있으니 직접 지정한다.
- `__Host-` 접두사: `Secure` 필수, `Domain` 지정 금지, `Path=/` 필수. 서브도메인에서 이 쿠키를 덮어쓰지 못하게 한다.

### XSS 막기

```tsx
// 안전: JSX는 값을 문자열로 이스케이프해서 넣는다
<p>{comment.text}</p>

// 위험: HTML을 그대로 넣는다 → <img src=x onerror="..."> 가 실행된다
<p dangerouslySetInnerHTML={{ __html: comment.html }} />

// HTML을 꼭 넣어야 하면 sanitize 후에
import DOMPurify from 'dompurify';
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.html) }} />
```

- **출력 이스케이프**: 사용자 입력은 텍스트로 넣는다. React JSX, Vue `{{ }}`는 기본으로 이스케이프한다.
- **위험한 API 피하기**: `innerHTML`, `outerHTML`, `insertAdjacentHTML()`, `document.write()`, `eval()`, 문자열을 넘긴 `setTimeout`/`setInterval`. `href`에 사용자 입력을 넣을 때는 `javascript:` URL을 막는다.
- **sanitize**: 에디터 결과처럼 HTML이 꼭 필요하면 DOMPurify 같은 검증된 라이브러리로 정리한다. 직접 정규식으로 거르지 않는다.
- **CSP (Content Security Policy)**: 위가 뚫려도 브라우저가 스크립트를 실행하지 않게 하는 2차 방어선이다. 입력 처리를 대신하지는 않는다.

```http
Content-Security-Policy: script-src 'nonce-랜덤값'; object-src 'none'; base-uri 'none';
```

```html
<script nonce="랜덤값" src="/main.js"></script>
```

- nonce는 **응답마다 새로 만든 예측 불가능한 값**이어야 한다. 같은 nonce가 붙은 스크립트만 실행되고, 공격자가 끼워 넣은 인라인 스크립트·`onerror` 같은 인라인 핸들러·`eval()`은 막힌다.

### CSRF 막기

- 공격 흐름: 사용자가 우리 사이트에 로그인한 상태로 악성 사이트에 방문 → 악성 사이트가 우리 API로 요청을 보내게 함 → 브라우저가 쿠키를 자동으로 붙임 → 서버는 정상 요청으로 처리
- 쿠키 **만으로** 로그인한 사용자인지 확인하는 사이트는 CSRF에 취약하다.

| 방법 | 설명 |
|---|---|
| **SameSite 쿠키** | `Strict` 또는 `Lax`로 다른 사이트에서 온 요청에 쿠키를 안 붙인다. 가능하면 Strict, 어렵다면 Lax. 단, 같은 사이트(서브도메인)끼리는 막지 못해서 완전한 방어는 아니다 |
| **CSRF 토큰** | 서버가 예측할 수 없는 값을 페이지에 넣어 주고, 상태를 바꾸는 요청마다 이 값을 확인한다. 폼은 hidden input, `fetch()`는 커스텀 헤더(`X-CSRF-Token`)로 보낸다. 다른 사이트는 이 값을 알 수 없다 |
| **Sec-Fetch-Site 확인** | 브라우저가 붙여 주는 헤더로 요청이 어디서 시작됐는지 서버에서 확인한다. `same-origin`/`same-site`만 허용하고 `cross-site`는 거절한다 |
| **단순 요청(simple request) 피하기** | `Content-Type: application/json`이나 커스텀 헤더를 쓰면 다른 사이트의 폼으로는 같은 요청을 만들 수 없다. 단, CORS에서 그 origin을 `Access-Control-Allow-Credentials`와 함께 허용하면 소용없다 |
| **GET으로 상태 변경 금지** | `GET /delete?id=1` 같은 API는 이미지 태그 하나로도 호출된다. Lax 쿠키도 GET 이동에는 실린다 |

```ts
// 프론트엔드: 상태를 바꾸는 요청에 CSRF 토큰을 헤더로 함께 보낸다
await fetch('/api/transfer', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // 서버가 페이지(meta 태그 등)로 내려준 값
  },
  body: JSON.stringify({ to, amount }),
});
```

- 토큰을 쿠키가 아니라 `Authorization: Bearer` 헤더로 보내는 방식은 브라우저가 자동으로 붙이지 않으니 CSRF에는 안전하다. 대신 토큰을 JS가 읽을 수 있는 곳에 둬야 해서 XSS에 더 약하다. **어떤 방식이든 하나를 얻으면 하나를 내준다**는 점을 설명할 수 있어야 한다.

### 정리

| | XSS | CSRF |
|---|---|---|
| 무엇이 문제 | 공격자 스크립트가 **우리 페이지 안에서** 실행 | 다른 사이트가 **사용자 쿠키로** 우리 서버에 요청 |
| 노리는 것 | 토큰·개인정보 탈취, 사용자 행세 | 송금·비밀번호 변경 같은 원치 않는 작업 |
| 쿠키 속성 | `HttpOnly` (탈취 방지) | `SameSite` (교차 사이트 전송 제한) |
| 주요 방어 | 출력 이스케이프, sanitize, 위험한 API 금지, CSP | CSRF 토큰, Sec-Fetch-Site 확인, JSON·커스텀 헤더, GET으로 변경 금지 |
| 관계 | XSS가 뚫리면 같은 페이지에서 요청하므로 CSRF 방어도 우회된다 | — |

- 면접 답변 요약: "토큰은 localStorage에 두면 XSS로 바로 탈취되기 때문에 HttpOnly·Secure·SameSite 쿠키에 담고, access token은 짧게 메모리에 두는 식으로 구성합니다. 쿠키는 자동 전송되니 CSRF는 SameSite에 더해 CSRF 토큰이나 Sec-Fetch-Site 확인으로 막고, 상태를 바꾸는 요청은 GET으로 만들지 않습니다. XSS는 JSX 같은 출력 이스케이프를 기본으로 하고, HTML이 필요하면 DOMPurify로 sanitize하며, CSP로 한 번 더 막습니다. HttpOnly는 탈취만 막을 뿐 XSS가 실행되면 요청은 보낼 수 있으므로, XSS 방어가 가장 먼저입니다."

### 관련 질문

- [쿠키, sessionStorage, localStorage의 차이점](../HTML-questions/06-difference-between-cookie-sessionstorage-localstorage.md)
- [OAuth에 대해서 설명해주세요](./OAuth.md)
- [CORS](./cors.md)

### 참고

- [Set-Cookie (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [Cross-site request forgery (CSRF) (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF)
- [Cross-site scripting (XSS) (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS)
- [Content Security Policy (CSP) (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [HTML5 Security Cheat Sheet (OWASP)](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
