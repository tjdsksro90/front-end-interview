# Q : WebSocket이란 무엇이고, HTTP와 어떻게 다른가요?

<br />

# A : WebSocket은 브라우저와 서버 사이에 **연결을 한 번 맺어 두고, 양쪽이 언제든 서로에게 메시지를 보낼 수 있는 양방향 통신** 방식입니다. HTTP는 클라이언트가 요청해야 서버가 응답하는 구조라서, 서버가 먼저 알려야 하는 채팅·알림·실시간 협업·주식 시세 같은 기능에는 계속 물어보는 폴링(polling)이 필요했습니다. WebSocket은 처음에 HTTP 요청으로 "프로토콜을 바꾸자(Upgrade)"고 합의(핸드셰이크, 응답 `101 Switching Protocols`)한 뒤, 같은 연결을 유지하면서 작은 프레임 단위로 텍스트나 바이너리를 주고받습니다. 매 요청마다 헤더를 보내는 HTTP보다 오버헤드가 적고 지연이 짧습니다. 대신 연결을 계속 유지해야 하므로 **끊겼을 때의 재연결, 서버의 연결 관리와 확장(scale-out)**을 직접 신경 써야 합니다.

### HTTP와 비교

```
HTTP (폴링)                          WebSocket
클라이언트 → 새 메시지 있어?          클라이언트 ⇄ 서버 (연결 한 번)
서버       → 없음                    서버 → 새 메시지 (바로)
클라이언트 → 새 메시지 있어?          클라이언트 → 메시지 보내기
서버       → 1개 있음                서버 → 다른 사용자 메시지 (바로)
```

| | HTTP | WebSocket |
|---|---|---|
| 방향 | 요청 → 응답 (클라이언트가 시작) | **양방향** (누구든 먼저 보냄) |
| 연결 | 요청마다 (keep-alive로 재사용해도 요청-응답 단위) | 한 번 맺고 계속 유지 |
| 메시지당 오버헤드 | 매번 헤더 | 작은 프레임 헤더 |
| 주소 | `http://`, `https://` | `ws://`, `wss://` (TLS) |
| 캐시·프록시 | HTTP 인프라 그대로 | 연결 유지 때문에 로드밸런서·프록시 설정 필요 |
| 재연결 | 필요 없음 | **직접 구현** |

### 연결 과정 (핸드셰이크)

```http
GET /chat HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com
```

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

- 반드시 HTTP/1.1 이상의 **GET** 요청으로 시작한다. 서버는 받은 키에 정해진 문자열을 붙여 SHA-1 → base64 한 값을 `Sec-WebSocket-Accept`로 돌려준다.
- 이후에는 HTTP가 아니라 WebSocket **프레임**(텍스트·바이너리·ping·pong·close)으로 주고받는다. 서버는 ping/pong으로 연결이 살아 있는지 확인한다.
- 브라우저는 항상 `Origin` 헤더를 보낸다. 서버는 허용한 출처인지 확인해야 한다(다른 사이트가 사용자 쿠키로 연결을 여는 것 방지).

### 브라우저 코드

```js
const ws = new WebSocket('wss://example.com/chat');

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ type: 'join', room: 'general' }));
});

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data); // 텍스트는 string, 바이너리는 Blob/ArrayBuffer
  render(msg);
});

ws.addEventListener('close', (event) => {
  console.log('연결 종료', event.code, event.reason); // 1000 정상 종료, 1006 비정상 종료 등
});

ws.addEventListener('error', () => {
  // 에러가 나면 연결이 닫히고 close 이벤트가 이어서 온다
});

ws.close(1000, '사용자가 나감'); // 직접 닫을 때 코드는 1000 또는 3000~4999
```

- `send()`는 비동기다. 아직 보내지 못하고 쌓인 바이트 수는 `bufferedAmount`로 확인한다.
- HTTPS 페이지에서는 반드시 `wss://`를 쓴다(혼합 콘텐츠 금지).
- 브라우저의 `WebSocket` API는 **요청 헤더를 직접 설정할 수 없다.** 인증은 보통 쿠키, 연결 직후 첫 메시지로 토큰 보내기, 짧은 수명의 일회용 토큰을 URL에 넣는 방식 중에서 고른다.

