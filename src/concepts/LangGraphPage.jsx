import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, ui,
} from '../components/kit.jsx';
import { WhereToCheck } from '../components/screens.jsx';

export default function LangGraphPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          LangGraph는 에이전트의 흐름을 <u>상태(State)를 들고 노드(Node) 사이를 엣지(Edge)로 이동하는 그래프</u>로 짜는 저수준 오케스트레이션 프레임워크입니다.
          정해진 단계와 LLM 판단을 한 그래프에 섞을 수 있고, 각 단계의 상태를 저장(checkpoint)해서 중간에 멈추고(사람 승인), 실패해도 이어서, 과거 시점부터 다시 실행할 수 있습니다.
        </OneLiner>

        <H3>핵심 개념</H3>
        <Table
          head={['개념', '뜻', 'API']}
          rows={[
            ['State', '그래프 전체가 공유하는 데이터. 노드는 바꿀 부분만 반환하고, 필드별 reducer가 합침', <><Code>Annotation.Root</Code> / <Code>StateSchema</Code></>],
            ['Node', '상태를 받아 업데이트를 반환하는 함수 (LLM 호출, 도구 실행, 일반 코드 무엇이든)', <Code>.addNode('review', fn)</Code>],
            ['Edge', '다음에 갈 노드. START에서 시작해 END에서 끝남', <Code>.addEdge(START, 'draft')</Code>],
            ['Conditional edge', '상태를 보고 다음 노드를 고르는 함수 → 분기와 반복(루프)', <Code>.addConditionalEdges('review', route, [...])</Code>],
            ['Checkpointer', '노드가 끝날 때마다 상태를 저장. thread_id별로 이어서 실행', <Code>compile({'{ checkpointer: new MemorySaver() }'})</Code>],
            ['interrupt / Command', '노드 안에서 멈추고 사람 입력을 기다림 → 같은 thread로 resume 값을 주면 재개', <><Code>interrupt(…)</Code>, <Code>{'new Command({ resume })'}</Code></>],
          ]}
        />
        <List
          items={[
            <><b>LangChain과의 관계</b>: LangGraph는 흐름(오케스트레이션), LangChain은 모델·도구·통합을 담당한다. LangChain의 <Code>createAgent</Code>가 LangGraph 위에서 만들어져 있고, LangGraph는 LangChain 없이도 쓸 수 있다.</>,
            <><b>Durable execution</b>: 상태가 저장되니 서버가 죽거나 몇 시간 뒤 사람이 승인해도 그 지점부터 이어서 실행된다.</>,
            <><b>주의</b>: interrupt 뒤 재개하면 그 노드는 <b>처음부터 다시 실행</b>된다. interrupt 앞에 결제 같은 부수 효과를 두면 두 번 실행될 수 있다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>흐름 일부는 고정, 일부는 LLM 판단</b>인 업무: 문의 분류 → (LLM) → 정해진 처리 → 검토</>,
            <><b>사람 승인이 끼는 작업</b>: 메일 발송·결제·배포 전에 멈추고, 승인되면 이어서</>,
            '오래 걸리거나 중간에 실패할 수 있는 작업: 체크포인트에서 재개',
            '여러 에이전트가 역할을 나눠 협업하는 구조(supervisor, 하위 에이전트), 생성-평가 반복 루프',
          ]}
          avoid={[
            '도구 몇 개 쓰는 일반 에이전트 — LangChain createAgent(내부가 LangGraph)로 충분',
            '단계가 고정된 단순 파이프라인 — 그냥 함수를 순서대로 호출하는 게 더 명확하다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>"글 초안 → 평가 → (점수 미달이면) 수정 → 다시 평가 → 사람 승인 → 발행" 그래프입니다. 아래 데모가 이 그래프를 실제로 실행합니다.</p>
        <GraphDiagram active={null} visited={[]} />
        <CodeBlock
          code={`
START → draft → review ─(점수 ≥ 기준)→ approval ─(승인)→ publish → END
                  ↑   └─(점수 미달)→ revise ─┐       └─(거절)→ revise
                  └──────────────────────────┘`}
        />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '직접 while 루프',
            code: `
async function writePost(topic) {
  let draft = await llm(\`\${topic} 초안 작성\`);
  let revisions = 0;
  while (true) {
    const { score, feedback } = await review(draft);
    if (score >= 80) break;
    draft = await llm(\`수정: \${feedback}\\n\${draft}\`);
    revisions++;
  }
  // 사람 승인은? 서버가 재시작되면? 3번째 수정부터 다시 하고 싶다면?
  // → 상태 저장, 재개, 대기 로직을 전부 직접 만들어야 함
  await publish(draft);
}`,
            note: '간단한 흐름엔 충분하지만, 멈춤·재개·승인·과거 시점부터 재실행이 필요해지면 코드가 급격히 복잡해진다.',
          }}
          after={{
            label: 'LangGraph',
            code: `
import { Annotation, StateGraph, START, END, MemorySaver, interrupt, Command } from '@langchain/langgraph';

const State = Annotation.Root({
  topic: Annotation(),
  draft: Annotation(),
  score: Annotation(),
  revisions: Annotation({ reducer: (_, next) => next, default: () => 0 }),
  approved: Annotation(),
});

const graph = new StateGraph(State)
  .addNode('draft', async (s) => ({ draft: await llm(\`\${s.topic} 초안\`) }))
  .addNode('review', async (s) => ({ score: await scoreDraft(s.draft) }))
  .addNode('revise', async (s) => ({ draft: await llm(\`수정: \${s.draft}\`), revisions: s.revisions + 1 }))
  .addNode('approval', () => ({ approved: interrupt({ question: '발행할까요?' }) }))   // 여기서 멈춤
  .addNode('publish', async (s) => { await publish(s.draft); return {}; })
  .addEdge(START, 'draft')
  .addEdge('draft', 'review')
  .addConditionalEdges('review', (s) => (s.score >= 80 ? 'approval' : 'revise'), ['approval', 'revise'])
  .addEdge('revise', 'review')
  .addConditionalEdges('approval', (s) => (s.approved ? 'publish' : 'revise'), ['publish', 'revise'])
  .addEdge('publish', END)
  .compile({ checkpointer: new MemorySaver() });

const config = { configurable: { thread_id: 'post-1' } };
const r = await graph.invoke({ topic: 'React 19' }, config);   // approval에서 멈춤 → r.__interrupt__
await graph.invoke(new Command({ resume: true }), config);      // 나중에 승인 → 이어서 publish`,
            note: '흐름은 그래프로 선언하고, 상태 저장·멈춤·재개는 LangGraph가 한다. 운영에서는 MemorySaver 대신 DB 기반 checkpointer.',
          }}
        />
        <Callout title="참고">
          <p>최신 공식 문서 예제는 상태를 <Code>{'new StateSchema({ messages: MessagesValue })'}</Code> 형태로도 보여줍니다. <Code>Annotation.Root</Code>와 같은 역할이에요. 실행 기록과 과거 체크포인트는 <Code>graph.getStateHistory(config)</Code>로 볼 수 있습니다.</p>
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <GraphDemo />
        <H3>확인 경로</H3>
        <WhereToCheck
          items={[
            { where: '공식 문서', path: ['docs.langchain.com', 'LangGraph (JavaScript)', 'Overview · Interrupts · Persistence'], what: 'StateGraph, interrupt/Command, checkpointer 예제.' },
            { where: '그래프를 그림으로', path: ['코드', '(await graph.getGraphAsync()).drawMermaid()'], what: 'Mermaid 문자열로 노드·엣지 구조를 출력해 문서에 붙일 수 있다.' },
            { where: '단계별 실행 보기', path: ['LangGraph Studio / LangSmith', 'Threads'], what: '노드마다 상태 변화, interrupt 지점, 체크포인트에서 다시 실행(time travel).' },
          ]}
        />
      </Section>
    </>
  );
}

