import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeCompare,
  Demo, Viz, Toggle, ui,
} from '../components/kit.jsx';

export default function AiAgent() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          AI Agent는 <u>LLM이 스스로 어떤 도구를 쓸지 정하고, 도구 실행 결과를 보고 다음 행동을 정하는 과정을 목표를 이룰 때까지 반복하는 시스템</u>입니다.
          정해진 순서대로 LLM을 호출하는 워크플로와 달리, 진행 방식 자체를 LLM이 결정합니다.
        </OneLiner>

        <H3>워크플로 vs 에이전트 (Anthropic 「Building effective agents」 기준)</H3>
        <Table
          head={['', '워크플로 (Workflow)', '에이전트 (Agent)']}
          rows={[
            ['흐름을 정하는 것', '개발자가 짠 코드 경로', 'LLM이 매 단계 스스로'],
            ['단계 수', '미리 정해짐', '문제에 따라 달라짐'],
            ['장점', '예측 가능, 빠르고 저렴, 테스트 쉬움', '열린 문제에 유연하게 대응'],
            ['단점', '예상 못 한 상황에 약함', '비용·지연 증가, 실수가 누적될 수 있음'],
          ]}
        />

        <H3>에이전트 루프는 어떻게 돌아가나</H3>
        <List
          items={[
            <><b>① 도구 정의를 함께 보냄</b>: 이름, 설명, 입력 형식(JSON Schema)을 LLM에 알려준다.</>,
            <><b>② LLM이 "도구 호출"을 답함</b>: LLM이 도구를 직접 실행하는 게 아니다. <Code>{'{ name: "getOrder", input: { id: "1234" } }'}</Code> 같은 요청을 답으로 돌려줄 뿐이고, <b>실행은 우리 코드</b>가 한다.</>,
            <><b>③ 결과를 대화에 붙여 다시 호출</b>: 실행 결과(observation)를 메시지에 추가하고 LLM을 다시 부른다. LLM은 결과를 보고 다음 도구를 고르거나 최종 답을 한다.</>,
            <><b>④ 종료</b>: 도구 호출 없이 답하면 끝. 무한 반복을 막으려고 최대 횟수, 비용 한도를 둔다.</>,
            <>위험한 행동(결제, 삭제, 메일 발송) 앞에서는 <b>사람 승인</b>을 받고 멈춘다(human-in-the-loop).</>,
          ]}
        />

        <H3>에이전트 전에 먼저 고려할 워크플로 패턴</H3>
        <Table
          head={['패턴', '방식', '예']}
          rows={[
            ['Prompt chaining', '작업을 순서대로 쪼개 이전 결과를 다음 입력으로', '개요 작성 → 검토 → 본문 작성'],
            ['Routing', '입력을 분류해 맞는 처리로 보냄', '문의 유형별로 환불/배송/기술지원 프롬프트'],
            ['Parallelization', '나눠서 동시에, 또는 같은 일을 여러 번 해서 투표', '코드 리뷰를 보안/성능 관점으로 동시에'],
            ['Orchestrator-workers', '중심 LLM이 일을 나눠 맡기고 결과를 합침', '여러 파일을 고쳐야 하는 코딩 작업'],
            ['Evaluator-optimizer', '하나가 만들고 하나가 평가하며 반복', '번역 품질 개선, 글 다듬기'],
          ]}
        />
        <Callout title="도구 표준: MCP">
          <p>도구를 앱마다 따로 붙이는 대신 MCP(Model Context Protocol)로 만든 서버를 연결하면, 여러 에이전트(Claude, IDE, 사내 봇)가 같은 도구(GitHub, DB, Figma 등)를 표준 방식으로 쓸 수 있습니다.</p>
        </Callout>

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>몇 단계가 필요할지 미리 알 수 없는 열린 문제</b>: 코딩 에이전트, 리서치, 고객 문의 처리</>,
            '중간 결과(도구 실행 결과)를 보고 다음 행동을 바꿔야 하는 작업',
            '결과를 확인할 수 있는 환경(테스트, 실행 결과)이 있어 스스로 고칠 수 있는 작업',
          ]}
          avoid={[
            <><b>LLM 한 번 호출로 되는 일</b> — Anthropic도 "가장 단순한 방법부터, 측정해서 나아질 때만 복잡도를 더하라"고 권한다</>,
            '단계가 정해진 작업 — 워크플로가 더 빠르고 싸고 예측 가능하다',
            '되돌릴 수 없는 행동을 사람 확인 없이 맡기는 것',
          ]}
        />
        <p className={`text-sm ${ui.muted}`}>
          에이전트를 실제로 믿을 만하게 만드는 주변 장치(도구, 컨텍스트, 검증, 권한)는 같은 질문의{' '}
          <Link className="text-indigo-600 dark:text-indigo-400" to="/ai/ai-agent/deep/harness-engineering">Harness Engineering</Link> 심화에서 다룹니다.
        </p>
      </Section>

      <Section step={2} title="시각화">
        <p>"주문 1234 배송 언제 와요?"라는 질문에 에이전트가 답하기까지의 루프입니다.</p>
        <LoopViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '워크플로 (흐름을 코드가 정함)',
            code: `
async function answerShipping(question) {
  const orderId = await llm(\`주문번호만 뽑아줘: \${question}\`);
  const order = await getOrder(orderId);           // 항상 이 순서
  const shipping = await getShipping(order.trackingNo);
  return llm(\`이 정보로 답해줘: \${JSON.stringify(shipping)}\`);
}
// 배송 API가 실패하거나, 질문이 "환불해줘"면 대응 못 함`,
            note: '빠르고 예측 가능하지만, 코드에 없는 상황에는 대응하지 못한다.',
          }}
          after={{
            label: '에이전트 루프 (흐름을 LLM이 정함)',
            code: `
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

const tools = [{
  name: 'get_order',
  description: '주문 번호로 주문 정보와 송장 번호를 조회한다',
  input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
}, /* get_shipping, issue_coupon ... */];

const messages = [{ role: 'user', content: '주문 1234 배송 언제 와요?' }];

for (let turn = 0; turn < 10; turn++) {           // 최대 반복 횟수
  const res = await client.messages.create({
    model: 'claude-sonnet-5-5', max_tokens: 1024, tools, messages,
  });
  messages.push({ role: 'assistant', content: res.content });
  if (res.stop_reason !== 'tool_use') break;       // 도구 호출이 없으면 최종 답

  const results = [];
  for (const block of res.content) {
    if (block.type !== 'tool_use') continue;
    const output = await runTool(block.name, block.input);   // 실행은 우리 코드가
    results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(output) });
  }
  messages.push({ role: 'user', content: results });         // 결과를 붙여 다시
}`,
            note: '어떤 도구를 몇 번 쓸지 LLM이 결과를 보며 정한다. 실패하면 다시 시도하거나 다른 방법을 고른다.',
          }}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <AgentDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const LOOP = [
  { who: 'user', text: '사용자: "주문 1234 배송 언제 와요?"' },
  { who: 'llm', text: 'LLM: 주문 정보가 필요하다 → get_order({ id: "1234" }) 호출 요청' },
  { who: 'tool', text: '우리 코드가 실행: { item: "이어폰", trackingNo: "CJ-778" }' },
  { who: 'llm', text: 'LLM: 송장 번호가 생겼다 → get_shipping({ trackingNo: "CJ-778" }) 호출 요청' },
  { who: 'tool', text: '우리 코드가 실행: { status: "배송 중", eta: "내일" }' },
  { who: 'llm', text: 'LLM: 충분하다 → 도구 호출 없이 최종 답: "내일 도착 예정입니다."' },
];
const NODE = { user: '사용자', llm: 'LLM', tool: '도구 실행' };

