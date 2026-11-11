# Q : Trusted Types는 무엇이고 XSS를 어떻게 막나요?

<br />

# A : Trusted Types는 `innerHTML`, `eval()`, `script.src`처럼 문자열을 코드나 HTML로 실행할 수 있는 위험한 API(sink)에 **일반 문자열을 넣지 못하게** 하는 브라우저 기능입니다. CSP에 `require-trusted-types-for 'script'`를 걸면 이런 곳에 문자열을 넣는 순간 TypeError가 나고, 미리 정해 둔 정책(policy)을 거쳐 만든 `TrustedHTML` 같은 객체만 들어갈 수 있습니다. 그래서 "어디선가 sanitize를 빼먹은 코드"가 있어도 실행 전에 브라우저가 막아 주고, 검사해야 할 곳이 코드 전체가 아니라 정책 몇 개로 줄어듭니다. 2026년 2월부터 모든 주요 브라우저에서 쓸 수 있습니다(Baseline 2026).

### 왜 필요한가

- DOM 기반 XSS는 대부분 사용자 입력이 `innerHTML` 같은 곳에 그대로 들어가서 생긴다.
- 지금까지는 "모든 `innerHTML` 앞에 DOMPurify를 붙였는지" 사람이 리뷰로 확인해야 했다. 한 곳만 빠져도 뚫린다.
- Trusted Types는 이걸 **브라우저가 강제**한다. 정책을 거치지 않은 문자열은 아예 들어가지 않는다.

### 막는 위험한 API (sink)

| 필요한 타입 | 대표적인 sink |
|---|---|
| `TrustedHTML` | `innerHTML`, `outerHTML`, `insertAdjacentHTML()`, `document.write()`, `DOMParser.parseFromString()`, iframe `srcdoc` |
| `TrustedScript` | `eval()`, `new Function()`, 문자열을 넘긴 `setTimeout`/`setInterval`, `script.text`/`textContent` |
| `TrustedScriptURL` | `script.src`, `navigator.serviceWorker.register()`, `new Worker(url)`, `importScripts()` |

### 사용 방법

```http
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types my-policy dompurify
```

- `require-trusted-types-for 'script'`: 위 sink에 문자열을 넣으면 TypeError가 난다.
- `trusted-types`: 만들 수 있는 정책 이름 목록. 목록에 없는 이름으로 `createPolicy()`를 부르면 에러가 난다. 아무 코드나 정책을 만들어 우회하지 못하게 한다.

```js
// 정책: "이 함수를 거친 값만 HTML로 넣을 수 있다"
const policy = trustedTypes.createPolicy('my-policy', {
  createHTML: (input) => DOMPurify.sanitize(input),
});

element.innerHTML = userInput;                     // TypeError: 문자열은 거부
element.innerHTML = policy.createHTML(userInput);  // TrustedHTML 객체는 통과
```

```js
// DOMPurify는 바로 TrustedHTML을 돌려줄 수도 있다
element.innerHTML = DOMPurify.sanitize(html, { RETURN_TRUSTED_TYPE: true });
```

- 핵심은 **sanitize하는 곳이 정책 안 한 군데로 모인다**는 것이다. 보안 리뷰는 정책 코드만 보면 된다.

### 기존 프로젝트에 도입하는 순서

1. **Report-Only로 시작**: 막지 않고 위반만 보고받는다.
   ```http
   Content-Security-Policy-Report-Only: require-trusted-types-for 'script'; report-uri /csp-report
   ```
   개발 중에는 브라우저에서 바로 확인할 수도 있다.
   ```js
   document.addEventListener('securitypolicyviolation', console.error.bind(console));
   ```
2. **위반 코드 고치기**: `innerHTML` 대신 `textContent`를 쓰는 등 아예 sink를 안 쓰게 바꾸는 게 가장 좋다. 꼭 HTML이 필요하면 정책이나 DOMPurify를 거친다.
3. **기본 정책(default policy)은 마지막 수단**: 이름이 `default`인 정책을 만들면 정책을 거치지 않은 문자열이 자동으로 여기를 지난다. 고치기 어려운 외부 라이브러리 때문에 임시로 쓰고, 이전이 끝나면 없앤다.
   ```js
   trustedTypes.createPolicy('default', {
     createHTML: (string) => DOMPurify.sanitize(string, { RETURN_TRUSTED_TYPE: true }),
   });
   ```
4. **강제 적용**: `Content-Security-Policy`(Report-Only가 아닌 것)로 바꾼다.

### 주의할 점

- HTTPS나 localhost 같은 **보안 컨텍스트에서만** 동작한다.
- Trusted Types는 "정책을 거쳤는지"만 확인한다. 정책 안의 sanitize가 잘못되면 여전히 XSS가 생긴다.
- 지원하지 않는 환경을 위해 MDN은 아래처럼 아주 작은 대체 코드(tinyfill)를 소개한다. 이 경우 정책 함수가 그냥 문자열을 돌려준다.
  ```js
  if (typeof trustedTypes === 'undefined') trustedTypes = { createPolicy: (n, rules) => rules };
  ```
- React의 JSX `{text}`는 텍스트로 넣기 때문에 sink를 거치지 않는다. 문제는 `dangerouslySetInnerHTML`, `ref`로 직접 `innerHTML`을 바꾸는 코드, 내부에서 `innerHTML`을 쓰는 외부 라이브러리다. Report-Only로 먼저 이런 곳을 찾는다.

### CSP의 다른 방어와 비교

| | 막는 것 |
|---|---|
| CSP `script-src` (nonce 등) | 허락하지 않은 `<script>`, 인라인 스크립트, 인라인 이벤트 핸들러 실행 |
| Trusted Types | JS 코드가 **문자열을 위험한 API에 넣는 것** (DOM XSS) |

- 둘은 서로 다른 곳을 막으므로 같이 쓴다.

- 면접 답변 요약: "Trusted Types는 innerHTML, eval, script.src 같은 위험한 API에 일반 문자열을 넣지 못하게 하는 브라우저 기능입니다. CSP에 require-trusted-types-for 'script'를 걸면 정책을 거쳐 만든 TrustedHTML 같은 객체만 들어갈 수 있어서, sanitize를 빼먹은 코드가 있어도 브라우저가 막아 줍니다. 검사할 곳이 정책 몇 개로 줄어드는 게 장점입니다. 도입할 때는 Report-Only로 위반을 먼저 모으고, 코드를 고친 뒤, 기본 정책은 이전용으로만 잠깐 쓰고 강제 적용으로 바꿉니다."

### 관련 질문

- [인증 토큰과 XSS·CSRF는 어떻게 다루나요?](./auth-token-xss-csrf.md)

### 참고

- [Trusted Types API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [Prevent DOM-based cross-site scripting vulnerabilities with Trusted Types (web.dev)](https://web.dev/articles/trusted-types)
- [Cross-site scripting (XSS) (MDN)](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS)