/* ---------- 그래프 그림 ---------- */

const NODES = ['draft', 'review', 'revise', 'approval', 'publish'];
const NODE_DESC = { draft: '초안 작성 (LLM)', review: '평가 (LLM)', revise: '수정 (LLM)', approval: '사람 승인 (interrupt)', publish: '발행 (코드)' };

function GraphDiagram({ active, visited }) {
  return (
    <div className="flex min-w-[520px] flex-wrap items-center justify-center gap-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-white dark:bg-zinc-200 dark:text-zinc-900">START</span>
      {NODES.map((n) => (
        <div key={n} className="flex items-center gap-2">
          <span className="text-zinc-400">→</span>
          <div className={`rounded-xl border-2 px-3 py-2 text-center transition ${n === active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15' : visited.includes(n) ? 'border-emerald-400' : 'border-zinc-200 dark:border-zinc-700'}`}>
            <div className="font-mono text-sm font-semibold">{n}</div>
            <div className="text-[10px] text-zinc-500">{NODE_DESC[n]}</div>
          </div>
        </div>
      ))}
      <span className="text-zinc-400">→</span>
      <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-white dark:bg-zinc-200 dark:text-zinc-900">END</span>
    </div>
  );
}

/* ---------- 데모: 아주 작은 StateGraph 실행기 ---------- */

// 노드: 상태를 받아 "바꿀 부분"만 반환 (LLM 대신 정해진 규칙)
const nodeFns = {
  draft: (s) => ({ draft: `「${s.topic}」 초안 v1`, revisions: 0 }),
  review: (s) => {
    const score = 55 + s.revisions * 15;
    return { score, feedback: score >= s.passScore ? '좋아요' : '예시 코드가 부족해요' };
  },
  revise: (s) => ({ draft: `「${s.topic}」 초안 v${s.revisions + 2} (${s.feedback} 반영)`, revisions: s.revisions + 1 }),
  approval: (s, resume) => (resume === undefined ? { __interrupt__: '발행할까요?' } : { approved: resume }),
  publish: (s) => ({ published: true, url: `/blog/${s.revisions + 1}` }),
};
// 엣지: 고정 또는 상태를 보고 고르는 조건부
const edges = {
  START: () => 'draft',
  draft: () => 'review',
  review: (s) => (s.score >= s.passScore ? 'approval' : 'revise'),
  revise: () => 'review',
  approval: (s) => (s.approved ? 'publish' : 'revise'),
  publish: () => 'END',
};

