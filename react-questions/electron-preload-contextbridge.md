# Q : Electron의 preload 스크립트와 contextBridge는 왜 필요한가요?

<br />

# A : 렌더러(웹 페이지)는 보안 때문에 Node.js와 Electron API에 직접 접근할 수 없습니다. 그런데 파일 열기처럼 메인 프로세스의 기능이 필요할 때가 있어서, 그 사이에 **창구**가 필요합니다. **preload 스크립트**는 렌더러 안에서 페이지보다 먼저 실행되고 `ipcRenderer` 같은 Electron 모듈을 쓸 수 있는 특별한 스크립트입니다. 하지만 preload는 페이지와 **분리된 JavaScript 환경(context isolation)**에서 실행되므로, preload에서 `window.x = ...`를 해도 페이지에서는 보이지 않습니다. 그래서 **`contextBridge.exposeInMainWorld`**로 "페이지에 공개할 함수"만 골라서 안전하게 넘겨줍니다. 결과적으로 페이지(와 혹시 생길 XSS 공격 코드)는 Node.js 전체가 아니라 **미리 정한 몇 개의 함수만** 쓸 수 있게 되는 것이 핵심입니다.

### 흐름

```
[메인 프로세스]  ipcMain.handle('dialog:openFile', ...)
        ▲ IPC
[preload]  ipcRenderer.invoke('dialog:openFile')   ← Electron 모듈 사용 가능, 페이지와 분리된 환경
        │ contextBridge.exposeInMainWorld('electronAPI', { openFile })
        ▼
[페이지 (React)]  window.electronAPI.openFile()     ← 공개된 함수만 보임
```

```js
// main.js
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'), // 창마다 preload 지정
  },
});
```

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  platform: process.platform, // 값도 넘길 수 있다 (복사·동결됨)
});
```

```ts
// 렌더러 (React + TypeScript): 타입 선언을 해 두면 자동 완성이 된다
declare global {
  interface Window {
    electronAPI: { openFile: () => Promise<string | undefined>; platform: string };
  }
}
const path = await window.electronAPI.openFile();
```

### context isolation이 없으면?

```js
// preload.js
window.hello = 'wave';

// 페이지에서
console.log(window.hello); // undefined — 서로 다른 JavaScript 환경이라서
```

- preload와 페이지가 같은 환경을 공유하면, 페이지(또는 XSS로 들어온 코드)가 preload와 Electron 내부 코드가 쓰는 전역 객체에 손을 대서 preload가 가진 권한에 접근할 수 있다.
- 그래서 Electron 12부터 context isolation이 기본으로 켜져 있고, 공식 문서는 **모든 앱**에 권장한다.

### contextBridge가 넘겨주는 방식

- **함수**는 프록시로 넘어간다. 페이지에서 부르면 preload 환경에서 실행된다.
- **값**(객체, 배열, 문자열 등)은 복사되고 **동결(freeze)**된다. 페이지에서 바꿔도 preload 쪽에는 영향이 없다.
- 프로토타입·클래스 인스턴스·Symbol은 유지되지 않는다.
- `ipcRenderer` 모듈 자체를 넘기면 빈 객체가 된다(Electron 29부터 넘길 수 없음). 넘기려는 시도 자체가 위험한 패턴이다.

### 잘못된 예 vs 좋은 예

```js
// 나쁨: 아무 채널로나 IPC를 보낼 수 있다 → XSS가 생기면 메인의 모든 핸들러를 호출 가능
contextBridge.exposeInMainWorld('myAPI', {
  send: ipcRenderer.send,
});

// 나쁨: Node 모듈을 그대로 공개
contextBridge.exposeInMainWorld('fs', require('fs')); // (sandbox에서는 아예 불가)

// 좋음: 채널 하나에 함수 하나, 인자도 필요한 것만
contextBridge.exposeInMainWorld('myAPI', {
  loadPreferences: () => ipcRenderer.invoke('load-prefs'),
});
```

- 공개하는 함수는 **"이 페이지가 정말 해야 하는 일"**만. 예: "아무 파일 읽기"가 아니라 "설정 파일 읽기".
- 메인의 `handle` 쪽에서도 인자를 검증한다. preload를 우회한 요청이 올 수 있다고 가정한다.

### sandbox와 함께일 때

- Electron 20부터 렌더러는 기본으로 **sandbox**에서 실행된다. 이때 preload의 `require`는 `electron` 모듈의 일부(`contextBridge`, `ipcRenderer`, `webFrame`, `webUtils` 등)만 불러올 수 있고, `fs` 같은 Node 내장 모듈은 쓸 수 없다.
- 그래서 파일 읽기 같은 실제 작업은 메인 프로세스에서 하고, preload는 **IPC로 연결만** 해 주는 얇은 층으로 두는 것이 기본 구조다.
- preload를 여러 파일로 나누고 싶으면 번들러로 한 파일로 묶는다.

- 면접 답변 요약: "렌더러는 보안 때문에 Node.js와 Electron API에 직접 접근할 수 없어서, 렌더러에서 페이지보다 먼저 실행되는 preload 스크립트를 창구로 씁니다. preload는 context isolation으로 페이지와 분리된 환경에서 실행되므로, contextBridge.exposeInMainWorld로 공개할 함수만 골라 window에 붙입니다. ipcRenderer 전체나 Node 모듈을 그대로 공개하면 XSS 한 번으로 시스템 권한이 넘어가므로, 채널 하나에 함수 하나씩만 열고 메인에서 인자와 보낸 쪽을 검증합니다."

### 관련 질문

- [Electron에서 메인과 렌더러 프로세스는 어떻게 통신하나요? (IPC)](./electron-ipc.md)
- [Electron의 메인 프로세스와 렌더러 프로세스는 각각 무슨 역할인가요?](./electron-process-model.md)

### 참고

- [Context Isolation (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [contextBridge (Electron 문서)](https://www.electronjs.org/docs/latest/api/context-bridge)
- [Process Sandboxing (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/sandbox)
