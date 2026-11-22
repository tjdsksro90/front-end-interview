# Q : Electron의 메인 프로세스와 렌더러 프로세스는 각각 무슨 역할인가요?

<br />

# A : Electron은 Chromium처럼 **여러 프로세스**로 나뉘어 동작합니다. **메인 프로세스**는 앱에 단 하나 있고 Node.js 환경에서 실행되며, 창(`BrowserWindow`)을 만들고 앱의 생명주기(시작·종료)를 관리하고, 메뉴·대화상자·트레이 같은 OS 기능을 다룹니다. **렌더러 프로세스**는 창마다 하나씩 생기고, 그 창에 띄운 웹 페이지(HTML·CSS·JS, React 앱)를 그립니다. 렌더러는 보안을 위해 기본적으로 Node.js나 `require`에 직접 접근할 수 없어서, 파일 읽기 같은 일은 **preload 스크립트**가 열어 준 API를 통해 메인 프로세스에 요청(IPC)합니다. 정리하면 메인은 "앱과 OS를 관리하는 백엔드", 렌더러는 "창 안의 화면"입니다.

### 구조

```
           ┌──────── 메인 프로세스 (1개, Node.js) ────────┐
           │ app 생명주기 · BrowserWindow 생성 · 메뉴 ·     │
           │ 대화상자 · 트레이 · 파일 시스템 · 자동 업데이트 │
           └──────────────┬───────────────┬──────────────┘
                     IPC  │               │  IPC
          ┌───────────────┴──┐       ┌────┴──────────────┐
          │ 렌더러 (창 A)      │       │ 렌더러 (창 B)       │
          │ preload → React 앱 │       │ preload → 설정 화면 │
          └──────────────────┘       └───────────────────┘
```

| | 메인 프로세스 | 렌더러 프로세스 | preload 스크립트 |
|---|---|---|---|
| 개수 | 앱에 1개 | 창(웹 페이지)마다 1개 | 렌더러마다 |
| 환경 | Node.js | 브라우저 (Chromium) | 렌더러 안, 페이지보다 먼저 실행 |
| Node.js 접근 | 가능 | **기본 불가** | 제한적으로 가능 (sandbox면 `electron` 일부 모듈만) |
| 하는 일 | 창 관리, 앱 생명주기, OS 기능 | 화면 그리기, 사용자 입력 | 렌더러에 안전한 API만 열어 주기 |
| 비유 | 서버(백엔드) | 브라우저 탭 | 둘 사이의 창구 |

### 메인 프로세스

```js
// main.js
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile('index.html'); // 이 페이지는 새 렌더러 프로세스에서 실행된다
}

app.whenReady().then(createWindow);

// 모든 창이 닫히면 종료 (macOS는 관례상 앱을 유지)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- 창을 닫으면 그 창의 렌더러 프로세스도 끝난다. 메인 프로세스는 앱이 끝날 때까지 살아 있다.
- 메인 프로세스가 오래 걸리는 작업으로 멈추면 **모든 창이 멈춘다.** 무거운 작업은 비동기 API나 별도 프로세스로 뺀다.

### 렌더러 프로세스

```jsx
// React 앱 (렌더러) — 일반 웹 앱과 똑같이 작성
function App() {
  const open = async () => {
    const filePath = await window.electronAPI.openFile(); // preload가 열어 준 API
    console.log(filePath);
  };
  return <button onClick={open}>파일 열기</button>;
}
```

- 예전 Electron은 렌더러에서도 Node.js를 바로 쓸 수 있었지만, **보안 문제로 기본값이 바뀌었다.** 웹 페이지에 XSS가 생기면 공격자가 `require('child_process')`로 컴퓨터 명령을 실행할 수 있기 때문이다.
- 지금은 렌더러는 일반 브라우저 탭처럼 동작하고, 필요한 기능만 preload를 통해 받는다.

### preload 스크립트

```js
// preload.js — 렌더러에서 페이지보다 먼저 실행된다
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'), // 정해진 기능만 공개
});
```

- 페이지와는 분리된 JavaScript 환경에서 실행되고(context isolation), `contextBridge`로 정한 함수만 `window`에 붙인다.

### utility process

- 메인 프로세스에서 `utilityProcess`로 Node.js가 동작하는 자식 프로세스를 만들 수 있다. 공식 문서는 신뢰할 수 없는 서비스, CPU를 많이 쓰는 작업, 자주 죽을 수 있는 구성 요소를 여기에 두라고 안내한다. 메인 프로세스를 막지 않기 위해서다.

- 면접 답변 요약: "Electron은 메인 프로세스와 렌더러 프로세스로 나뉩니다. 메인 프로세스는 앱에 하나이고 Node.js 환경에서 창 생성, 앱 생명주기, 메뉴나 대화상자 같은 OS 기능을 담당합니다. 렌더러 프로세스는 창마다 하나씩 생기고 React 같은 웹 화면을 그리는데, 보안 때문에 기본적으로 Node.js에 접근할 수 없습니다. 그래서 preload 스크립트가 contextBridge로 필요한 기능만 열어 주고, 렌더러는 그 API로 IPC를 통해 메인 프로세스에 요청합니다. 메인이 막히면 모든 창이 멈추므로 무거운 작업은 비동기나 별도 프로세스로 처리합니다."

### 관련 질문

- [Electron이란 무엇이고, 웹 앱과 무엇이 다른가요?](./electron-intro.md)

### 참고

- [Process Model (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [utilityProcess (Electron 문서)](https://www.electronjs.org/docs/latest/api/utility-process)
