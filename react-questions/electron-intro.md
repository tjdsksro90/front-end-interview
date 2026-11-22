# Q : Electron이란 무엇이고, 웹 앱과 무엇이 다른가요?

<br />

# A : Electron은 HTML·CSS·JavaScript(React 등)로 **Windows·macOS·Linux 데스크톱 앱**을 만드는 프레임워크입니다. 앱 안에 **Chromium(브라우저 엔진)과 Node.js를 함께 담아서**, 화면은 웹 기술로 그리고, 웹 앱은 할 수 없는 파일 시스템 접근·OS 메뉴·트레이·알림 같은 기능은 Node.js와 Electron API로 씁니다. 웹 앱은 사용자의 브라우저 안에서 보안 제약을 받으며 동작하지만, Electron 앱은 설치되는 프로그램이라 컴퓨터 자원에 직접 접근할 수 있고 오프라인으로도 동작합니다. 대신 브라우저 엔진을 통째로 담기 때문에 앱 용량이 크고(보통 100MB 이상), 직접 접근 권한이 있는 만큼 보안 설정을 더 신경 써야 합니다. VS Code, Slack, Discord, Figma, Notion, Obsidian, Postman 같은 앱이 Electron으로 만들어졌습니다.

### 구성

```
Electron 앱
├─ Chromium   → 화면(HTML·CSS·JS, React)을 그린다
├─ Node.js    → 파일·네트워크·OS 기능
└─ Electron API → 창(BrowserWindow), 메뉴, 트레이, 알림, 자동 업데이트 등
```

```js
// main.js — 앱의 시작점
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile('index.html'); // 웹 페이지를 창에 띄운다
}

app.whenReady().then(createWindow);
```

### 웹 앱과 비교

| | 웹 앱 | Electron 앱 |
|---|---|---|
| 실행 | 사용자의 브라우저에서 URL로 | 설치한 프로그램으로 |
| 브라우저 엔진 | 사용자의 브라우저 (버전 제각각) | 앱에 담긴 Chromium (버전 고정) |
| 파일·OS 접근 | 거의 불가 (권한 요청 API만) | Node.js·Electron API로 가능 |
| 오프라인 | 서비스 워커로 일부 | 기본으로 동작 |
| 배포·업데이트 | 서버에 올리면 끝 | 설치 파일 만들기, 코드 서명, 자동 업데이트 |
| 용량 | 필요한 리소스만 다운로드 | 앱마다 Chromium 포함 (압축해도 약 80~100MB) |
| 보안 위험 | 브라우저 샌드박스 안 | XSS가 내 컴퓨터 접근으로 이어질 수 있어 설정이 중요 |

### 왜 브라우저 엔진을 통째로 담나

- OS에 있는 웹뷰를 쓰면 사용자 OS 버전마다 브라우저 기능이 달라진다. 가장 오래된 지원 OS의 웹뷰에 맞춰야 하고, 안정성·보안·성능 문제도 OS 업데이트를 기다려야 한다.
- Chromium을 담으면 **모든 사용자가 같은 엔진**으로 실행하고, 문제가 생기면 앱 업데이트로 바로 고칠 수 있다.
- 대가는 용량이다. 공식 문서도 대부분의 Electron 앱이 100MB를 넘는다고 설명한다.

### 언제 쓰고, 언제 다른 걸 쓰나

| Electron이 맞는 곳 | 다른 선택이 나은 곳 |
|---|---|
| 웹 서비스를 데스크톱 앱으로도 제공 (Slack, Notion) | 메모리·저장 공간이 작은 기기, IoT |
| 파일을 많이 다루는 도구 (에디터, 메모 앱) | 설치 용량이 아주 작아야 하는 앱 |
| 웹 개발 팀이 세 OS를 한 코드로 지원 | OS 고유 UI가 중요한 앱 (네이티브) |
| 오프라인 + 로컬 데이터가 필요한 앱 | 게임, 실시간 고성능 그래픽 |

- 면접 답변 요약: "Electron은 Chromium과 Node.js를 앱에 함께 담아서 웹 기술로 데스크톱 앱을 만드는 프레임워크입니다. 화면은 React 같은 웹 기술로 만들고, 파일 시스템이나 메뉴·트레이 같은 OS 기능은 Node.js와 Electron API로 씁니다. 웹 앱과 달리 설치형이라 오프라인 동작과 컴퓨터 자원 접근이 가능하고, 모든 사용자가 같은 브라우저 엔진으로 실행합니다. 대신 앱 용량이 크고, XSS가 시스템 접근으로 이어질 수 있어 보안 설정이 중요합니다. VS Code, Slack, Discord가 대표적인 예입니다."

### 관련 질문

- [바닐라 자바스크립트 대신 React를 사용하는 이유](./vanila-react.md)

### 참고

- [Introduction (Electron 문서)](https://www.electronjs.org/docs/latest/)
- [Why Electron (Electron 문서)](https://www.electronjs.org/docs/latest/why-electron)
- [Electron 공식 사이트](https://www.electronjs.org/)