const initialRun = (passScore) => {
  const state = { topic: 'React 19 정리', passScore };
  return { state, next: 'draft', checkpoints: [{ step: 0, node: 'START', state, next: 'draft' }], interrupted: false };
};

function GraphDemo() {
  const [passScore, setPassScore] = useState(80);
  const [run, setRun] = useState(() => initialRun(80));
  const visited = [...new Set(run.checkpoints.map((c) => c.node))];

  // 노드 하나 실행 → 상태 병합 → 다음 노드 결정 → 체크포인트 저장
  const step = (resume) => {
    setRun((r) => {
      if (r.next === 'END') return r;
      const update = nodeFns[r.next](r.state, resume);
      if (update.__interrupt__) return { ...r, interrupted: update.__interrupt__ };
      const state = { ...r.state, ...update };
      const next = edges[r.next](state);
      const cp = { step: r.checkpoints.length, node: r.next, state, next };
      return { state, next, checkpoints: [...r.checkpoints, cp], interrupted: false };
    });
  };

  const runUntilStop = () => {
    setRun((r) => {
      let cur = r;
      for (let i = 0; i < 20 && cur.next !== 'END'; i++) {
        const update = nodeFns[cur.next](cur.state);
        if (update.__interrupt__) return { ...cur, interrupted: update.__interrupt__ };
        const state = { ...cur.state, ...update };
        const next = edges[cur.next](state);
        cur = { state, next, checkpoints: [...cur.checkpoints, { step: cur.checkpoints.length, node: cur.next, state, next }], interrupted: false };
      }
      return cur;
    });
  };

  // 과거 체크포인트로 되돌아가 그 시점부터 다시 (time travel)
  const rewind = (cp) => setRun((r) => ({ state: cp.state, next: cp.next, checkpoints: r.checkpoints.slice(0, cp.step + 1), interrupted: false }));
  const reset = (score = passScore) => { setPassScore(score); setRun(initialRun(score)); };

  const { state, next, interrupted } = run;
  const shown = Object.fromEntries(Object.entries(state).filter(([k]) => k !== 'passScore'));

  return (
    <Demo hint="'한 단계'로 노드를 하나씩 실행하거나 '멈출 때까지 실행'을 눌러 보세요. approval 노드에서 멈추면(interrupt) 승인/거절로 재개합니다. 오른쪽 체크포인트를 누르면 그 시점부터 다시 실행할 수 있습니다.">
      <div className="flex flex-wrap items-center gap-3">
        <button className={ui.btnPrimary} onClick={() => step()} disabled={next === 'END' || !!interrupted}>한 단계 (다음: {next})</button>
        <button className={ui.btn} onClick={runUntilStop} disabled={next === 'END' || !!interrupted}>멈출 때까지 실행 (invoke)</button>
        <button className={ui.btn} onClick={() => reset()}>처음부터</button>
        <label className="flex items-center gap-2 text-sm">
          통과 점수
          <input type="range" min={60} max={95} step={5} value={passScore} onChange={(e) => reset(Number(e.target.value))} className="w-28 accent-indigo-600" />
          <span className="w-8 font-mono">{passScore}</span>
        </label>
      </div>
      <div className="mt-4"><GraphDiagram active={interrupted ? 'approval' : next} visited={visited} /></div>

      {interrupted && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm dark:bg-amber-500/10">
          <span className="font-semibold text-amber-800 dark:text-amber-200">interrupt: "{interrupted}" — 상태는 저장됐고 그래프는 멈춘 상태</span>
          <button className={ui.btnPrimary} onClick={() => step(true)}>{'Command({ resume: true })'}</button>
          <button className={ui.btn} onClick={() => step(false)}>{'Command({ resume: false })'}</button>
        </div>
      )}
      {next === 'END' && <p className={`mt-3 text-sm font-semibold ${ui.good}`}>END 도달 — 발행 완료</p>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold text-zinc-500">현재 State</div>
          <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-800">{JSON.stringify(shown, null, 2)}</pre>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-zinc-500">체크포인트 (thread: post-1)</div>
          <div className="max-h-64 space-y-1 overflow-auto">
            {run.checkpoints.map((cp) => (
              <button key={cp.step} onClick={() => rewind(cp)} className="flex w-full items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 text-left font-mono text-xs hover:ring-1 hover:ring-indigo-300 dark:bg-zinc-800/60">
                <span>#{cp.step} {cp.node} 완료{cp.state.score != null && cp.node === 'review' ? ` (점수 ${cp.state.score})` : ''}</span>
                <span className="text-zinc-400">다음 → {cp.next}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Demo>
  );
}
