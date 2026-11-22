# Q : Electron의 contextIsolation, nodeIntegration, sandbox 설정은 무엇이고 왜 중요한가요?

<br />

# A : 세 가지 모두 **렌더러(웹 페이지)가 얼마나 강한 권한을 갖는지** 정하는 `BrowserWindow`의 `webPreferences` 설정입니다. `nodeIntegration`은 렌더러에서 Node.js(`require`, `process`)를 바로 쓸 수 있게 할지, `contextIsolation`은 preload·Electron 내부 코드와 웹 페이지의 JavaScript 환경을 분리할지, `sandbox`는 렌더러를 Chromium 샌드박스에 가둬 OS 자원 접근을 막을지 정합니다. Electron 앱은 웹 페이지가 내 컴퓨터 위에서 실행되기 때문에, 페이지에 XSS가 하나만 생겨도 이 설정이 느슨하면 **공격자가 파일을 읽고 명령을 실행하는 원격 코드 실행**으로 이어집니다. 그래서 지금 기본값인 `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`를 **절대 풀지 않고**, 필요한 기능은 preload와 IPC로 좁게 열어 주는 것이 원칙입니다.

### 세 설정 한눈에

| 설정 | 하는 일 | 안전한 값 | 기본값이 된 버전 |
|---|---|---|---|
| `nodeIntegration` | 렌더러에서 Node.js 직접 사용 | `false` | Electron 5 |
| `contextIsolation` | preload·Electron 내부와 페이지의 JS 환경 분리 | `true` | Electron 12 |
| `sandbox` | 렌더러를 Chromium 샌드박스에 가둠 (Node 환경 없음) | `true` | Electron 20 |

```js
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    // 아래는 모두 기본값이다. 명시해 두면 실수로 바꾸는 것을 막기 쉽다
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  },
});
```

### 왜 위험한가: XSS → 원격 코드 실행

```js
// nodeIntegration: true, contextIsolation: false 인 앱에서
// 채팅 메시지에 이런 HTML이 섞여 렌더링되면
<img src=x onerror="require('child_process').exec('...')">
// → 사용자의 컴퓨터에서 명령이 실행된다
```

- 웹 앱의 XSS는 보통 "그 사이트 안에서의 피해"(쿠키 탈취 등)로 끝난다.
- Electron에서 `nodeIntegration`이 켜져 있으면 XSS가 **그 사용자의 컴퓨터 전체에 대한 공격**이 된다. 원격 콘텐츠(외부 URL)를 띄우는 창이라면 더 위험하다.
- 공식 문서는 "어떤 경우에도 Node.js 통합을 켠 채로 원격 코드를 불러와 실행하지 말라"고 한다.

### 각 설정 자세히

**nodeIntegration**
- `true`면 렌더러의 페이지 코드가 `require('fs')`처럼 Node.js를 바로 쓴다. 편하지만, 페이지에 들어온 모든 스크립트(광고, 외부 라이브러리, XSS)도 같은 권한을 갖는다.
- `nodeIntegration: true`로 바꾸면 sandbox도 함께 꺼진다.

**contextIsolation**
- preload와 페이지가 서로 다른 JavaScript 환경(world)에서 실행된다. 페이지는 preload의 변수나 Electron 내부에 접근할 수 없고, `contextBridge`로 공개한 것만 본다.
- `nodeIntegration: false`라도 contextIsolation이 꺼져 있으면 페이지가 preload의 권한에 손댈 수 있어서, 공식 문서는 둘을 **반드시 함께** 쓰라고 한다.
- 켜져 있어도 `ipcRenderer.send`를 통째로 공개하면 소용없다. 공개 범위가 여전히 중요하다.

**sandbox**
- Chromium의 OS 수준 샌드박스로 렌더러 프로세스가 할 수 있는 일을 제한한다. 렌더러 엔진에 버그가 있어도 피해가 프로세스 안에 갇힌다.
- sandbox인 렌더러의 preload는 `require`로 `electron` 모듈 일부만 쓸 수 있고 `fs` 같은 Node 내장 모듈은 쓸 수 없다. 그래서 실제 작업은 메인 프로세스가 하고, preload는 IPC로 연결만 한다.
- `app.enableSandbox()`로 모든 렌더러에 강제할 수 있다(`ready` 이전에 호출).

### 공식 보안 체크리스트에서 함께 챙길 것

| 항목 | 내용 |
|---|---|
| 안전한 콘텐츠만 | HTTPS 등 신뢰할 수 있는 출처만 불러온다 |
| CSP 설정 | `script-src 'self'`처럼 실행할 스크립트 출처를 제한 (`file://`에서는 `<meta>` 태그로) |
| `webSecurity` 끄지 않기 | 끄면 동일 출처 정책이 사라진다 |
| 이동·새 창 제한 | `will-navigate`, `setWindowOpenHandler`로 허용한 주소만. `startsWith` 대신 URL 파서로 비교 (`https://example.com.attacker.com`도 통과하므로) |
| `shell.openExternal` 주의 | 신뢰할 수 없는 URL을 넘기면 임의 명령 실행에 악용될 수 있다 |
| IPC sender 검증 | `event.senderFrame.origin`으로 보낸 쪽 확인 |
| `file://` 대신 커스텀 프로토콜 | `file://` 페이지는 컴퓨터의 모든 파일에 접근할 수 있다. `protocol.handle`로 앱 파일만 제공 |
| 최신 Electron 유지 | Chromium 보안 패치가 함께 들어온다 |

- 면접 답변 요약: "세 설정은 렌더러의 권한을 정합니다. nodeIntegration은 렌더러에서 Node.js를 직접 쓸지, contextIsolation은 preload·Electron 내부와 페이지의 JS 환경을 분리할지, sandbox는 렌더러를 Chromium 샌드박스에 가둘지입니다. Electron에서는 XSS가 하나만 생겨도 이 설정이 느슨하면 사용자 컴퓨터에서 명령을 실행하는 원격 코드 실행이 되기 때문에, 기본값인 nodeIntegration false, contextIsolation true, sandbox true를 유지하고 필요한 기능은 preload와 IPC로 좁게 엽니다. 여기에 CSP, 이동 제한, IPC sender 검증, 커스텀 프로토콜까지 함께 적용합니다."

### 관련 질문

- [Electron의 preload 스크립트와 contextBridge는 왜 필요한가요?](./electron-preload-contextbridge.md)
- [Trusted Types는 무엇이고 XSS를 어떻게 막나요?](../web-questions/trusted-types.md)
- [인증 토큰과 XSS·CSRF는 어떻게 다루나요?](../web-questions/auth-token-xss-csrf.md)

### 참고

- [Security (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Process Sandboxing (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/sandbox)