### 실무에서 꼭 챙길 것

**1. 재연결**

```js
function connect(retry = 0) {
  const ws = new WebSocket(URL);
  ws.addEventListener('open', () => { retry = 0; });
  ws.addEventListener('close', (e) => {
    if (e.code === 1000) return; // 정상 종료면 다시 연결하지 않음
    const delay = Math.min(1000 * 2 ** retry, 30000); // 1초, 2초, 4초 … 최대 30초
    setTimeout(() => connect(retry + 1), delay + Math.random() * 500);
  });
  return ws;
}
```

- 서버 SSE용 `EventSource`는 끊기면 자동으로 다시 연결하지만, `WebSocket` API에는 그런 기능이 없다.
- 서버가 재시작되면 모든 클라이언트가 동시에 재연결하므로 **지수 백오프 + 무작위 지연(jitter)**으로 몰림을 피한다.
- 다시 연결된 뒤에는 끊긴 동안 놓친 메시지를 받아 오는 처리(마지막 메시지 ID 등)가 필요하다.
- 페이지가 bfcache에 들어갈 때(`pagehide`) 연결을 닫고, 돌아올 때(`pageshow`의 `persisted`) 다시 연다.

**2. React에서**

```jsx
useEffect(() => {
  const ws = new WebSocket(URL);
  ws.addEventListener('message', (e) => setMessages((prev) => [...prev, JSON.parse(e.data)]));
  return () => ws.close(); // 언마운트 때 꼭 닫기 (안 닫으면 연결이 쌓인다)
}, [URL]);
```

- 여러 컴포넌트가 같은 연결을 쓰면 Context나 상태 관리 라이브러리에 연결을 하나만 두고 구독하게 한다.
- 메시지가 아주 잦으면 모아서 한 번에 상태를 갱신한다(렌더 횟수 줄이기).

**3. 서버 확장**

- 연결이 특정 서버 인스턴스에 붙어 있어서, 서버가 여러 대면 다른 서버에 붙은 사용자에게 보내기 위해 **Redis Pub/Sub 같은 메시지 브로커**가 필요하다.
- 로드밸런서·프록시가 Upgrade 헤더를 통과시키고, 유휴 연결을 끊지 않도록 타임아웃을 설정한다.

### 다른 선택지와 비교

| 방식 | 방향 | 언제 |
|---|---|---|
| 폴링 / 롱 폴링 | 클라이언트 → 서버 | 업데이트가 드물고 단순하게 할 때 |
| **SSE (EventSource)** | 서버 → 클라이언트만 | 알림, LLM 응답 스트리밍처럼 서버가 보내기만 할 때. 자동 재연결 |
| **WebSocket** | 양방향 | 채팅, 협업 편집, 게임, 실시간 대시보드 |
| WebTransport | 양방향, 여러 스트림·비신뢰 데이터그램 | 흐름 제어(backpressure)나 순서가 상관없는 대량 데이터가 중요할 때 |

- 면접 답변 요약: "WebSocket은 HTTP 요청으로 Upgrade 핸드셰이크를 한 뒤 연결을 유지하면서 클라이언트와 서버가 언제든 서로 메시지를 보낼 수 있는 양방향 통신입니다. HTTP는 클라이언트가 요청해야 응답하므로 실시간 기능에 폴링이 필요하지만, WebSocket은 서버가 바로 보낼 수 있고 메시지당 오버헤드도 작아 채팅, 협업, 실시간 대시보드에 씁니다. 대신 자동 재연결이 없어 지수 백오프로 직접 구현하고, React에서는 언마운트 때 연결을 닫으며, 서버가 여러 대면 Redis Pub/Sub 같은 브로커가 필요합니다. 서버에서 보내기만 하면 SSE가 더 간단합니다."

### 관련 질문

- [프론트엔드에서 LLM 응답을 스트리밍으로 보여 주려면 어떻게 하나요?](../ai-questions/llm-streaming.md)
- [GraphQL이란 무엇이고, REST API와 어떻게 다른가요?](./graphql.md)

### 참고

- [The WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Writing WebSocket client applications (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
- [Writing WebSocket servers (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers)
- [WebSocket: close() method (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/close)
- [Using server-sent events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
