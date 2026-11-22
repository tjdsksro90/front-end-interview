# Q : React(Vite) 프로젝트에 Electron을 붙이려면 어떻게 구성하나요?

<br />

# A : Electron 앱은 **세 부분**으로 나뉩니다. 창을 만드는 **메인 프로세스 코드**, 렌더러에 API를 열어 주는 **preload**, 그리고 화면인 **React 앱(렌더러)**입니다. React 쪽은 일반 Vite 프로젝트와 거의 같고, 다른 점은 개발할 때는 메인 프로세스가 **Vite 개발 서버 주소를 `loadURL`**로 띄워 HMR을 쓰고, 배포할 때는 **빌드된 `index.html`을 `loadFile`**(또는 커스텀 프로토콜)로 띄운다는 것입니다. 이 세 부분을 각각 빌드하고 개발 서버와 Electron을 함께 실행하는 설정을 직접 하기는 번거로워서, 보통 **electron-vite**(main·preload·renderer를 설정 파일 하나로 관리, React 템플릿 제공)나 **Electron Forge**(공식 패키징·배포 도구, Vite 템플릿 제공)로 시작합니다.

### 폴더 구조 (electron-vite 기준)

```
my-app/
├─ electron.vite.config.js   ← main / preload / renderer 설정을 한 파일에
├─ src/
│  ├─ main/index.js          ← 메인 프로세스 (창 만들기, IPC 핸들러)
│  ├─ preload/index.js       ← contextBridge로 API 공개
│  └─ renderer/              ← React 앱 (일반 Vite 프로젝트와 같다)
│     ├─ index.html
│     └─ src/App.jsx
└─ out/                      ← 빌드 결과 (package.json "main": "./out/main/index.js")
```

```bash
# React 템플릿으로 시작
npm create @quick-start/electron@latest my-app -- --template react
```

```jsonc
// package.json
{
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",        // 렌더러 HMR + 메인·preload 변경 시 재시작
    "build": "electron-vite build",
    "start": "electron-vite preview"
  }
}
```

```js
// electron.vite.config.js
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {},
  preload: {},
  renderer: { plugins: [react()] },
});
```

- electron-vite는 렌더러는 브라우저용으로, 메인·preload는 Node.js용으로 나눠 번들한다. 렌더러는 HMR, 메인·preload는 바뀌면 다시 불러온다.

### 개발 / 배포에서 화면을 띄우는 방법

```js
// src/main/index.js (개념 예시)
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: { preload: path.join(__dirname, '../preload/index.js') },
  });

  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');                       // 개발: Vite 개발 서버 (HMR)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html')); // 배포: 빌드된 파일
  }
}
```

- 개발 중에는 렌더러가 `http://localhost`에서 열리고, 배포 후에는 `file://`에서 열린다. **이 차이 때문에 라우팅·경로 문제가 생긴다**(다음 질문 참고).
- 공식 보안 문서는 `file://` 대신 `protocol.handle`로 만든 커스텀 프로토콜(`app://`)로 앱 파일을 제공하라고 권한다.

### Electron Forge로 시작하는 경우

```bash
npx create-electron-app@latest my-app --template=vite   # vite, vite-typescript, webpack, webpack-typescript
cd my-app
npm start        # 개발 실행
npm run make     # 설치 파일 만들기
npm run publish  # GitHub Releases 등에 배포
```

- Forge는 Electron 공식 패키징·배포 도구다. Vite 템플릿에 React를 추가해 쓴다. (Forge의 Vite 지원은 v7.5.0부터 실험적 단계로 표시돼 있다)

| | electron-vite | Electron Forge |
|---|---|---|
| 강점 | Vite 중심, 빠른 개발 환경, React 템플릿 | 공식 도구, 패키징·코드 서명·배포·자동 업데이트까지 |
| 약점 | 패키징은 별도 도구 필요 | Vite 지원이 실험적 |
| 고르는 기준 | 개발 경험이 우선 | 배포 파이프라인이 우선 |

### React 쪽에서 신경 쓸 것

- **Electron API는 `window.electronAPI`로만**: 렌더러에서 `import { ipcRenderer } from 'electron'`을 하면 동작하지 않는다(그리고 하면 안 된다). preload가 공개한 함수를 쓴다.
- **브라우저에서도 열리게**: `window.electronAPI`가 없을 때를 대비하면 같은 React 앱을 웹과 데스크톱에 함께 쓸 수 있다.
  ```js
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  ```
- **라우터**: 배포 시 `file://`에서 열리므로 `BrowserRouter` 대신 `HashRouter`를 쓰거나 커스텀 프로토콜을 설정한다.
- **보안 설정 유지**: 템플릿의 `contextIsolation`, `sandbox` 기본값을 풀지 않는다.

- 면접 답변 요약: "Electron 앱은 메인 프로세스, preload, React 렌더러 세 부분으로 나눕니다. React 쪽은 일반 Vite 프로젝트와 같고, 개발 중에는 메인 프로세스가 Vite 개발 서버 주소를 loadURL로 띄워 HMR을 쓰고, 배포 후에는 빌드된 index.html을 loadFile이나 커스텀 프로토콜로 띄웁니다. 세 부분의 빌드와 실행을 직접 맞추기 번거로워서 electron-vite나 Electron Forge 템플릿으로 시작하고, 렌더러에서는 preload가 열어 준 window API만 쓰며, file:// 환경 때문에 라우터는 HashRouter를 쓰거나 커스텀 프로토콜을 설정합니다."

### 관련 질문

- [Electron의 메인 프로세스와 렌더러 프로세스는 각각 무슨 역할인가요?](./electron-process-model.md)
- [Electron의 preload 스크립트와 contextBridge는 왜 필요한가요?](./electron-preload-contextbridge.md)

### 참고

- [Getting Started (electron-vite)](https://electron-vite.org/guide/)
- [Getting Started (Electron Forge)](https://www.electronforge.io/)
- [Vite template (Electron Forge)](https://www.electronforge.io/templates/vite)
- [BrowserWindow (Electron 문서)](https://www.electronjs.org/docs/latest/api/browser-window)
