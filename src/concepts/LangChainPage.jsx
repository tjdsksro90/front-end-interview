import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function LangChainPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          LangChain은 <u>OpenAI·Anthropic·Google 같은 여러 LLM을 같은 코드로 쓰게 해주고, <Code>createAgent</Code>로 에이전트를 몇 줄 만에 만들게 해주는 프레임워크</u>입니다.
          공식 문서는 v1의 <Code>createAgent</Code>를 "설정 가능한 에이전트 하네스"라고 소개합니다. 내부적으로는 LangGraph 위에서 동작해요.
        </OneLiner>

        <H3>핵심 구성 (v1 기준)</H3>
        <Table
          head={['구성', '하는 일']}
          rows={[
            ['표준 모델 인터페이스', <><Code>"anthropic:claude-sonnet-5-5"</Code>, <Code>"openai:gpt-5.5"</Code>처럼 문자열만 바꿔 제공자 교체. 메시지·도구 호출 형식이 통일됨</>],
            [<Code>createAgent</Code>, '모델 + 도구 + 프롬프트로 에이전트 루프(모델 호출 → 도구 실행 → 반복)를 만들어줌'],
            [<Code>tool()</Code>, '함수 + 이름·설명 + Zod 입력 스키마 = 모델이 호출할 수 있는 도구'],
            ['Middleware', <>하네스를 조립하는 확장 지점: 사람 승인(<Code>humanInTheLoopMiddleware</Code>), 재시도(<Code>modelRetryMiddleware</Code>, <Code>toolRetryMiddleware</Code>), 개인정보 가리기(<Code>piiMiddleware</Code>), 요약 등</>],
            ['Structured output', <><Code>responseFormat</Code>에 Zod 스키마를 주면 검증된 객체를 <Code>structuredResponse</Code>로 받음</>],
            ['메모리', <><Code>checkpointer</Code> + <Code>thread_id</Code>로 여러 턴 대화 유지 (LangGraph 기능)</>],
            ['LangSmith', '실행 추적(trace), 디버깅, 평가 — LangChain 없이 만든 에이전트에도 사용 가능'],
          ]}
        />

        <H3>LangChain 생태계에서 무엇을 고르나 (공식 문서 기준)</H3>
        <Table
          head={['도구', '언제']}
          rows={[
            [<b>LangChain (createAgent)</b>, '내 데이터·용도에 맞게 커스터마이즈하는 에이전트를 빠르게'],
            [<b>LangGraph</b>, '정해진 단계와 LLM 판단이 섞인 흐름, 중단·재개, 사람 승인 등 세밀한 제어가 필요할 때 (저수준)'],
            [<b>Deep Agents</b>, '컨텍스트 압축, 가상 파일 시스템, 하위 에이전트까지 갖춘 완성형 하네스가 필요할 때'],
            [<b>LangSmith</b>, '무엇으로 만들었든 추적·평가할 때'],
          ]}
        />
        <Callout type="tip" title="면접 포인트: LangChain vs LangGraph">
          <p>"LangChain은 모델·도구·에이전트를 쉽게 만드는 고수준 도구, LangGraph는 에이전트의 흐름을 그래프(상태·노드·엣지)로 직접 제어하는 저수준 런타임이다. LangChain의 createAgent가 LangGraph 위에서 만들어져 있다."</p>
          <p>Anthropic의 조언처럼 프레임워크는 내부에서 무슨 프롬프트·호출이 오가는지 가릴 수 있으니, 쓰더라도 아래에서 무슨 일이 일어나는지 이해하고 쓰는 게 중요합니다. (<Link className="text-indigo-600 dark:text-indigo-400" to="/ai/ai-agent/deep/ai-agent">AI Agent 심화</Link>의 직접 만든 루프와 비교해 보세요)</p>
        </Callout>

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>여러 LLM 제공자를 바꿔가며 쓰거나 비교</b>해야 할 때</>,
            '도구를 쓰는 표준적인 에이전트를 빠르게 만들고, 승인·재시도·요약 같은 기능을 middleware로 붙이고 싶을 때',
            'RAG(문서 검색 + 답변): 문서 로더, 임베딩, 벡터 DB 연동이 많이 준비돼 있다',
            'LangSmith로 추적·평가까지 한 흐름으로 가져가고 싶을 때',
          ]}
          avoid={[
            'LLM API를 한두 번 호출하는 단순 기능 — 공식 SDK로 직접 호출이 더 간단하고 투명하다',
            '흐름을 단계별로 세밀하게 통제해야 하는 경우 — LangGraph를 직접 쓰는 편이 맞다',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: '공식 문서', path: ['docs.langchain.com', 'LangChain (JavaScript)', 'Agents'], what: 'createAgent, tools, middleware, structured output 예제. Python과 JS 문서가 따로 있다.' },
            { where: '실행 추적 켜기', path: ['.env', 'LANGSMITH_TRACING=true', 'LANGSMITH_API_KEY=…'], what: '환경 변수만 넣으면 실행마다 LangSmith에 trace가 쌓인다.' },
            { where: '추적 보기', path: ['smith.langchain.com', 'Projects', '실행 클릭'], what: '모델 호출과 도구 호출이 트리로 보이고, 각 단계의 입력·출력·토큰·시간을 확인할 수 있다.' },
          ]}
        />
        <Screen title="LangSmith — Trace">
          <div className="grid min-w-[560px] grid-cols-[240px_1fr]">
            <div className="space-y-1 border-r border-zinc-200 p-3 font-mono dark:border-zinc-700">
              {[['agent', '3.2s', 0, true], ['model', '1.1s', 1], ['tools › get_weather', '0.2s', 1], ['model', '1.4s', 1], ['middleware › pii', '0.01s', 1]].map(([n, t, d, sel], i) => (
                <div key={i} className={`flex justify-between rounded px-2 py-1 ${sel ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`} style={{ marginLeft: d * 12 }}>
                  <span>{n}</span><span className="text-zinc-400">{t}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 p-3 font-mono">
              <div><span className="text-zinc-400">Input</span><div className="mt-1 rounded bg-zinc-50 p-2 dark:bg-zinc-800">user: 서울 날씨 어때?</div></div>
              <div><span className="text-zinc-400">Tool call</span><div className="mt-1 rounded bg-zinc-50 p-2 dark:bg-zinc-800">{'get_weather({ "city": "서울" })'}</div></div>
              <div><span className="text-zinc-400">Output</span><div className="mt-1 rounded bg-zinc-50 p-2 dark:bg-zinc-800">서울은 맑고 18도예요.</div></div>
              <div className="text-zinc-400">Tokens 1,284 · Latency 3.2s</div>
            </div>
          </div>
        </Screen>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="설치"
          code={`
npm install langchain zod @langchain/anthropic   # 또는 @langchain/openai`}
        />
        <CodeBlock
          title="도구 + 에이전트 (공식 문서 예제 기반)"
          code={`
import { createAgent, tool } from 'langchain';
import * as z from 'zod';

const getWeather = tool(
  ({ city }) => \`\${city}는 맑고 18도예요.\`,
  {
    name: 'get_weather',
    description: '도시의 현재 날씨를 조회한다',          // 모델이 언제 쓸지 판단하는 근거
    schema: z.object({ city: z.string().describe('도시 이름') }),
  }
);

const agent = createAgent({
  model: 'anthropic:claude-sonnet-5-5',
  tools: [getWeather],
});

const result = await agent.invoke({
  messages: [{ role: 'user', content: '서울 날씨 어때?' }],
});
console.log(result.messages.at(-1).content);`}
        />
        <CodeBlock
          title="Middleware로 하네스 조립"
          code={`
import { createAgent, humanInTheLoopMiddleware, modelRetryMiddleware, piiMiddleware } from 'langchain';

const agent = createAgent({
  model: 'anthropic:claude-sonnet-5-5',
  tools: [readFile, writeFile],
  middleware: [
    piiMiddleware('email'),                                          // 이메일 가리기
    modelRetryMiddleware({ maxRetries: 3 }),                          // 모델 호출 실패 시 재시도
    humanInTheLoopMiddleware({ interruptOn: { writeFile: true } }),   // 파일 쓰기 전 사람 승인
  ],
});`}
        />
        <CodeBlock
          title="구조화된 출력 · 대화 기억 · 스트리밍"
          code={`
// 1) 정해진 형식으로 받기
const Review = z.object({ summary: z.string(), score: z.number().min(1).max(5) });
const reviewer = createAgent({ model: 'anthropic:claude-sonnet-5-5', tools: [], responseFormat: Review });
const { structuredResponse } = await reviewer.invoke({ messages: [{ role: 'user', content: '이 리뷰 요약해줘: …' }] });
// structuredResponse → { summary: '…', score: 4 }

// 2) 여러 턴 대화 유지: checkpointer + thread_id
import { MemorySaver } from '@langchain/langgraph';
const chat = createAgent({ model: 'anthropic:claude-sonnet-5-5', tools: [], checkpointer: new MemorySaver() });
const config = { configurable: { thread_id: 'user-42' } };
await chat.invoke({ messages: [{ role: 'user', content: '내 이름은 김리액트야' }] }, config);
await chat.invoke({ messages: [{ role: 'user', content: '내 이름이 뭐였지?' }] }, config);  // 기억함

// 3) 진행 상황 스트리밍 (공식 문서 예제 형태)
const stream = await agent.streamEvents(
  { messages: [{ role: 'user', content: 'AI 뉴스 찾아서 요약해줘' }] },
  { version: 'v3' },
);
for await (const snapshot of stream.values) {
  const latest = snapshot.messages.at(-1);   // 새 모델 응답 또는 도구 호출을 화면에 표시
}`}
        />
        <Callout type="warn" title="버전 주의">
          <p>LangChain은 v1(2025)에서 API가 크게 바뀌었습니다(<Code>createAgent</Code>, middleware 도입). 블로그 예제 중 <Code>AgentExecutor</Code>, <Code>initializeAgentExecutorWithOptions</Code> 같은 이름은 예전 방식이니, 항상 공식 문서의 현재 버전을 기준으로 보세요. 모델 이름 문자열도 시점마다 바뀝니다.</p>
        </Callout>
      </Section>
    </>
  );
}
