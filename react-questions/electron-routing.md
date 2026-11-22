# Q : Electron 앱에서 React 라우팅은 어떻게 하나요? (BrowserRouter vs HashRouter)

<br />

# A : 웹에서 쓰는 `BrowserRouter`는 `/about` 같은 **주소의 경로(pathname)**로 화면을 고르고, 새로고침하면 서버가 어떤 경로든 `index.html`을 돌려준다는 전제(SPA fallback)로 동작합니다. 그런데 Electron 배포 앱은 보통 `loadFile`로 **`file:///C:/.../index.html`** 같은 파일 주소에서 열리기 때문에, 첫 화면의 경로부터 `/`가 아니라 파일 경로라서 라우트가 맞지 않고, 새로고침하면 `file:///about` 같은 **없는 파일**을 찾게 됩니다. 그래서 Electron에서는 경로를 **주소의 해시(`#/about`) 부분에 저장하는 `HashRouter`**를 많이 씁니다. 해시는 파일을 찾을 때 쓰이지 않으므로 항상 같은 `index.html`이 열리고, React Router가 해시를 보고 화면을 고릅니다. 공식 보안 문서가 권하는 대로 **커스텀 프로토콜(`app://`)로 앱 파일을 제공**하면서 모르는 경로는 `index.html`로 돌려주면 `BrowserRouter`도 쓸 수 있습니다.

### 무엇이 다른가

| | BrowserRouter | HashRouter |
|---|---|---|
| 주소 모양 | `app.com/settings/profile` | `index.html#/settings/profile` |
| 경로 저장 위치 | pathname | hash (`#` 뒤) |
| 새로고침 시 | 서버가 모든 경로에 index.html을 줘야 함 | 해시는 서버·파일 요청에 쓰이지 않으므로 항상 같은 파일 |
| 웹 배포 | 기본 선택 (SEO, 깔끔한 URL) | 서버 설정을 못 바꿀 때 |
| Electron `loadFile` | 그대로는 문제 | 바로 동작 |

- React Router 문서도 HashRouter를 "위치를 URL의 hash 부분에 저장해서 **서버로 보내지 않는** 라우터"라고 설명한다. 서버(여기서는 파일 시스템)가 경로를 알 필요가 없게 만드는 것이다.

### 방법 1: HashRouter (가장 간단)

```jsx
// src/renderer/main.jsx
import { HashRouter, Routes, Route } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </HashRouter>
);
// 화면 이동은 똑같이 <Link to="/settings">, useNavigate() 사용
// 실제 주소: file:///.../index.html#/settings
```

- 코드의 나머지 부분(`Link`, `useNavigate`, `useParams`)은 그대로다. 라우터 컴포넌트만 바꾼다.
- 데이터 라우터를 쓰면 `createBrowserRouter` 대신 `createHashRouter`를 쓴다.
- 웹과 Electron에 같은 코드를 쓴다면 환경에 따라 고른다.
  ```js
  const Router = window.electronAPI ? HashRouter : BrowserRouter;
  ```

### 방법 2: 커스텀 프로토콜 + BrowserRouter

```js
// main.js (개념 예시) — app://bundle/... 요청을 앱 폴더의 파일로 응답
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]); // ready 이전에

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url);
    const file = path.join(RENDERER_DIR, pathname);
    // 앱 폴더 밖으로 나가는 경로는 막고, 파일이 없으면(=라우트 경로) index.html로
    if (!file.startsWith(RENDERER_DIR + path.sep)) return new Response('Forbidden', { status: 403 });
    const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(RENDERER_DIR, 'index.html');
    return net.fetch(pathToFileURL(target).toString());
  });
  win.loadURL('app://bundle/');
});
```

- 웹 서버의 "SPA fallback"을 Electron 안에서 직접 구현하는 것이다. 주소가 `app://bundle/settings`처럼 깔끔해지고, `file://`이 가진 "컴퓨터의 모든 파일에 접근 가능" 문제도 피한다(공식 보안 체크리스트 18번).
- 공식 `protocol` 문서의 예시도 요청 경로가 앱 폴더 밖으로 나가지 않는지 검사한다. 이 검사를 빼면 `app://bundle/../../` 같은 요청으로 다른 파일을 읽힐 수 있다.

### 같이 겪는 문제: 빈 화면과 리소스 경로

- `loadFile`로 열었는데 **화면이 하얗다면** 대부분 JS·CSS 경로 문제다. Vite 빌드 결과의 `/assets/index.js`는 `file:///assets/index.js`(드라이브 최상위)로 해석된다.
  ```js
  // vite.config.js (렌더러) — 상대 경로로 빌드
  export default defineConfig({ base: './' });
  ```
- 개발(`http://localhost:5173`)에서는 잘 되다가 배포에서만 깨지는 이유가 이것이다. 배포 빌드로 꼭 한 번 실행해 본다.
- 화면 상태를 주소에 담을 필요가 없는 단일 창 도구라면 `MemoryRouter`(주소를 쓰지 않고 메모리에만 기록)도 선택지다.

- 면접 답변 요약: "BrowserRouter는 pathname으로 화면을 고르고 서버가 모든 경로에 index.html을 돌려준다는 전제로 동작하는데, Electron 배포 앱은 file:// 주소의 index.html에서 열려서 첫 경로가 파일 경로이고 새로고침하면 없는 파일을 찾게 됩니다. 그래서 경로를 해시에 저장하는 HashRouter를 쓰면 항상 같은 파일이 열리고 해시로 화면을 고를 수 있습니다. 깔끔한 주소가 필요하면 protocol.handle로 커스텀 프로토콜을 만들어 없는 경로를 index.html로 돌려주면 BrowserRouter도 쓸 수 있고, file:// 보안 문제도 피할 수 있습니다. 함께 Vite base를 './'로 설정해 리소스 경로 문제를 막습니다."

### 관련 질문

- [React(Vite) 프로젝트에 Electron을 붙이려면 어떻게 구성하나요?](./electron-react-setup.md)
- [React-Router에 대한 설명과 동작방식에 대해서 설명해주세요](./react-router.md)

### 참고

- [HashRouter (React Router)](https://reactrouter.com/api/declarative-routers/HashRouter)
- [protocol (Electron 문서)](https://www.electronjs.org/docs/latest/api/protocol)
- [Security — Avoid usage of the file:// protocol (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/security)
