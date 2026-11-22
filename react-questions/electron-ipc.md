# Q : Electron에서 메인과 렌더러 프로세스는 어떻게 통신하나요? (IPC)

<br />

# A : 두 프로세스는 메모리를 공유하지 않기 때문에 **IPC(Inter-Process Communication)**, 즉 이름 붙인 채널로 메시지를 주고받아 통신합니다. 메인 프로세스는 `ipcMain`, 렌더러 쪽은 `ipcRenderer`를 쓰고, 렌더러는 보안상 `ipcRenderer`를 직접 갖지 않으므로 **preload 스크립트에서 `contextBridge`로 필요한 함수만 열어 줍니다.** 패턴은 세 가지입니다. 렌더러가 결과를 받을 필요 없이 보내기만 하면 `send` / `ipcMain.on`, 결과를 받아야 하면 `invoke` / `ipcMain.handle`(Promise로 응답), 메인이 렌더러에게 알려야 하면 `webContents.send` / `ipcRenderer.on`을 씁니다. 메시지는 구조화된 복제(structured clone)로 복사되기 때문에 DOM 요소나 함수는 보낼 수 없고, 보안을 위해 채널마다 함수를 하나씩만 열고 메인에서 보낸 쪽(sender)을 검증합니다.

### 1. 렌더러 → 메인 (보내기만): `send` / `on`

```js
// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.send('set-title', title),
});

// main.js
ipcMain.on('set-title', (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setTitle(title);
});

// 렌더러 (React)
window.electronAPI.setTitle('새 문서');
```

### 2. 렌더러 ↔ 메인 (요청하고 결과 받기): `invoke` / `handle` — 가장 많이 씀

```js
// main.js
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog();
  if (!canceled) return filePaths[0];
});

// preload.js
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
});

// 렌더러
const filePath = await window.electronAPI.openFile(); // Promise로 결과를 받는다
```

- 서버에 `fetch`하는 것과 비슷하다고 보면 된다. 메인이 "API 서버", 채널 이름이 "엔드포인트".
- `handle`에서 에러를 던지면 렌더러의 Promise가 reject된다. 단, 에러 객체 전체가 아니라 `message`만 전달된다.

### 3. 메인 → 렌더러 (알림): `webContents.send` / `ipcRenderer.on`

```js
// main.js — 메뉴 클릭 등 메인에서 일어난 일을 화면에 알린다
mainWindow.webContents.send('update-counter', 1);

// preload.js — 콜백을 그대로 넘기지 말고 값만 전달
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateCounter: (callback) =>
    ipcRenderer.on('update-counter', (_event, value) => callback(value)),
});

// 렌더러 (React)
useEffect(() => {
  window.electronAPI.onUpdateCounter((value) => setCount((c) => c + value));
}, []);
```

- 이 방향에는 `invoke` 같은 요청-응답 방식이 없다. 응답이 필요하면 렌더러가 다시 `send`로 보낸다.
- `ipcRenderer.on(채널, callback)`처럼 콜백을 그대로 넘기면 이벤트 객체(`event.sender`)를 통해 `ipcRenderer`가 페이지로 새어 나간다. 그래서 위처럼 값만 꺼내서 넘긴다.
- React에서는 컴포넌트가 사라질 때 리스너를 지울 수 있도록, preload에서 해제 함수를 돌려주게 만드는 것이 좋다.

### 세 가지 패턴 정리

| 방향 | 렌더러 쪽 (preload) | 메인 쪽 | 응답 |
|---|---|---|---|
| 렌더러 → 메인 | `ipcRenderer.send` | `ipcMain.on` | 없음 |
| 렌더러 ↔ 메인 | `ipcRenderer.invoke` | `ipcMain.handle` | Promise로 받음 |
| 메인 → 렌더러 | `ipcRenderer.on` | `webContents.send` | 없음 |

### 주의할 점

- **`ipcRenderer` 전체를 노출하지 않는다.** `send: ipcRenderer.send`처럼 열면 페이지(와 XSS 공격자)가 아무 채널로나 메시지를 보낼 수 있다. 채널 하나에 함수 하나(`openFile`, `loadPreferences`)로 연다.
- **보낸 쪽을 검증한다.** 공식 보안 체크리스트는 모든 IPC 메시지의 `sender`를 확인하라고 한다. URL이 아니라 `event.senderFrame.origin`으로 비교한다.
- **보낼 수 있는 값**: 구조화된 복제로 복사되므로 일반 객체·배열·Date·Map 등은 되지만, DOM 요소, 함수, `WebContents` 같은 Electron 객체는 안 된다.
- **동기 IPC(`sendSync`) 금지**: 응답이 올 때까지 렌더러 전체가 멈춘다.
- 메인의 `handle`은 무거운 작업을 동기로 하지 않는다. 메인이 막히면 모든 창이 멈춘다.

- 면접 답변 요약: "메인과 렌더러는 메모리를 공유하지 않아서 이름 붙인 채널로 메시지를 주고받는 IPC를 씁니다. 렌더러가 결과를 받아야 하면 invoke와 handle로 Promise 기반 요청-응답을 하고, 보내기만 하면 send와 on, 메인이 화면에 알릴 때는 webContents.send를 씁니다. 렌더러는 ipcRenderer를 직접 갖지 않고 preload에서 contextBridge로 채널별 함수만 열어 주며, 메인에서는 senderFrame의 origin으로 보낸 쪽을 검증합니다. 메시지는 구조화된 복제로 복사되므로 DOM이나 함수는 보낼 수 없습니다."

### 관련 질문

- [Electron의 메인 프로세스와 렌더러 프로세스는 각각 무슨 역할인가요?](./electron-process-model.md)

### 참고

- [Inter-Process Communication (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Security (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/security)
