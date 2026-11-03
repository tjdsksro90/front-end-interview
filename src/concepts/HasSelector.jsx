import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, RenderBadge, useRenderCount, ui,
} from '../components/kit.jsx';

const DEMO_CSS = `
.has-option { border: 2px solid transparent; transition: border-color .15s, background .15s; }
.has-option:has(input:checked) { border-color: rgb(99 102 241); background: rgb(99 102 241 / .08); }
.has-extra { display: none; }
.has-form:has(#has-other:checked) .has-extra { display: grid; }
.has-field:has(input:user-invalid) { color: rgb(225 29 72); }
.has-field:has(input:user-invalid) input { border-color: rgb(225 29 72); }
.has-form:has(input:user-invalid) .has-submit { opacity: .4; pointer-events: none; }
.has-gallery:has(.has-photo:hover) .has-photo:not(:hover) { opacity: .35; scale: .97; }
.has-photo { transition: opacity .2s, scale .2s; }
`;

export default function HasSelector() {
  return (
    <>
      <style>{DEMO_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          <Code>:has()</Code>는 <u>"이런 자식(또는 뒤에 오는 형제)을 가진 요소"를 선택</u>하는 선택자입니다.
          CSS는 원래 부모 방향으로 선택할 수 없었는데, <Code>:has()</Code> 덕분에 <u>자식의 상태에 따라 부모나 형제를 꾸밀 수 있게</u> 됐습니다.
        </OneLiner>

        <H3>읽는 법</H3>
        <Table
          head={['선택자', '뜻']}
          rows={[
            [<Code>.card:has(img)</Code>, '안에 img가 있는 .card'],
            [<Code>.option:has(input:checked)</Code>, '안의 체크박스가 체크된 .option'],
            [<Code>form:has(:user-invalid)</Code>, '잘못 입력된 칸이 하나라도 있는 form'],
            [<Code>h2:has(+ p)</Code>, '바로 뒤에 p가 오는 h2 (형제 방향)'],
            [<Code>body:has(dialog[open])</Code>, '열린 dialog가 있는 페이지 → 배경 스크롤 막기'],
            [<Code>.list:not(:has(li))</Code>, '항목이 하나도 없는 목록 → 빈 상태 표시'],
          ]}
        />

        <H3>왜 "부모 선택자"라고 부르나?</H3>
        <List
          items={[
            <>CSS 선택자는 항상 <b>위에서 아래로</b>만 내려갔다. <Code>.card img</Code>는 카드 안의 img를 고를 뿐, "img가 있는 카드"는 고를 수 없었다.</>,
            <>그래서 자식 상태에 따라 부모를 바꾸려면 <b>JS로 상태를 읽어서 부모에 클래스를 붙여야</b> 했다. (<Code>{'className={checked ? "selected" : ""}'}</Code>)</>,
            <><Code>:has()</Code>는 조건을 괄호 안에 넣어서, 바깥 요소를 선택하게 해준다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>선택된 카드·옵션 강조</b>: 라디오/체크박스가 체크된 항목의 테두리 바꾸기</>,
            <><b>폼 상태 표시</b>: 잘못된 입력이 있는 필드의 라벨을 빨갛게, 제출 버튼 흐리게</>,
            <><b>조건부 영역 보이기</b>: "다른 배송지" 체크 시 주소 입력칸 펼치기 (단순한 경우)</>,
            <><b>내용에 따른 레이아웃</b>: 이미지가 있는 카드와 없는 카드의 여백을 다르게</>,
          ]}
          avoid={[
            '데이터나 로직에 영향을 주는 상태 — 보이는 것만 바꾸는 용도로. 폼 값 검증 자체는 JS나 HTML 속성으로',
            <><Code>body:has(...)</Code>처럼 넓은 범위에 자주 바뀌는 조건 — 브라우저가 매번 넓은 범위를 다시 계산해야 해서 무거울 수 있다</>,
            <><Code>:has()</Code> 안에 <Code>:has()</Code> 중첩 — 허용되지 않는다</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"<Code>:has()</Code>는 부모 선택자 역할을 해서, 자식의 상태(체크, 유효성, 존재 여부)에 따라 부모 스타일을 바꿀 수 있다. 예전엔 JS로 상태를 읽어 클래스를 붙였는데, 순수하게 보이는 것만 바뀌는 경우는 CSS만으로 해결해서 리렌더도 줄었다."</p>
          <p>2023년 12월부터 모든 주요 브라우저가 지원합니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>선택자를 고르면, 아래 트리에서 그 선택자가 <b>실제로 고르는 요소</b>가 강조됩니다. 괄호 안 조건은 자식을 검사하지만, 선택되는 건 바깥 요소입니다.</p>
        <HasViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'JS로 부모에 클래스',
            code: `
function Option({ label }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className={checked ? 'option selected' : 'option'}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
      {label}
    </label>
  );
}

/* CSS */
.option.selected { border-color: blue; }`,
            note: '스타일만 바꾸려고 state를 만들고, 체크할 때마다 컴포넌트가 리렌더된다.',
          }}
          after={{
            label: ':has()',
            code: `
function Option({ label }) {
  return (
    <label className="option">
      <input type="checkbox" />
      {label}
    </label>
  );
}

/* CSS */
.option:has(input:checked) { border-color: blue; }`,
            note: 'state도 리렌더도 없다. 체크 상태는 브라우저가 알고 있고, CSS가 그걸 보고 꾸민다.',
          }}
        />

        <H3>폼에서 많이 쓰는 패턴</H3>
        <CodeBlock
          code={`
/* 잘못 입력한 필드의 라벨까지 빨갛게 */
.field:has(input:user-invalid) label { color: red; }

/* 폼에 잘못된 칸이 있으면 제출 버튼 흐리게 */
form:has(:user-invalid) button[type="submit"] { opacity: 0.4; }

/* "다른 배송지" 체크 시 주소칸 보이기 */
.address { display: none; }
form:has(#other-address:checked) .address { display: block; }

/* 모달이 열려 있으면 뒤 페이지 스크롤 막기 */
body:has(dialog[open]) { overflow: hidden; }`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <HasDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const TREE = [
  { id: 'card1', label: '.card', children: [{ id: 'img1', label: 'img' }, { id: 'p1', label: 'p' }] },
  { id: 'card2', label: '.card', children: [{ id: 'p2', label: 'p' }] },
  { id: 'card3', label: '.card', children: [{ id: 'img3', label: 'img' }, { id: 'btn3', label: 'button' }] },
];

const SELECTORS = [
  { sel: '.card img', picks: ['img1', 'img3'], checks: [], note: '예전 방식: 카드 안의 img를 고른다 (아래 방향).' },
  { sel: '.card:has(img)', picks: ['card1', 'card3'], checks: ['img1', 'img3'], note: 'img를 가진 카드를 고른다. img는 조건 검사에만 쓰이고, 꾸며지는 건 카드.' },
  { sel: '.card:not(:has(img))', picks: ['card2'], checks: [], note: 'img가 없는 카드만. 빈 상태·대체 레이아웃에 유용.' },
  { sel: '.card:has(button)', picks: ['card3'], checks: ['btn3'], note: '버튼이 있는 카드만 하단 여백을 늘리는 식으로 쓴다.' },
];

function HasViz() {
  const [i, setI] = useState(1);
  const s = SELECTORS[i];
  const cls = (id) =>
    s.picks.includes(id)
      ? 'border-amber-400 bg-amber-50 font-bold dark:bg-amber-500/10'
      : s.checks.includes(id)
        ? 'border-dashed border-sky-400'
        : 'border-zinc-200 dark:border-zinc-700';
  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        {SELECTORS.map((x, n) => (
          <button key={x.sel} className={`${n === i ? ui.btnPrimary : ui.btn} font-mono`} onClick={() => setI(n)}>{x.sel}</button>
        ))}
      </div>
      <div className="mt-5 flex min-w-[460px] justify-center gap-4">
        {TREE.map((card) => (
          <div key={`${card.id}${i}`} className={`animate-flash rounded-xl border-2 p-3 text-center ${cls(card.id)}`}>
            <div className="font-mono text-sm">{card.label}</div>
            <div className="mt-2 flex gap-2">
              {card.children.map((c) => (
                <span key={c.id} className={`rounded-lg border-2 px-2 py-1 font-mono text-xs ${cls(c.id)}`}>{c.label}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Legend items={[['bg-amber-300', '선택되는 요소 (스타일이 적용됨)'], ['border-2 border-dashed border-sky-400', '조건 검사에 쓰인 자식']]} />
      <p className={`mt-3 text-sm ${ui.muted}`}>→ {s.note}</p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

function HasDemo() {
  return (
    <Demo hint="왼쪽은 useState로 클래스를 붙이는 방식, 오른쪽은 :has()만 쓴 방식입니다. 옵션을 체크할 때 렌더 횟수를 비교해 보세요.">
      <div className="grid gap-4 lg:grid-cols-2">
        <StateOptions />
        <HasOptions />
      </div>
      <H3>폼 상태 (전부 CSS)</H3>
      <HasForm />
      <H3>갤러리: 하나에 마우스를 올리면 나머지가 흐려짐</H3>
      <div className="has-gallery mt-2 flex gap-2">
        {['from-rose-400 to-orange-300', 'from-sky-400 to-indigo-400', 'from-emerald-400 to-teal-300', 'from-violet-400 to-fuchsia-400'].map((g) => (
          <div key={g} className={`has-photo h-20 flex-1 rounded-xl bg-gradient-to-br ${g}`} />
        ))}
      </div>
      <code className="mt-2 block font-mono text-xs text-zinc-400">.gallery:has(.photo:hover) .photo:not(:hover) {'{ opacity: .35 }'}</code>
    </Demo>
  );
}

const OPTIONS = ['포장 추가', '빠른 배송', '선물 메시지'];

function StateOptions() {
  const renders = useRenderCount();
  const [checked, setChecked] = useState({});
  return (
    <div className={ui.box}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">useState + className</span>
        <RenderBadge count={renders} />
      </div>
      <div className="mt-3 space-y-2">
        {OPTIONS.map((o) => (
          <label
            key={o}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm ${checked[o] ? 'border-indigo-500 bg-indigo-500/10' : 'border-transparent'}`}
          >
            <input type="checkbox" checked={!!checked[o]} onChange={(e) => setChecked((c) => ({ ...c, [o]: e.target.checked }))} />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function HasOptions() {
  const renders = useRenderCount();
  return (
    <div className={ui.box}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">:has(input:checked)</span>
        <RenderBadge count={renders} />
      </div>
      <div className="mt-3 space-y-2">
        {OPTIONS.map((o) => (
          <label key={o} className="has-option flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <input type="checkbox" />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

function HasForm() {
  return (
    <form className={`has-form ${ui.box} mt-2 max-w-md space-y-3`} onSubmit={(e) => e.preventDefault()} noValidate>
      <label className="has-field block text-sm font-semibold">
        이메일 (잘못 입력하고 칸을 벗어나 보세요)
        <input type="email" required className={`${ui.input} mt-1 w-full font-normal`} placeholder="me@example.com" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input id="has-other" type="checkbox" /> 다른 배송지로 받기
      </label>
      <div className="has-extra gap-2">
        <input className={ui.input} placeholder="받는 사람" aria-label="받는 사람" />
        <input className={ui.input} placeholder="주소" aria-label="주소" />
      </div>
      <button className={`has-submit ${ui.btnPrimary}`}>주문하기</button>
    </form>
  );
}