function LoopViz() {
  const [i, setI] = useState(0);
  const cur = LOOP[i].who;
  return (
    <Viz>
      <div className="flex min-w-[460px] items-center justify-center gap-3">
        {['user', 'llm', 'tool'].map((k, n) => (
          <div key={k} className="flex items-center gap-3">
            {n > 0 && <span className="text-zinc-400">⇄</span>}
            <div className={`rounded-xl border-2 px-5 py-3 text-sm font-semibold transition ${cur === k ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15' : 'border-zinc-200 dark:border-zinc-700'}`}>{NODE[k]}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        {LOOP.slice(0, i + 1).map((s, n) => (
          <div key={n} className={`rounded-lg px-3 py-2 font-mono text-xs ${n === i ? 'bg-indigo-50 ring-1 ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/40' : 'bg-zinc-50 dark:bg-zinc-800/60'}`}>
            {n + 1}. {s.text}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button className={ui.btn} disabled={i === 0} onClick={() => setI((x) => x - 1)}>← 이전</button>
        <button className={ui.btnPrimary} disabled={i === LOOP.length - 1} onClick={() => setI((x) => x + 1)}>다음 →</button>
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>→ LLM은 2번 도구를 "요청"했고, 실제 실행은 우리 코드가 했습니다. 매 바퀴마다 지금까지의 대화 전체가 LLM에 다시 들어갑니다.</p>
    </Viz>
  );
}

/* ---------- 데모: 규칙 기반 가짜 LLM으로 돌리는 에이전트 루프 ---------- */

// 실제 LLM 대신, 지금까지의 대화(도구 결과)를 보고 다음 행동을 고르는 규칙 함수.
// 실제 LLM도 "대화 전체를 보고 다음 행동을 고른다"는 점은 같다.
function fakeLLM(history) {
  const results = history.filter((m) => m.role === 'tool');
  const last = (name) => [...results].reverse().find((r) => r.name === name);
  const tries = (name) => results.filter((r) => r.name === name).length;

  const order = last('get_order');
  if (!order) return { tool: 'get_order', input: { id: '1234' }, thought: '주문 정보부터 확인해야 해요.' };

  const ship = last('get_shipping');
  if (!ship || (ship.output.error && tries('get_shipping') < 2)) {
    return {
      tool: 'get_shipping',
      input: { trackingNo: order.output.trackingNo },
      thought: ship ? '배송 조회가 실패했어요. 한 번 더 시도할게요.' : '송장 번호로 배송 상태를 조회할게요.',
    };
  }
  if (ship.output.error) return { answer: '배송 조회 시스템에 문제가 있어 지금은 확인이 어려워요. 30분 뒤 다시 확인해 드릴게요.', thought: '두 번 실패했으니 무리하지 않고 사과해요.' };

  const delayed = ship.output.delayDays > 0;
  const coupon = last('issue_coupon');
  if (delayed && !coupon) return { tool: 'issue_coupon', input: { orderId: '1234', amount: 3000 }, thought: `${ship.output.delayDays}일 늦어졌으니 보상 쿠폰을 발급할게요.` };
  if (delayed && coupon?.output.rejected) return { answer: `배송이 ${ship.output.delayDays}일 늦어져 ${ship.output.eta} 도착 예정이에요. 불편을 드려 죄송합니다.`, thought: '쿠폰 발급이 승인되지 않았으니 사과만 해요.' };
  if (delayed) return { answer: `배송이 ${ship.output.delayDays}일 늦어져 ${ship.output.eta} 도착 예정이에요. 사과의 의미로 3,000원 쿠폰을 드렸어요.`, thought: '쿠폰까지 발급했으니 정리해서 답해요.' };
  return { answer: `${order.output.item}은(는) ${ship.output.status}이고 ${ship.output.eta} 도착 예정이에요.`, thought: '필요한 정보가 다 모였어요.' };
}

function runTool(name, input, opts, shipCalls) {
  if (name === 'get_order') return { item: '무선 이어폰', trackingNo: 'CJ-778' };
  if (name === 'get_shipping') {
    if (opts.apiFail && shipCalls === 0) return { error: '503 Service Unavailable' };
    if (opts.apiFailTwice) return { error: '503 Service Unavailable' };
    return opts.delayed ? { status: '배송 지연', eta: '모레', delayDays: 2 } : { status: '배송 중', eta: '내일', delayDays: 0 };
  }
  if (name === 'issue_coupon') return { couponId: 'CP-' + input.amount, issued: true };
  return { error: 'unknown tool' };
}

const MAX_TURNS = 8;

function AgentDemo() {
  const [opts, setOpts] = useState({ delayed: true, apiFail: false, apiFailTwice: false, approval: true });
  const [history, setHistory] = useState([{ role: 'user', text: '주문 1234 배송 언제 와요? 늦으면 보상도 해주세요.' }]);
  const [pending, setPending] = useState(null); // 승인 대기 중인 도구 호출
  const [done, setDone] = useState(false);

  const turns = history.filter((m) => m.role === 'assistant').length;
  const reset = (next = opts) => { setOpts(next); setHistory([{ role: 'user', text: '주문 1234 배송 언제 와요? 늦으면 보상도 해주세요.' }]); setPending(null); setDone(false); };

  const step = () => {
    if (done || pending) return;
    if (turns >= MAX_TURNS) { setHistory((h) => [...h, { role: 'system', text: `최대 반복 ${MAX_TURNS}회에 도달해 중단` }]); setDone(true); return; }
    const action = fakeLLM(history);
    if (action.answer) {
      setHistory((h) => [...h, { role: 'assistant', thought: action.thought, text: action.answer }]);
      setDone(true);
      return;
    }
    const call = { role: 'assistant', thought: action.thought, tool: action.tool, input: action.input };
    if (action.tool === 'issue_coupon' && opts.approval) {
      setHistory((h) => [...h, call]);
      setPending(call);
      return;
    }
    execute(call, true);
  };

  const execute = (call, addCall) => {
    const shipCalls = history.filter((m) => m.role === 'tool' && m.name === 'get_shipping').length;
    const output = runTool(call.tool, call.input, opts, shipCalls);
    setHistory((h) => [...h, ...(addCall ? [call] : []), { role: 'tool', name: call.tool, output }]);
  };

  const decide = (approved) => {
    if (approved) execute(pending, false);
    else setHistory((h) => [...h, { role: 'tool', name: pending.tool, output: { rejected: true, reason: '담당자가 거절' } }]);
    setPending(null);
  };

  const opt = (key, label) => (
    <Toggle checked={opts[key]} onChange={(v) => reset({ ...opts, [key]: v })} label={<span className="text-sm font-normal">{label}</span>} />
  );

  return (
    <Demo hint="실제 LLM 대신 '대화를 보고 다음 행동을 고르는 규칙 함수'(가짜 LLM)로 루프를 돌립니다. 조건을 바꾸고 '한 단계 진행'을 눌러, 도구 결과에 따라 에이전트의 다음 행동이 바뀌는 것을 보세요.">
      <div className="grid gap-2 sm:grid-cols-2">
        {opt('delayed', '배송이 늦어진 상황')}
        {opt('apiFail', '배송 API가 첫 번째에 실패')}
        {opt('apiFailTwice', '배송 API가 계속 실패')}
        {opt('approval', '쿠폰 발급은 사람 승인 필요')}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className={ui.btnPrimary} onClick={step} disabled={done || !!pending}>한 단계 진행 (LLM 호출)</button>
        <button className={ui.btn} onClick={() => reset()}>처음부터</button>
        <span className="text-sm text-zinc-400">LLM 호출 {turns}회 / 최대 {MAX_TURNS}회</span>
      </div>

      <div className="mt-4 space-y-2">
        {history.map((m, i) => <Message key={i} m={m} />)}
        {pending && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm dark:bg-amber-500/10">
            <span className="font-semibold text-amber-800 dark:text-amber-200">사람 승인 대기: issue_coupon(3,000원)을 실행할까요?</span>
            <button className={ui.btnPrimary} onClick={() => decide(true)}>승인</button>
            <button className={ui.btn} onClick={() => decide(false)}>거절</button>
          </div>
        )}
        {done && <p className={`text-sm font-semibold ${ui.good}`}>루프 종료 — 도구 호출 없이 답했어요.</p>}
      </div>
    </Demo>
  );
}

function Message({ m }) {
  const style = {
    user: 'bg-zinc-100 dark:bg-zinc-800',
    assistant: 'bg-indigo-50 dark:bg-indigo-500/10',
    tool: 'bg-emerald-50 dark:bg-emerald-500/10',
    system: 'bg-rose-50 dark:bg-rose-500/10',
  }[m.role];
  const label = { user: '사용자', assistant: 'LLM', tool: '도구 결과', system: '하네스' }[m.role];
  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${style}`}>
      <span className="mr-2 text-xs font-bold text-zinc-500">{label}</span>
      {m.role === 'assistant' && m.thought && <span className="mr-2 text-xs text-zinc-500">({m.thought})</span>}
      {m.tool ? (
        <code className="font-mono text-xs">{m.tool}({JSON.stringify(m.input)})</code>
      ) : m.role === 'tool' ? (
        <code className="font-mono text-xs">{m.name} → {JSON.stringify(m.output)}</code>
      ) : (
        <span>{m.text}</span>
      )}
    </div>
  );
}
