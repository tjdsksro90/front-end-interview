import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare, Demo, Viz, Segmented, ui } from '../components/kit.jsx';
import { SelectorPlayground, SpecificityBattle } from './SelectorPlayground.jsx';
import { format, specificity } from './specificity.js';

const linkCls = 'text-indigo-600 dark:text-indigo-400';
const BASE = '/css/19-is-where-has-not/deep';

export default function WhereSelector() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          <Code>:where()</Code>는 <Link className={linkCls} to={`${BASE}/is-selector`}>:is()</Link>와 <u>똑같이 "괄호 안 중 하나라도 맞으면" 선택</u>하지만,
          <u> 우선순위가 항상 0</u>입니다. 그래서 <u>나중에 클래스 하나로 쉽게 덮어쓸 수 있는 기본 스타일</u>을 만들 때 씁니다.
        </OneLiner>

        <H3>:is()와 비교</H3>
        <Table
          head={['선택자', '고르는 요소', ':is() 우선순위', ':where() 우선순위']}
          rows={[
            [<Code>(ul, ol)</Code>, 'ul 또는 ol', '(0, 0, 1)', '(0, 0, 0)'],
            [<Code>(.btn, .link)</Code>, '.btn 또는 .link', '(0, 1, 0)', '(0, 0, 0)'],
            [<Code>(#app, main) p</Code>, '#app이나 main 안의 p', '(1, 0, 1)', <>(0, 0, 1) — 바깥의 <Code>p</Code>만 센다</>],
          ]}
        />

        <H3>우선순위 0이 왜 좋은가</H3>
        <List
          items={[
            <>라이브러리·리셋 CSS가 <Code>.btn.primary</Code>처럼 강하게 쓰면, 사용자는 <b>더 강한 선택자</b>나 <Code>!important</Code>로 싸워야 한다.</>,
            <><Code>:where()</Code>로 감싸 두면 기본값은 주되, 사용자가 <b>클래스 하나</b>만 써도 덮어쓴다.</>,
            <>바깥에 붙은 부분은 그대로 센다: <Code>:where(.card) h2</Code>는 (0, 0, 1). 0이 되는 건 괄호 안뿐이다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>리셋·기본 스타일</b>: <Code>{":where(ul, ol)[role='list'] { list-style: none }"}</Code></>,
            <><b>디자인 시스템·라이브러리의 기본값</b>: 사용하는 쪽이 쉽게 덮어쓰도록</>,
            <><b>Nesting 부모 우선순위 낮추기</b>: <Code>:where(#sidebar) a</Code>처럼 id가 섞여도 가볍게</>,
            <><b><Code>:not()</Code> 우선순위 낮추기</b>: <Code>:not(:where(.a, #b))</Code></>,
          ]}
          avoid={[
            '반드시 적용되어야 하는 스타일 — 다른 규칙에 쉽게 져서 의도와 다르게 덮일 수 있다',
            '앱 코드 전체를 :where()로 감싸기 — 우선순위가 다 0이면 순서에만 의존하게 되어 오히려 헷갈린다',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>":where()는 :is()와 같은 요소를 고르지만 우선순위가 0이라서, 리셋이나 라이브러리 기본 스타일에 쓰면 사용자가 클래스 하나로 덮어쓸 수 있다."</p>
          <p>Cascade Layers(<Code>@layer</Code>)도 같은 문제(기본 스타일이 너무 강함)를 해결하는데, 레이어는 파일·영역 단위, <Code>:where()</Code>는 선택자 단위입니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>괄호 안에 무엇을 넣어도 <Code>:where()</Code> 부분은 0입니다. 넣을 선택자를 바꿔 보세요.</p>
        <CompareViz />

        <H3>사용자 클래스가 이기는가?</H3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={`mb-2 text-sm font-semibold ${ui.bad}`}>라이브러리가 :is()로 썼을 때</p>
            <SpecificityBattle
              rules={[
                { sel: ':is(.btn).primary', decl: 'background: gray' },
                { sel: '.my-button', decl: 'background: royalblue' },
              ]}
            />
          </div>
          <div>
            <p className={`mb-2 text-sm font-semibold ${ui.good}`}>라이브러리가 :where()로 썼을 때</p>
            <SpecificityBattle
              rules={[
                { sel: ':where(.btn.primary)', decl: 'background: gray' },
                { sel: '.my-button', decl: 'background: royalblue' },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '일반 선택자로 쓴 기본 스타일',
            code: `
/* 라이브러리 */
.btn.primary { background: gray; }       /* (0, 2, 0) */
ul[role='list'] { padding: 0; }          /* (0, 1, 1) */

/* 사용자: 안 바뀐다 */
.my-button { background: royalblue; }    /* (0, 1, 0) < (0, 2, 0) */

/* 이기려면 */
.my-button.my-button { ... }             /* 같은 클래스 두 번 */
.my-button { background: royalblue !important; }`,
            note: '기본 스타일이 강하면 사용자가 우선순위 싸움을 해야 한다.',
          }}
          after={{
            label: ':where()로 쓴 기본 스타일',
            code: `
/* 라이브러리 */
:where(.btn.primary) { background: gray; }       /* (0, 0, 0) */
:where(ul, ol)[role='list'] { padding: 0; }      /* (0, 1, 0) — 바깥 [role]만 */

/* 사용자: 클래스 하나로 끝 */
.my-button { background: royalblue; }            /* (0, 1, 0) > 0 */`,
            note: '기본값은 그대로 주면서, 덮어쓰기는 쉽다.',
          }}
        />

        <H3>자주 쓰는 리셋 패턴</H3>
        <CodeBlock
          code={`
/* 목록 스타일 제거 (role="list"를 붙인 것만 — 접근성 유지) */
:where(ul, ol)[role='list'] { list-style: none; margin: 0; padding: 0; }

/* 이미지·미디어 기본값 */
:where(img, picture, video, canvas, svg) { display: block; max-width: 100%; }

/* 폼 요소가 글꼴을 물려받게 */
:where(input, button, textarea, select) { font: inherit; }

/* 마크다운 본문의 기본 간격 — 컴포넌트에서 쉽게 덮어쓰기 */
.prose :where(p, ul, ol) { margin-block: 1em; }`}
        />

        <H3>이 사이트에서도 쓰고 있어요</H3>
        <p>
          다크 모드 Tailwind variant를 <Code>{'@custom-variant dark (&:where(.dark, .dark *));'}</Code>로 정의했습니다. <Code>.dark</Code> 클래스가 붙어도
          <Code>dark:</Code> 클래스의 우선순위가 올라가지 않아서, 일반 클래스와 같은 규칙으로 순서만으로 덮어쓰기가 정해져요.
        </p>
      </Section>

      <Section step={4} title="직접 해보기">
        <LibraryDemo />
        <H3>선택자 놀이터</H3>
        <p className={`text-sm ${ui.muted}`}>고르는 요소는 :is()와 같고, 아래 우선순위 숫자만 달라지는 걸 확인해 보세요.</p>
        <SelectorPlayground
          presets={[
            { sel: ':where(header, footer) a', note: ':is() 버전과 같은 링크를 고르지만 우선순위는 바깥 a만 센 (0, 0, 1).' },
            { sel: ':is(header, footer) a', note: '같은 요소, 우선순위 (0, 0, 2).' },
            { sel: ':where(#none, .list) li', note: 'id가 있어도 0. :is()였다면 (1, 0, 1).' },
            { sel: ':where(.card) :where(h2, p)', note: '전부 괄호 안이라 (0, 0, 0). 어떤 규칙에도 진다.' },
            { sel: 'a:not(:where(.active, .disabled))', note: ':not()의 우선순위를 낮추는 패턴. (0, 0, 1)' },
          ]}
        />
      </Section>
    </>
  );
}

const INNER = ['.btn', '.btn.primary', '#app .btn', 'nav > .btn:hover'];

function CompareViz() {
  const [inner, setInner] = useState(INNER[1]);
  const isV = specificity(`:is(${inner})`);
  const whereV = specificity(`:where(${inner})`);
  return (
    <Viz>
      <Segmented value={inner} onChange={setInner} options={INNER.map((v) => ({ value: v, label: v }))} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          [`:is(${inner})`, isV, ui.bad],
          [`:where(${inner})`, whereV, ui.good],
        ].map(([sel, v, tone]) => (
          <div key={sel} className={ui.box}>
            <code className="font-mono text-sm">{sel}</code>
            <div className={`mt-2 font-mono text-2xl font-bold tabular-nums ${tone}`}>{format(v)}</div>
            <div className="mt-2 flex gap-1">
              {['id', 'class', '태그'].map((label, i) => (
                <div key={label} className="flex-1 rounded bg-zinc-50 px-2 py-1 text-center text-xs dark:bg-zinc-800/60">
                  <div className="font-bold tabular-nums">{v[i]}</div>
                  <div className="text-zinc-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Viz>
  );
}

// 실제 CSS를 넣어서 라이브러리 기본 스타일을 사용자 클래스가 덮어쓰는지 확인
function LibraryDemo() {
  const [mode, setMode] = useState('is');
  const libSel = mode === 'is' ? '.wd-lib:is(.btn.primary)' : ':where(.wd-lib.btn.primary)';
  const css = `
${libSel} { background: rgb(113 113 122); color: white; padding: 8px 16px; border-radius: 10px; }
.wd-mine { background: rgb(65 105 225); }`;
  return (
    <Demo hint="라이브러리 CSS를 :is()와 :where()로 바꿔 보세요. 사용자 클래스 .wd-mine(파란색)이 적용되는지 실제 CSS로 확인합니다.">
      <style>{css}</style>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'is', label: '라이브러리: :is() (우선순위 유지)' },
          { value: 'where', label: '라이브러리: :where() (우선순위 0)' },
        ]}
      />
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-2">
        <pre className="overflow-x-auto rounded-lg bg-[#1e1f24] p-3 font-mono text-xs text-zinc-200">
          {`/* 라이브러리 */\n${libSel} {\n  background: gray;\n}   /* ${format(specificity(libSel))} */\n\n/* 내 코드 */\n.wd-mine {\n  background: royalblue;\n}   /* (0, 1, 0) */`}
        </pre>
        <div className="text-center">
          <button type="button" className="wd-lib btn primary wd-mine font-semibold">결제하기</button>
          <p className={`mt-3 text-sm ${mode === 'is' ? ui.bad : ui.good}`}>
            {mode === 'is' ? '회색: 라이브러리 (0, 3, 0)이 내 클래스 (0, 1, 0)를 이겼어요.' : '파란색: 라이브러리가 0이라 내 클래스가 이겼어요.'}
          </p>
        </div>
      </div>
    </Demo>
  );
}
