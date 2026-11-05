import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare, Demo, Viz, ui } from '../components/kit.jsx';
import { SelectorPlayground, SpecificityBattle } from './SelectorPlayground.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';
const BASE = '/css/19-is-where-has-not/deep';

// 관대한 선택자 목록 데모: 틀린 선택자(:wat)가 섞였을 때
const FORGIVING_CSS = `
.fg-a, .fg-b:wat { color: rgb(225 29 72); font-weight: 700; }
:is(.fg-c, .fg-d:wat) { color: rgb(5 150 105); font-weight: 700; }
`;

export default function IsSelector() {
  return (
    <>
      <style>{FORGIVING_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          <Code>:is()</Code>는 <u>괄호 안 선택자 중 하나라도 맞으면 선택</u>하는 가상 클래스입니다. 반복되는 선택자 조합을 <u>한 줄로 묶어</u> 줍니다.
          우선순위는 <u>괄호 안에서 가장 높은 선택자</u>를 따릅니다.
        </OneLiner>

        <H3>읽는 법</H3>
        <Table
          head={['선택자', '뜻', '우선순위']}
          rows={[
            [<Code>:is(h1, h2, h3)</Code>, 'h1 또는 h2 또는 h3', '(0, 0, 1)'],
            [<Code>:is(header, footer) a</Code>, 'header나 footer 안의 a', '(0, 0, 2)'],
            [<Code>.card :is(h2, .title)</Code>, '.card 안의 h2 또는 .title', '(0, 2, 0) — .title 기준'],
            [<Code>:is(#app, p) span</Code>, '#app이나 p 안의 span', '(1, 0, 1) — p로 맞아도 id만큼 강하다'],
          ]}
        />

        <H3>그냥 쉼표(,)로 쓰는 것과 다른 점</H3>
        <List
          items={[
            <><b>조합을 줄인다</b>: <Code>:is(header, main, footer) :is(h1, h2) a</Code>는 쉼표로 풀어 쓰면 3 × 2 = 6줄이다.</>,
            <><b>관대하다(forgiving)</b>: 쉼표 목록은 하나만 틀려도 규칙 전체가 무시되지만, <Code>:is()</Code> 안에서는 틀린 것만 무시되고 나머지는 동작한다.</>,
            <><b>우선순위가 하나로 합쳐진다</b>: 쉼표 목록은 선택자마다 우선순위가 따로지만, <Code>:is()</Code>는 가장 높은 값 하나로 계산된다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>반복되는 조합 줄이기</b>: 여러 영역의 같은 요소에 같은 스타일 (<Code>:is(article, aside) :is(h2, h3)</Code>)</>,
            <><b>상태 묶기</b>: <Code>a:is(:hover, :focus-visible)</Code></>,
            <><b>새 선택자를 안전하게 섞기</b>: 지원 안 되는 선택자가 섞여도 나머지가 살아 있다</>,
          ]}
          avoid={[
            <>괄호 안에 <b>id나 무거운 선택자를 섞기</b> — 가벼운 쪽으로 맞아도 우선순위가 같이 올라가서 덮어쓰기 어려워진다</>,
            <>덮어쓰기 쉬워야 하는 기본 스타일 — 우선순위 0인 <Link className={linkCls} to={`${BASE}/where-selector`}>:where()</Link>를 쓴다</>,
            <>가상 요소 — <Code>:is(::before, ::after)</Code>는 동작하지 않는다</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>":is()와 :where()는 고르는 요소가 같고 우선순위만 다르다. :is()는 괄호 안 가장 높은 값, :where()는 0이다"가 핵심이에요.</p>
          <p>CSS Nesting(<Code>{'.a { .b & {} }'}</Code>)의 <Code>&</Code>는 내부적으로 <Code>:is()</Code>처럼 계산돼서 우선순위가 같은 규칙을 따릅니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>그룹에 넣을 항목을 고르면, <Code>:is()</Code> 한 줄이 쉼표로 풀어 쓴 몇 줄과 같은지 보여줍니다.</p>
        <ExpansionViz />

        <H3>우선순위: 괄호 안 가장 높은 값</H3>
        <p>
          아래 세 규칙이 모두 <Code>{'<p class="note">'}</Code>(<Code>#app</Code> 안)에 맞을 때, <Code>:is(#app, main) p</Code>는 <Code>main</Code>으로 맞았더라도 <b>id 기준 (1, 0, 1)</b>이 되어 이깁니다.
        </p>
        <SpecificityBattle
          rules={[
            { sel: 'main p.note', decl: 'color: blue' },
            { sel: ':is(#app, main) p', decl: 'color: red' },
            { sel: 'p.note', decl: 'color: green' },
          ]}
        />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '쉼표로 풀어 쓰기',
            code: `
article h2 a:hover,
article h3 a:hover,
aside h2 a:hover,
aside h3 a:hover,
footer h2 a:hover,
footer h3 a:hover {
  text-decoration: underline;
}`,
            note: '조합이 늘어날수록 줄이 곱으로 늘고, 하나만 틀려도 규칙 전체가 무시된다.',
          }}
          after={{
            label: ':is()',
            code: `
:is(article, aside, footer) :is(h2, h3) a:hover {
  text-decoration: underline;
}

/* 상태 묶기 */
a:is(:hover, :focus-visible) {
  outline: 2px solid royalblue;
}`,
            note: '한 줄로 같은 뜻. 우선순위는 (0, 1, 3) — 가장 높은 값끼리 더한다.',
          }}
        />

        <H3>Nesting과 :is()</H3>
        <CodeBlock
          code={`
/* CSS Nesting */
#sidebar, .panel {
  & a { color: gray; }
}

/* 브라우저는 이렇게 이해한다 → 우선순위 (1, 0, 1) */
:is(#sidebar, .panel) a { color: gray; }

/* 그래서 .panel 안의 a도 id만큼 강해진다. 덮어쓰기 어려우면 부모를 :where()로 */
:where(#sidebar, .panel) a { color: gray; }   /* (0, 0, 1) */`}
        />

        <H3>Tailwind에서는</H3>
        <CodeBlock
          code={`
<!-- 임의 variant: 이 요소 안의 h2, h3을 꾸밈 -->
<article class="[&_:is(h2,h3)]:font-bold [&_:is(h2,h3)]:text-zinc-900">...</article>

<!-- 상태 묶기: hover와 focus-visible에 같은 스타일 -->
<a class="[&:is(:hover,:focus-visible)]:underline">링크</a>`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>관대한 선택자 목록</H3>
        <Demo hint="두 규칙 모두 존재하지 않는 가상 클래스 :wat을 섞었습니다. 실제 이 페이지에 적용된 CSS예요.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={ui.box}>
              <code className="block font-mono text-xs">{'.fg-a, .fg-b:wat { color: red }'}</code>
              <p className="fg-a mt-2 text-sm">.fg-a 요소</p>
              <p className={`mt-2 text-sm ${ui.bad}`}>규칙 전체가 무시되어 색이 안 바뀝니다.</p>
            </div>
            <div className={ui.box}>
              <code className="block font-mono text-xs">{':is(.fg-c, .fg-d:wat) { color: green }'}</code>
              <p className="fg-c mt-2 text-sm">.fg-c 요소</p>
              <p className={`mt-2 text-sm ${ui.good}`}>틀린 .fg-d:wat만 무시되고 .fg-c는 초록색이 됩니다.</p>
            </div>
          </div>
        </Demo>

        <H3>선택자 놀이터</H3>
        <SelectorPlayground
          presets={[
            { sel: ':is(header, footer) a', note: 'header나 footer 안의 링크만. main 안의 링크는 빠진다.' },
            { sel: ':is(header, main, footer) h2', note: '어느 영역이든 h2. 여기서는 header에 h2가 없어서 main, footer의 h2만.' },
            { sel: '.card :is(h2, p)', note: '카드 안의 제목과 본문.' },
            { sel: 'a:is(.active, .disabled)', note: '상태 클래스가 있는 링크만.' },
            { sel: ':is(#none, .list) li', note: '#none은 없지만 .list로 맞았다. 그래도 우선순위는 id 기준 (1, 0, 1).' },
          ]}
        />
      </Section>
    </>
  );
}

const GROUP_A = ['article', 'aside', 'footer'];
const GROUP_B = ['h2', 'h3'];

function ExpansionViz() {
  const [a, setA] = useState(GROUP_A);
  const [b, setB] = useState(GROUP_B);
  const toggle = (list, set, v) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const expanded = a.flatMap((x) => b.map((y) => `${x} ${y} a`));
  const Chip = ({ on, onClick, children }) => (
    <button onClick={onClick} className={`${on ? ui.btnPrimary : ui.btn} px-2.5 py-1 font-mono text-xs`}>{children}</button>
  );
  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className={ui.muted}>그룹 1</span>
        {GROUP_A.map((v) => <Chip key={v} on={a.includes(v)} onClick={() => toggle(a, setA, v)}>{v}</Chip>)}
        <span className={`ml-3 ${ui.muted}`}>그룹 2</span>
        {GROUP_B.map((v) => <Chip key={v} on={b.includes(v)} onClick={() => toggle(b, setB, v)}>{v}</Chip>)}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className={`mb-1 text-xs ${ui.muted}`}>:is() 한 줄</div>
          <pre className="rounded-lg bg-[#1e1f24] p-3 font-mono text-xs text-zinc-200">
            {a.length && b.length ? `:is(${a.join(', ')}) :is(${b.join(', ')}) a` : '(그룹이 비어 있어요)'}
          </pre>
        </div>
        <div>
          <div className={`mb-1 text-xs ${ui.muted}`}>쉼표로 풀면 {expanded.length}줄</div>
          <pre key={expanded.length} className="animate-flash rounded-lg bg-[#1e1f24] p-3 font-mono text-xs text-zinc-200">
            {expanded.length ? expanded.join(',\n') : '-'}
          </pre>
        </div>
      </div>
    </Viz>
  );
}
