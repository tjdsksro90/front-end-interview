import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare, Demo, Viz, Legend, ui } from '../components/kit.jsx';
import { SelectorPlayground, SpecificityBattle } from './SelectorPlayground.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';
const BASE = '/css/19-is-where-has-not/deep';

const DEMO_CSS = `
.nt-btn { padding: 8px 14px; border-radius: 10px; border: 1px solid rgb(161 161 170 / .6); transition: background .15s; }
.nt-a:hover { background: rgb(99 102 241); color: white; }
.nt-b:not(:disabled):hover { background: rgb(99 102 241); color: white; }
.nt-btn:disabled { opacity: .45; cursor: not-allowed; }
`;

export default function NotSelector() {
  return (
    <>
      <style>{DEMO_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          <Code>:not()</Code>은 <u>괄호 안 선택자에 맞지 않는 요소를 선택</u>합니다. "전부 적용하고 예외만 다시 되돌리기" 대신 <u>처음부터 예외를 빼고</u> 적용할 수 있습니다.
          우선순위는 <Code>:is()</Code>처럼 <u>괄호 안에서 가장 높은 선택자</u>를 따릅니다.
        </OneLiner>

        <H3>읽는 법</H3>
        <Table
          head={['선택자', '뜻', '우선순위']}
          rows={[
            [<Code>li:not(:last-child)</Code>, '마지막이 아닌 li', '(0, 1, 1)'],
            [<Code>button:not(:disabled):hover</Code>, '비활성이 아닌 버튼에 hover', '(0, 2, 1)'],
            [<Code>a:not(.active, .disabled)</Code>, '.active도 .disabled도 아닌 a', '(0, 1, 1)'],
            [<Code>input:not([type='checkbox'])</Code>, '체크박스가 아닌 input', '(0, 1, 1)'],
            [<Code>.list:not(:has(li))</Code>, '항목이 하나도 없는 목록', '(0, 1, 1)'],
            [<Code>p:not(#intro)</Code>, 'id가 intro가 아닌 p', '(1, 0, 1) — id만큼 강해진다'],
          ]}
        />

        <H3>예전 :not()과 달라진 점 (Selectors Level 4)</H3>
        <List
          items={[
            <>예전에는 괄호 안에 <b>단순 선택자 하나</b>만 가능했다: <Code>:not(.a):not(.b)</Code>처럼 이어 붙여야 했다.</>,
            <>지금은 <b>목록</b>(<Code>:not(.a, .b)</Code>)과 <b>복합 선택자</b>(<Code>:not(.card .title)</Code>)도 된다.</>,
            <><Code>:not(.a, .b)</Code> = ".a도 아니고 .b도 아닌". 하나라도 맞으면 제외된다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>구분선·간격</b>: <Code>li:not(:last-child)</Code>, <Code>.item:not(:first-child)</Code></>,
            <><b>상태 예외</b>: <Code>button:not(:disabled):hover</Code> — 비활성 버튼은 hover 효과 없음</>,
            <><b>특정 타입 빼기</b>: <Code>input:not([type='checkbox'], [type='radio'])</Code></>,
            <><b><Link className={linkCls} to={`${BASE}/has-selector`}>:has()</Link>와 함께</b>: <Code>.card:not(:has(img))</Code> — 이미지 없는 카드</>,
          ]}
          avoid={[
            <><Code>:not(#id)</Code>, <Code>:not(.a.b.c)</Code>처럼 무거운 선택자 — 우선순위가 같이 올라간다. 필요하면 <Code>:not(:where(...))</Code></>,
            <><Code>*:not(...)</Code>나 <Code>:not(...)</Code>만 단독으로 — 거의 모든 요소(html, body 포함)를 고른다</>,
            '이중 부정·긴 조건 — 읽기 어려우면 클래스를 따로 두는 게 낫다',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>":not()은 예외를 빼고 적용해서 '적용 후 되돌리기' 코드를 없앤다. Level 4부터 목록을 받고, 우선순위는 괄호 안 가장 높은 값이라 :not(#id)는 id만큼 강해진다."</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>목록에 규칙을 적용했을 때 어떤 항목이 선택되는지 보여줍니다. <b>되돌리기 방식</b>은 선택한 뒤 다시 지우고, <Code>:not()</Code>은 처음부터 빼고 고릅니다.</p>
        <ListViz />

        <H3>우선순위 함정</H3>
        <p>
          <Code>:not(#intro)</Code>는 "id가 아닌"을 뜻하지만 계산은 id로 합니다. 그래서 아래처럼 클래스 두 개짜리 규칙도 이깁니다.
        </p>
        <SpecificityBattle
          rules={[
            { sel: '.post .text', decl: 'color: black' },
            { sel: 'p:not(#intro)', decl: 'color: gray' },
          ]}
        />
        <p className={`text-sm ${ui.muted}`}>
          우선순위를 높이지 않으려면 <Code>{'p:not(:where(#intro))'}</Code> → (0, 0, 1).
        </p>
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '적용하고 되돌리기',
            code: `
.menu li {
  border-bottom: 1px solid #eee;
}
.menu li:last-child {
  border-bottom: none;      /* 되돌리기 */
}

button:hover {
  background: #eee;
}
button:disabled:hover {
  background: transparent;  /* 원래 값을 알아야 되돌릴 수 있다 */
}`,
            note: '되돌릴 "원래 값"을 알아야 하고, 원래 값이 바뀌면 되돌리는 코드도 고쳐야 한다.',
          }}
          after={{
            label: ':not()',
            code: `
.menu li:not(:last-child) {
  border-bottom: 1px solid #eee;
}

button:not(:disabled):hover {
  background: #eee;
}`,
            note: '예외는 처음부터 적용되지 않으니 되돌릴 것이 없다.',
          }}
        />

        <H3>자주 쓰는 패턴</H3>
        <CodeBlock
          code={`
/* 항목 사이 간격 (lobotomized owl의 :not 버전) */
.stack > :not(:first-child) { margin-top: 16px; }

/* 체크박스·라디오를 뺀 입력칸만 */
input:not([type='checkbox'], [type='radio']) { width: 100%; }

/* 현재 페이지가 아닌 메뉴만 흐리게 */
.nav a:not([aria-current='page']) { opacity: 0.7; }

/* 아직 사용자가 건드리지 않은 칸은 에러 표시 안 함 */
input:not(:placeholder-shown):invalid { border-color: red; }

/* :has()와 함께: 이미지 없는 카드 */
.card:not(:has(img)) { padding-top: 24px; }`}
        />

        <H3>Tailwind에서는</H3>
        <CodeBlock
          code={`
<!-- v4: not-* variant -->
<li class="not-last:border-b">...</li>                   <!-- li:not(:last-child) -->
<button class="not-disabled:hover:bg-zinc-100">저장</button>

<!-- 임의 variant (v3, v4 모두): 클래스로 제외 -->
<a class="[&:not(.active)]:opacity-70">메뉴</a>
<li class="[&:not(:last-child)]:border-b">...</li>     <!-- v3에는 not-* variant가 없다 -->`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <Demo hint="두 버튼 모두 disabled입니다. 마우스를 올려 보세요. 실제 이 페이지에 적용된 CSS예요.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={ui.box}>
              <code className="block font-mono text-xs">{'.btn:hover { background: indigo }'}</code>
              <div className="mt-3 flex gap-2">
                <button type="button" className="nt-btn nt-a">활성</button>
                <button type="button" disabled className="nt-btn nt-a">비활성</button>
              </div>
              <p className={`mt-2 text-sm ${ui.bad}`}>비활성 버튼도 hover 색이 바뀌어서 눌러질 것처럼 보여요.</p>
            </div>
            <div className={ui.box}>
              <code className="block font-mono text-xs">{'.btn:not(:disabled):hover { ... }'}</code>
              <div className="mt-3 flex gap-2">
                <button type="button" className="nt-btn nt-b">활성</button>
                <button type="button" disabled className="nt-btn nt-b">비활성</button>
              </div>
              <p className={`mt-2 text-sm ${ui.good}`}>비활성 버튼은 hover 효과가 없어요.</p>
            </div>
          </div>
        </Demo>

        <H3>선택자 놀이터</H3>
        <SelectorPlayground
          presets={[
            { sel: '.list li:not(:last-child)', note: '마지막을 뺀 li 3개 → 구분선을 넣을 자리.' },
            { sel: 'nav a:not(.active, .disabled)', note: '상태 클래스가 없는 메뉴 링크 하나.' },
            { sel: 'button:not(:disabled)', note: '비활성이 아닌 버튼만.' },
            { sel: 'input:not([type="checkbox"])', note: '체크박스를 뺀 입력칸.' },
            { sel: '.card:not(:has(img))', note: '이미지가 없는 두 번째 카드.' },
            { sel: 'li:not(#x)', note: '고르는 건 li 4개 전부지만 우선순위는 (1, 0, 1).' },
          ]}
        />
      </Section>
    </>
  );
}

const ITEMS = ['홈', '글', '태그', '소개'];
const MODES = [
  { id: 'reset', label: 'li + li:last-child 되돌리기' },
  { id: 'not', label: 'li:not(:last-child)' },
  { id: 'first', label: 'li:not(:first-child)' },
];

function ListViz() {
  const [mode, setMode] = useState('reset');
  const [step, setStep] = useState(1);
  const last = ITEMS.length - 1;
  const state = (i) => {
    if (mode === 'reset') {
      if (step === 1) return 'pick';
      return i === last ? 'undo' : 'pick';
    }
    if (mode === 'not') return i === last ? 'skip' : 'pick';
    return i === 0 ? 'skip' : 'pick';
  };
  const cls = {
    pick: 'border-amber-400 bg-amber-50 font-semibold dark:bg-amber-500/10',
    undo: 'border-rose-400 border-dashed bg-rose-50 line-through dark:bg-rose-500/10',
    skip: 'border-zinc-200 text-zinc-400 dark:border-zinc-700',
  };
  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.id} className={`${mode === m.id ? ui.btnPrimary : ui.btn} font-mono text-xs`} onClick={() => { setMode(m.id); setStep(1); }}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'reset' && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <button className={`${ui.btn} px-2.5 py-1 text-xs`} onClick={() => setStep(step === 1 ? 2 : 1)}>
            {step === 1 ? '다음: li:last-child로 되돌리기 →' : '← 처음으로'}
          </button>
          <span className={ui.muted}>{step === 1 ? '1단계: li 전부에 구분선' : '2단계: 마지막 항목만 다시 지움'}</span>
        </div>
      )}
      <ul className="mt-4 flex min-w-[360px] gap-2">
        {ITEMS.map((t, i) => (
          <li key={`${t}${mode}${step}`} className={`animate-flash flex-1 rounded-lg border-2 px-3 py-2 text-center text-sm ${cls[state(i)]}`}>
            {t}
          </li>
        ))}
      </ul>
      <Legend items={[['bg-amber-300', '스타일 적용'], ['border-2 border-dashed border-rose-400', '적용했다가 되돌림'], ['bg-zinc-200 dark:bg-zinc-700', '처음부터 제외']]} />
    </Viz>
  );
}
