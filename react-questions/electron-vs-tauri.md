# Q : Electron의 단점은 무엇이고, Tauri와는 어떻게 다른가요?

<br />

# A : Electron의 가장 큰 단점은 **크기와 자원 사용량**입니다. 앱마다 Chromium과 Node.js를 통째로 담기 때문에 압축해도 80~100MB, 설치하면 대부분 100MB가 넘고, 창마다 렌더러 프로세스가 생겨 메모리도 많이 씁니다. 또 웹 페이지가 OS 권한 가까이에서 실행되므로 보안 설정을 잘못하면 위험이 크고, 8주마다 나오는 새 버전을 따라가야 합니다. **Tauri**는 이 문제를 다르게 풉니다. 브라우저 엔진을 담지 않고 **OS에 이미 있는 웹뷰**를 쓰고, 백엔드는 Node.js 대신 **Rust**로 작성해 컴파일하기 때문에 최소 앱이 600KB 미만일 만큼 작습니다. 대신 OS마다 웹뷰 엔진이 달라 **화면이 OS별로 다르게 보일 수 있고**, 백엔드 로직에 Rust를 다뤄야 합니다. 그래서 웹 개발자가 빠르게 만들고 모든 OS에서 똑같이 보여야 하면 Electron, 용량·메모리가 중요하고 Rust를 쓸 수 있으면 Tauri를 고릅니다.

### Electron의 단점

| 단점 | 이유 |
|---|---|
| 큰 용량 | 앱마다 Chromium + Node.js 포함. 공식 문서도 압축 시 80~100MB, 대부분 100MB 이상이라고 설명 |
| 높은 메모리 사용 | 메인 + 창마다 렌더러 + Chromium 보조 프로세스. 여러 Electron 앱을 켜면 브라우저 여러 개를 띄운 셈 |
| 보안 부담 | XSS가 시스템 접근으로 이어질 수 있어 contextIsolation·sandbox·IPC 검증 등을 계속 챙겨야 함 |
| 업데이트 부담 | 8주마다 메이저, 최근 3개 메이저만 지원. Chromium 보안 패치를 받으려면 따라가야 함 |
| 네이티브 느낌 | 웹 UI라 OS 고유 컨트롤·동작과 미묘하게 다를 수 있음 |

- 공식 문서도 "Electron이 맞지 않는 경우"로 자원이 적은 기기·IoT, 작은 설치 용량이 필요한 앱, OS 네이티브 UI가 중요한 앱, 게임·실시간 그래픽을 든다.
- 그래도 VS Code, Slack, Figma, Notion, Discord처럼 큰 서비스가 Electron을 쓰는 이유는 **웹 팀 하나로 세 OS를 같은 화면으로 지원**하는 이점이 크기 때문이다.

### Tauri는 무엇이 다른가

```
Electron 앱                         Tauri 앱
├─ Chromium (앱에 포함)              ├─ OS의 웹뷰 사용 (포함하지 않음)
├─ Node.js (앱에 포함)               ├─ Rust로 컴파일된 백엔드 (런타임 없음)
└─ 화면: HTML/CSS/JS                └─ 화면: HTML/CSS/JS (React 등 그대로)
```

| | Electron | Tauri |
|---|---|---|
| 화면 엔진 | 앱에 담은 Chromium | OS 웹뷰 (Windows·macOS·Linux마다 다름) |
| 백엔드 언어 | JavaScript (Node.js) | Rust (필요하면 Swift·Kotlin) |
| 앱 크기 | 약 100MB 이상 | 최소 600KB 미만 가능 |
| 화면 일관성 | 모든 OS에서 같은 엔진 → 같게 보임 | OS별 웹뷰 차이 → 테스트 필요 |
| 프론트엔드 | 아무 웹 프레임워크 | 아무 웹 프레임워크 |
| 모바일 | 데스크톱만 | 데스크톱 + iOS·Android (v2) |
| 권한 모델 | preload + IPC를 직접 설계 | 명령별 권한(capabilities·permissions)을 설정으로 |
| 생태계·사례 | 오래됨, 대형 앱 다수, 자료 많음 | 상대적으로 새로움, 빠르게 성장 |
| 러닝 커브 (웹 개발자) | 낮음 (전부 JS) | 백엔드 로직에 Rust 필요 |

### 언제 무엇을 고르나

| 상황 | 선택 |
|---|---|
| 웹 서비스를 데스크톱으로도, 모든 OS에서 화면이 똑같아야 함 | Electron |
| 팀이 JS/TS만 다루고 빠르게 만들어야 함 | Electron |
| Node.js 생태계(npm 패키지)를 백엔드에서 많이 씀 | Electron |
| 설치 용량·메모리가 중요한 가벼운 도구 | Tauri |
| 데스크톱과 모바일을 같은 코드로 | Tauri |
| Rust를 쓸 수 있거나 성능·보안이 중요한 로직이 있음 | Tauri |

### Electron을 쓰면서 단점을 줄이는 법

- 필요 없는 모듈을 넣지 않고, 코드를 번들하고, 창을 미리 많이 만들지 않는다 .
- 무거운 작업은 메인 프로세스 대신 `utilityProcess`나 Worker로.
- 보안 기본값(contextIsolation, sandbox)을 유지하고 Electron 버전을 꾸준히 올린다.

- 면접 답변 요약: "Electron은 앱마다 Chromium과 Node.js를 담아서 대부분 100MB가 넘고 메모리도 많이 쓰며, XSS가 시스템 접근으로 이어질 수 있어 보안 설정 부담이 있습니다. Tauri는 OS에 있는 웹뷰를 쓰고 백엔드를 Rust로 컴파일해서 최소 앱이 600KB 미만일 만큼 가볍고 모바일도 지원합니다. 대신 OS마다 웹뷰가 달라 화면 차이를 테스트해야 하고 Rust가 필요합니다. 그래서 모든 OS에서 똑같은 화면과 JS 생태계가 중요하면 Electron, 용량과 메모리가 중요하면 Tauri를 고릅니다."

### 관련 질문

- [Electron이란 무엇이고, 웹 앱과 무엇이 다른가요?](./electron-intro.md)

### 참고

- [Why Electron (Electron 문서)](https://www.electronjs.org/docs/latest/why-electron)
- [Electron Releases (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/electron-timelines)
- [What is Tauri? (Tauri 문서)](https://v2.tauri.app/start/)
- [Tauri Architecture (Tauri 문서)](https://v2.tauri.app/concept/architecture/)
