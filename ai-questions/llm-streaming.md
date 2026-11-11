# Q : 프론트엔드에서 LLM 응답을 스트리밍으로 보여 주려면 어떻게 하나요?

<br />

# A : LLM은 답을 한 번에 만들지 않고 토큰 단위로 조금씩 생성하기 때문에, 다 끝날 때까지 기다리면 사용자는 수 초 동안 빈 화면을 봅니다. 그래서 서버가 만들어지는 대로 조각(chunk)을 보내고, 프론트엔드는 `fetch`의 `response.body`(ReadableStream)를 읽으면서 **받은 조각을 화면에 이어 붙입니다.** 서버는 보통 SSE(Server-Sent Events) 형식(`data: ...` 줄 + 빈 줄)으로 보내는데, LLM 요청은 POST와 인증 헤더가 필요해서 `EventSource` 대신 `fetch`로 받아 직접 파싱하는 경우가 많습니다. 여기에 `AbortController`로 중단 버튼을 만들고, API 키는 브라우저에 두지 않고 우리 서버를 거쳐 호출하는 것이 기본 구성입니다.

### 전체 구조

```
브라우저 ──POST /api/chat──▶ 우리 서버 ──API 키로 호출──▶ LLM API
        ◀── 조각 스트림 ───            ◀── 조각 스트림 ───
```

- **API 키는 서버에만** 둔다. 브라우저 번들에 들어간 키(`VITE_`, `NEXT_PUBLIC_` 변수 포함)는 누구나 볼 수 있다.
- 우리 서버는 LLM의 스트림을 그대로 브라우저로 흘려보낸다(필요하면 로그인 확인, 사용량 제한, 내용 필터링).

### SSE 형식

```
data: {"text":"안녕"}

data: {"text":"하세요"}

event: done
data: {}

```

- 메시지는 **빈 줄(줄바꿈 두 번)**로 구분한다. `data:` 줄이 여러 개면 줄바꿈으로 합쳐진다.
- `event:`로 이벤트 이름을, `id:`로 마지막 이벤트 ID를 줄 수 있다. `:`로 시작하는 줄은 주석(연결 유지용 ping)이다.
- 서버는 `Content-Type: text/event-stream`으로 응답한다.

### 방법 1: fetch + ReadableStream (가장 많이 씀)

```js
async function streamChat(messages, { onText, signal }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }); // 한글이 조각 경계에서 잘려도 안전하게

    // 빈 줄로 끝난 "완성된 메시지"만 처리하고, 나머지는 다음 조각과 합친다
    const events = buffer.split('\n\n');
    buffer = events.pop();
    for (const event of events) {
      const data = event
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (data) onText(JSON.parse(data).text ?? '');
    }
  }
}
```

- 네트워크 조각 경계는 **메시지 경계와 다르다.** 한 조각에 메시지가 반 개만 올 수도, 세 개가 올 수도 있어서 버퍼에 모았다가 빈 줄 기준으로 자른다.
- `TextDecoder`의 `stream: true`: 한글처럼 여러 바이트인 글자가 조각 사이에서 잘렸을 때 다음 조각과 합쳐서 해석한다.
- `response.body`는 비동기 이터러블이라 `for await (const chunk of res.body)`로도 읽을 수 있다.

### 방법 2: EventSource

```js
const es = new EventSource('/api/notifications');
es.onmessage = (e) => append(JSON.parse(e.data).text);
es.addEventListener('done', () => es.close());
```

- 연결이 끊기면 자동으로 다시 연결하고 파싱도 해 줘서 간단하다.
- 하지만 생성자가 URL과 `withCredentials`만 받는다. 요청 본문(대화 내용)이나 `Authorization` 헤더를 보낼 수 없어서 **LLM 채팅보다는 알림처럼 서버가 일방적으로 보내는 곳**에 맞다.
- 서버 → 클라이언트 한 방향뿐이다. HTTP/1에서는 브라우저·도메인당 연결이 6개로 제한되므로 HTTP/2 환경에서 쓴다.

### React에서 화면 갱신

```jsx
function Chat() {
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // idle | streaming | done | error
  const controllerRef = useRef(null);

  async function ask(messages) {
    controllerRef.current?.abort();               // 이전 요청이 있으면 끊는다
    const controller = new AbortController();
    controllerRef.current = controller;
    setAnswer('');
    setStatus('streaming');
    try {
      await streamChat(messages, {
        signal: controller.signal,
        onText: (t) => setAnswer((prev) => prev + t), // 이전 값 기준으로 이어 붙이기
      });
      setStatus('done');
    } catch (e) {
      setStatus(e.name === 'AbortError' ? 'done' : 'error'); // 중단은 에러가 아님
    }
  }

  return (
    <>
      <div aria-live="polite">{answer}</div>
      {status === 'streaming' && <button onClick={() => controllerRef.current.abort()}>중단</button>}
    </>
  );
}
```

- **이어 붙이기는 함수형 업데이트**(`prev => prev + t`)로 한다. 조각이 빠르게 들어오면 바깥의 `answer` 값은 이미 지난 값이다.
- **중단 버튼**: `AbortController`를 `fetch`에 넘기면 `abort()` 시 요청과 스트림 읽기가 함께 멈춘다. 새 질문을 보낼 때도 이전 요청을 끊어야 응답이 섞이지 않는다.
- **너무 잦은 렌더**: 조각마다 렌더하면 긴 답변에서 느려질 수 있다. 조각을 모아 두었다가 `requestAnimationFrame` 한 번에 반영하면 프레임당 한 번만 그린다.

### UX 체크리스트

| 항목 | 방법 |
|---|---|
| 첫 글자가 오기 전 | "생각 중…" 같은 로딩 표시 |
| 자동 스크롤 | 사용자가 위로 올려 읽는 중이면 따라 내려가지 않기 |
| 마크다운 | 미완성 코드 블록·표가 깨져 보일 수 있으니 렌더러가 부분 입력을 견디는지 확인. HTML로 바꿀 때 sanitize |
| 중단·재시도 | 중단 버튼, 실패 시 받은 데까지 보여 주고 다시 시도 |
| 접근성 | `aria-live="polite"`로 스크린 리더에 새 내용 알리기 (너무 잦으면 완료 후 한 번에) |
| 보안 | 모델 출력은 사용자 입력처럼 취급. `innerHTML`에 그대로 넣지 않기 |

- 면접 답변 요약: "LLM은 토큰을 조금씩 생성하므로 서버가 조각을 SSE 형식으로 흘려보내고, 프론트에서는 fetch의 response.body를 getReader로 읽으며 TextDecoder로 디코딩해 빈 줄 기준으로 메시지를 나눠 화면에 이어 붙입니다. EventSource는 POST 본문과 인증 헤더를 못 보내서 채팅에는 fetch를 씁니다. AbortController로 중단과 이전 요청 취소를 처리하고, React에서는 함수형 업데이트로 이어 붙이며, API 키는 서버에만 두고 출력은 sanitize해서 렌더합니다."

### 관련 질문

- [브라우저 내장 AI(Prompt API)는 무엇이고, 서버의 LLM API와 언제 다르게 쓰나요?](./browser-built-in-ai.md)
- [빠르게 검색 조건을 바꿨을 때 이전 응답이 덮어쓰면 어떻게 하나요?](../web-questions/search-race-condition.md)

### 참고

- [Using readable streams (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams)
- [Using server-sent events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Env Variables and Modes (Vite)](https://vite.dev/guide/env-and-mode)
