# Q : Electron 앱의 성능은 어떻게 최적화하나요?

<br />

# A : 공식 문서가 가장 먼저 강조하는 것은 **"측정하고, 가장 무거운 곳을 찾아 고친다"**입니다. 그다음 Electron에서 특히 중요한 것은 **메인 프로세스를 막지 않는 것**입니다. 메인 프로세스는 모든 창과 UI 스레드를 관리하기 때문에, 여기서 동기 파일 작업이나 무거운 계산을 하면 **앱 전체가 멈춥니다.** 그래서 무거운 작업은 비동기 API, Worker, `utilityProcess` 같은 별도 프로세스로 빼고, 동기 IPC는 쓰지 않습니다. 시작 속도를 위해서는 **필요한 모듈만, 필요한 순간에** 불러오고(무거운 `require`는 함수 안으로), 코드를 **번들**하고, 기본 메뉴가 필요 없으면 `Menu.setApplicationMenu(null)`을 호출합니다. 렌더러는 일반 웹 성능 최적화(긴 작업 쪼개기, Web Worker, 가상화)를 그대로 적용하고, 최신 Chromium이 들어 있으니 **불필요한 폴리필**과 매번 받아오는 **네트워크 리소스**(폰트 등)는 앱에 담아 없앱니다.

### 공식 문서의 체크리스트

| # | 항목 | 핵심 |
|---|---|---|
| 0 | 측정 | 추측하지 말고 프로파일링으로 가장 무거운 곳부터 |
| 1 | 모듈을 신중히 추가 | 패키지 크기·`require` 비용·실행 비용 확인 |
| 2 | 코드를 너무 일찍 실행하지 않기 | 시작할 때 다 불러오지 말고 필요할 때 |
| 3 | **메인 프로세스를 막지 않기** | 동기 API·무거운 계산·동기 IPC 금지 |
| 4 | 렌더러를 막지 않기 | `requestIdleCallback`, Web Worker |
| 5 | 불필요한 폴리필 빼기 | Electron의 Chromium은 최신이다 |
| 6 | 불필요한 네트워크 요청 줄이기 | 자주 안 바뀌는 리소스는 앱에 포함 |
| 7 | 코드 번들하기 | 파일 하나로 묶어 `require` 비용 줄이기 |
| 8 | 기본 메뉴가 필요 없으면 `Menu.setApplicationMenu(null)` | `app.on('ready')` 전에 호출 |

### 1~2. 시작 속도: 모듈 비용과 지연 로딩

```bash
# 모듈을 불러오는 데 드는 비용 측정
node --cpu-prof --heap-prof -e "require('request')"
```

- 공식 문서 예시에서 `request` 패키지는 불러오는 데만 거의 0.5초, 비슷한 일을 하는 `node-fetch`는 50ms 미만이었다. **같은 기능이면 가벼운 패키지**를 고른다.
- 모듈을 불러오는 것 자체가 비싸다(특히 Windows). 시작할 때 다 `require`하지 말고, 쓰는 함수 안에서 불러온다.

```js
// 나쁨: 앱 시작과 동시에 무거운 파서를 불러온다
const parser = require('foo-parser');

// 좋음: 실제로 파일을 파싱할 때 불러온다
function getParsedFiles() {
  const parser = require('foo-parser');
  return parser.parse(files);
}
```

### 3. 메인 프로세스를 막지 않기 (가장 중요)

```js
// 나쁨: 동기 파일 읽기 → 읽는 동안 모든 창이 멈춘다
ipcMain.handle('read-big-file', () => fs.readFileSync(bigPath, 'utf8'));

// 좋음: 비동기 API
ipcMain.handle('read-big-file', () => fs.promises.readFile(bigPath, 'utf8'));
```

- `fs`, `child_process`는 동기 버전 대신 비동기 버전을 쓴다.
- CPU를 오래 쓰는 계산(압축, 이미지 처리, 대용량 파싱)은 Worker 스레드나 `utilityProcess`로 뺀다.
- **동기 IPC(`ipcRenderer.sendSync`)와 `@electron/remote`는 쓰지 않는다.** 렌더러와 메인이 서로를 기다리며 멈춘다. `invoke`/`handle`을 쓴다.

### 4. 렌더러 (일반 웹 최적화 그대로)

- 긴 작업은 쪼개거나 `requestIdleCallback`으로 한가할 때, 무거운 계산은 Web Worker로.
- 긴 목록은 가상화, 불필요한 리렌더는 React Profiler로 찾아 줄인다.
- 창마다 렌더러 프로세스가 생기므로 **창을 미리 많이 만들어 두지 않는다.** 숨긴 창도 메모리를 쓴다.

### 5~8. 그 밖에

- **폴리필**: Electron의 Chromium 버전(`process.versions.chrome`)을 확인하고, 그 버전이 지원하는 기능은 폴리필·트랜스파일 대상을 빼서 번들을 줄인다.
- **네트워크**: Google Fonts처럼 거의 안 바뀌는 리소스는 앱에 포함한다. 데스크톱 앱은 오프라인이나 느린 네트워크에서도 켜져야 한다.
- **번들**: Vite·webpack 등으로 메인·preload·렌더러 코드를 묶는다. sandbox preload는 어차피 여러 파일로 나눌 수 없어서 번들이 필요하다.
- **메뉴**: 직접 메뉴를 만들거나 프레임 없는 창이라 기본 메뉴가 필요 없으면 `Menu.setApplicationMenu(null)`로 시작 시간을 줄인다.

### 측정 도구

| 대상 | 도구 |
|---|---|
| 렌더러 | Chrome DevTools (Performance, Memory, Network 탭 — Fast 3G로 느린 환경 확인) |
| 메인 프로세스 | `--inspect`로 실행해 Chrome DevTools로 프로파일링 |
| 모듈 로딩 | `node --cpu-prof --heap-prof` |
| 시작 시간 | 앱 시작부터 첫 화면까지 시간을 직접 기록해 릴리스마다 비교 |

- 면접 답변 요약: "먼저 프로파일링으로 가장 무거운 곳을 찾습니다. Electron에서 가장 중요한 건 메인 프로세스를 막지 않는 것인데, 메인이 모든 창과 UI 스레드를 관리하기 때문에 동기 파일 작업이나 무거운 계산을 하면 앱 전체가 멈춥니다. 그래서 비동기 API를 쓰고, 무거운 계산은 Worker나 utilityProcess로 빼고, 동기 IPC는 쓰지 않습니다. 시작 속도는 가벼운 모듈을 고르고 필요할 때 불러오고, 코드를 번들하고, 필요 없으면 기본 메뉴를 끄는 식으로 줄입니다. 렌더러는 일반 웹 최적화를 적용하고, 최신 Chromium이니 불필요한 폴리필과 네트워크 리소스를 뺍니다."

### 관련 질문

- [Electron의 메인 프로세스와 렌더러 프로세스는 각각 무슨 역할인가요?](./electron-process-model.md)
- [Electron의 단점은 무엇이고, Tauri와는 어떻게 다른가요?](./electron-vs-tauri.md)
- [Lighthouse, Web Vitals, Performance Timing API, Sentry, React Profiler는 성능 최적화에서 각각 무엇을 확인할 때 보나요?](../web-questions/performance-tools.md)

### 참고

- [Performance (Electron 문서)](https://www.electronjs.org/docs/latest/tutorial/performance)
- [utilityProcess (Electron 문서)](https://www.electronjs.org/docs/latest/api/utility-process)
