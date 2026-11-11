# Q : 브라우저 내장 AI(Prompt API)는 무엇이고, 서버의 LLM API와 언제 다르게 쓰나요?

<br />

# A : Prompt API는 웹페이지의 JavaScript가 **사용자 기기 안에 설치된 언어 모델**(Chrome에서는 Gemini Nano)을 `LanguageModel` 객체로 직접 호출하는 브라우저 API입니다. 요청이 서버로 나가지 않으니 API 키·토큰 비용이 없고, 입력한 내용이 기기 밖으로 나가지 않으며, 오프라인에서도 동작합니다. 대신 모델이 작고, 사용자의 기기 사양(저장 공간 22GB 이상, GPU VRAM 4GB 초과 등)과 브라우저에 따라 아예 못 쓸 수 있습니다. 그래서 요약·분류·문장 다듬기처럼 **가볍고, 실패해도 대체할 수 있는 기능**은 내장 AI로, 정확도가 중요하거나 모든 사용자에게 같은 결과를 보장해야 하는 기능은 서버 LLM API로 나눕니다. 웹페이지에서는 Chrome 148부터 정식으로 쓸 수 있고(확장 프로그램은 138부터), 다른 브라우저는 아직 지원하지 않습니다.

### 기본 사용법

```js
// 1. 이 기기·브라우저에서 쓸 수 있는지 먼저 확인 (실제로 쓸 옵션과 같은 옵션을 넘긴다)
const availability = await LanguageModel.availability();
if (availability === 'unavailable') {
  return useServerApi(); // 대체 경로
}

// 2. 세션 만들기 (모델이 없으면 이때 다운로드가 시작된다. 사용자 클릭 같은 동작 후에 호출)
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: '너는 한국어 리뷰를 짧게 요약하는 도우미야.' }],
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`다운로드 ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// 3. 질문하기
const summary = await session.prompt(reviewText);
```

```js
// 스트리밍: 글자가 생기는 대로 받기
const stream = session.promptStreaming('긴 글을 써 줘');
for await (const chunk of stream) {
  output.textContent += chunk;
}

// 중단하기
const controller = new AbortController();
session.prompt(text, { signal: controller.signal });
stopButton.onclick = () => controller.abort();

// 다 쓰면 정리
session.destroy();
```

```js
// 구조화된 출력: JSON 스키마로 응답 모양을 강제
const isSpam = await session.prompt(`이 댓글이 스팸인가요? ${comment}`, {
  responseConstraint: { type: 'boolean' },
});
JSON.parse(isSpam); // true / false
```

- `session.contextUsage` / `session.contextWindow`로 얼마나 썼는지 알 수 있다. 넘치면 `QuotaExceededError`가 난다.
- `session.clone()`으로 대화 맥락을 유지한 채 갈래를 나눌 수 있다.
- 기본으로 최상위 창과 같은 출처 iframe에서만 쓸 수 있다. 다른 출처 iframe은 `allow="language-model"`이 필요하고, Web Worker에서는 쓸 수 없다.

### 서버 LLM API와 비교

| | 브라우저 내장 AI (Prompt API) | 서버 LLM API (Claude, GPT 등) |
|---|---|---|
| 모델 | 기기에 설치된 작은 모델 | 서버의 큰 모델 |
| 비용 | 없음 | 토큰당 과금 |
| 개인정보 | 입력이 기기 밖으로 나가지 않음 | 서버로 전송 |
| 네트워크 | 처음 모델 다운로드 후 오프라인 가능 | 항상 필요 |
| 지연 | 네트워크 왕복 없음 (기기 성능에 좌우) | 네트워크 + 서버 처리 |
| 품질·컨텍스트 | 작은 모델이라 복잡한 작업·긴 입력에 약함 | 강함 |
| 지원 범위 | Chrome 데스크톱(Windows, macOS 13+, Linux, Chromebook Plus)만. Android·iOS·다른 브라우저는 아직 없음 | 어떤 브라우저든 |
| API 키 관리 | 필요 없음 | 서버에서 보관해야 함 (클라이언트에 두면 안 됨) |

### 언제 무엇을 쓰나

| 내장 AI가 맞는 곳 | 서버 API가 맞는 곳 |
|---|---|
| 작성 중인 글 다듬기, 짧은 요약 | 법률·의료처럼 정확도가 중요한 답변 |
| 댓글 분류, 감정 분석, 태그 추천 | 긴 문서 분석, 여러 단계 추론 |
| 입력 내용이 민감해서 서버로 보내기 싫을 때 | 모든 사용자에게 같은 품질을 보장해야 할 때 |
| 사용자 수가 많아 토큰 비용이 부담될 때 | 모바일 사용자가 많을 때 |

- 실무에서는 **점진적 향상**으로 쓴다: `availability()`로 확인 → 쓸 수 있으면 내장 AI, 아니면 서버 API나 기능 숨김.
- 모델 다운로드는 크고(저장 공간 22GB 이상 필요) 처음 한 번 오래 걸린다. 다운로드 진행률을 보여 주고, 사용자가 원할 때만 시작한다.

### 그 밖의 내장 AI API

| API | 하는 일 | 상태 (Chrome 문서 기준) |
|---|---|---|
| Translator | 번역 | Chrome 138부터 정식 |
| Language Detector | 언어 감지 | Chrome 138부터 정식 |
| Summarizer | 요약 | Chrome 138부터 정식 |
| Writer · Rewriter · Proofreader | 글쓰기 · 다시 쓰기 · 교정 | 개발자 체험 단계 |

- 목적이 정해진 작업은 Prompt API보다 이런 전용 API가 더 간단하다.

### 주의할 점

- **아직 Chrome만의 기능이다.** 다른 브라우저가 같은 API를 지원할지 정해지지 않았다. 다른 브라우저 지원을 기대하고 핵심 기능을 만들면 안 된다.
- 기기마다 결과와 속도가 다를 수 있다. 출력은 항상 검증하고(특히 JSON), 실패할 때를 대비한다.
- 모델 출력을 `innerHTML`로 넣지 않는다. 사용자 입력과 마찬가지로 텍스트로 넣는다.

- 면접 답변 요약: "Prompt API는 웹페이지에서 사용자 기기에 설치된 작은 언어 모델을 직접 부르는 Chrome의 API입니다. 서버로 데이터가 나가지 않아 개인정보에 유리하고, API 키와 토큰 비용이 없으며, 오프라인에서도 동작합니다. 대신 모델이 작고 Chrome 데스크톱의 일정 사양 이상에서만 동작해서, 글 다듬기나 분류처럼 가볍고 실패해도 대체할 수 있는 기능에 점진적 향상으로 쓰고, 정확도가 중요한 기능은 서버 LLM API를 씁니다."

### 관련 질문

- [AI Agent란 무엇이고, 하네스(Harness)는 무엇인가요?](./ai-agent.md)

### 참고

- [The Prompt API (Chrome for Developers)](https://developer.chrome.com/docs/ai/prompt-api)
- [Built-in AI APIs (Chrome for Developers)](https://developer.chrome.com/docs/ai/built-in-apis)
