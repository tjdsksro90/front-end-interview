import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, ui,
} from '../components/kit.jsx';

const DEMO_CSS = `
.ap-btn { anchor-name: --ap-btn; }
.ap-menu {
  position-anchor: --ap-btn;
  inset: auto; margin: 0;                 /* popover 기본값(화면 가운데)을 지우고 */
  position-try-fallbacks: flip-block, flip-inline;
  border-width: 1px; border-radius: 12px; padding: 6px; min-width: 160px;
  box-shadow: 0 10px 30px rgb(0 0 0 / .12);
}
.ap-menu[data-area="bottom"] { position-area: bottom; margin-top: 6px; }
.ap-menu[data-area="top"] { position-area: top; margin-bottom: 6px; }
.ap-menu[data-area="right"] { position-area: right; margin-left: 6px; }
.ap-menu[data-area="left"] { position-area: left; margin-right: 6px; }
.ap-menu[data-area="bottom span-right"] { position-area: bottom span-right; margin-top: 6px; }
.ap-flip-btn { anchor-name: --ap-flip; }
.ap-tip {
  position-anchor: --ap-flip;
  inset: auto; margin: 0 0 6px;
  position-area: top;
  position-try-fallbacks: flip-block;   /* 위에 공간이 없으면 아래로 */
  border: 0; border-radius: 8px; padding: 6px 10px; font-size: 13px;
  background: rgb(24 24 27); color: white;
}
.ap-menu:popover-open { animation: ap-in .15s ease-out; }
@keyframes ap-in { from { opacity: 0; transform: translateY(-4px); } }
`;

const anchorSupported = typeof CSS !== 'undefined' && CSS.supports('anchor-name: --a');
const popoverSupported = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;

export default function AnchorPopover() {
  return (
    <>
      <style>{DEMO_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          <u>Popover API</u>는 HTML 속성만으로 메뉴·툴팁 같은 "떠 있는 UI"를 만들고(열기·닫기, 바깥 클릭·Esc로 닫기, 맨 위 층에 띄우기를 브라우저가 처리),
          <u>Anchor Positioning</u>은 그 UI를 <u>특정 요소(anchor) 옆에 붙이고, 공간이 없으면 반대쪽으로 뒤집는</u> CSS입니다. 둘을 합치면 Floating UI 같은 라이브러리가 하던 일을 대부분 대신합니다.
        </OneLiner>

        <H3>Popover API</H3>
        <List
          items={[
            <><Code>&lt;div id="menu" popover&gt;</Code> + <Code>&lt;button popovertarget="menu"&gt;</Code> → 버튼을 누르면 열리고 닫힌다. JS가 필요 없다.</>,
            <><b>top layer</b>에 뜬다. 부모에 <Code>overflow: hidden</Code>이나 z-index가 있어도 잘리거나 가려지지 않는다.</>,
            <><Code>popover</Code>(=auto): 바깥 클릭·Esc로 닫히고, 다른 auto 팝오버를 열면 이전 것은 닫힌다. <Code>popover="manual"</Code>: 직접 닫아야 한다(토스트 등).</>,
            <>열린 상태는 <Code>:popover-open</Code>으로 스타일을 주고, JS에서는 <Code>showPopover()</Code>, <Code>hidePopover()</Code>, <Code>togglePopover()</Code>.</>,
          ]}
        />

        <H3>Anchor Positioning</H3>
        <List
          items={[
            <>기준 요소에 이름을 붙인다: <Code>anchor-name: --btn</Code></>,
            <>붙일 요소에서 그 이름을 쓴다: <Code>position-anchor: --btn</Code> + <Code>position-area: bottom</Code>(버튼 아래) 또는 <Code>top: anchor(bottom)</Code>처럼 직접 지정</>,
            <><Code>position-try-fallbacks: flip-block</Code> → 아래에 공간이 없으면 위로 뒤집는다. 예전엔 JS로 화면 끝을 계산했다.</>,
          ]}
        />

        <Table
          head={['', '예전 (JS 라이브러리)', '지금 (HTML + CSS)']}
          rows={[
            ['열기·닫기 상태', 'useState(open)', <><Code>popover</Code> 속성</>],
            ['바깥 클릭·Esc로 닫기', 'document 이벤트 리스너 직접 등록', '기본 동작'],
            ['다른 요소에 가려지지 않게', 'Portal로 body에 렌더 + z-index', 'top layer'],
            ['버튼 옆에 위치', 'getBoundingClientRect로 좌표 계산', <><Code>position-area</Code></>],
            ['화면 끝에서 뒤집기', 'Floating UI의 flip 미들웨어', <><Code>position-try-fallbacks</Code></>],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>드롭다운 메뉴, 더보기(...) 메뉴</b>, 프로필 메뉴</>,
            <><b>툴팁, 안내 말풍선</b> — 기준 요소 옆에 붙고 화면 끝에서 뒤집혀야 하는 것</>,
            <><b>토스트 알림</b> — <Code>popover="manual"</Code>로 top layer에 띄우기</>,
            '라이브러리를 줄이고 싶을 때 — Floating UI, Radix Popover 의존성 없이',
          ]}
          avoid={[
            <>사용자가 반드시 응답해야 하는 창 — 그건 <Code>&lt;dialog&gt;</Code>의 <Code>showModal()</Code> (뒤 화면 조작을 막는 모달)</>,
            '구형 브라우저를 꼭 지원해야 하는 서비스 — Anchor Positioning은 아직 지원 브라우저가 갈리므로 fallback 위치를 함께 둔다',
            '복잡한 콤보박스(검색 + 키보드 탐색 + 가상 스크롤) — 위치는 CSS로 해도, 접근성 키보드 처리는 여전히 직접 또는 라이브러리로',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"Popover API로 열기·닫기·바깥 클릭·top layer를 브라우저에 맡기고, Anchor Positioning으로 위치와 뒤집기까지 CSS로 처리해서, 드롭다운에 쓰던 상태·이벤트 리스너·좌표 계산 코드를 없앴다"고 말할 수 있어요.</p>
          <p>Popover는 2024년부터 모든 주요 브라우저가 지원합니다. Anchor Positioning은 Chrome·Edge 125+, Safari 26이 지원하고 Firefox는 확인이 필요합니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p><Code>position-area</Code>는 기준 요소를 가운데에 둔 <b>3×3 격자</b>로 생각하면 쉽습니다. 칸을 누르면 그 위치의 값이 나옵니다.</p>
        <AreaViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'useState + Floating UI',
            code: `
function Menu() {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles } = useFloating({
    open,
    placement: 'bottom',
    middleware: [offset(6), flip()],
    whileElementsMounted: autoUpdate,
  });
  useDismiss(...);   // 바깥 클릭, Esc

  return (
    <>
      <button ref={refs.setReference} onClick={() => setOpen(!open)}>메뉴</button>
      {open && (
        <FloatingPortal>
          <ul ref={refs.setFloating} style={floatingStyles}>...</ul>
        </FloatingPortal>
      )}
    </>
  );
}`,
            note: '상태, 위치 계산, 스크롤·리사이즈 추적, Portal, 닫기 이벤트를 모두 코드로 관리한다.',
          }}
          after={{
            label: 'Popover + Anchor Positioning',
            code: `
function Menu() {
  return (
    <>
      <button className="menu-btn" popoverTarget="menu">메뉴</button>
      <ul id="menu" popover="auto" className="menu">...</ul>
    </>
  );
}

/* CSS */
.menu-btn { anchor-name: --menu-btn; }
.menu {
  position-anchor: --menu-btn;
  inset: auto;                      /* popover 기본 위치(가운데) 해제 */
  margin: 6px 0 0;
  position-area: bottom;
  position-try-fallbacks: flip-block;
}`,
            note: '상태도, 이벤트 리스너도, 좌표 계산도 없다. React 19는 popover·popoverTarget 속성을 그대로 지원한다.',
          }}
        />

        <H3>JS에서 직접 열고 닫기</H3>
        <CodeBlock
          code={`
const toast = document.getElementById('toast');   // <div id="toast" popover="manual">
toast.showPopover();
setTimeout(() => toast.hidePopover(), 3000);

toast.addEventListener('toggle', (e) => {
  console.log(e.newState);   // 'open' | 'closed'
});`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        {(!anchorSupported || !popoverSupported) && (
          <Callout type="warn" title="이 브라우저는 일부 기능을 지원하지 않아요">
            <p>Popover: {popoverSupported ? '지원' : '미지원'} · Anchor Positioning: {anchorSupported ? '지원' : '미지원'}. Anchor를 지원하지 않으면 메뉴가 기준 버튼 옆이 아닌 다른 위치에 뜹니다.</p>
          </Callout>
        )}
        <H3>A. 드롭다운 메뉴 (JS 0줄)</H3>
        <MenuDemo />
        <H3>B. 화면 끝에서 뒤집히는 툴팁</H3>
        <FlipDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const ROWS = ['top', 'center', 'bottom'];
const COLS = ['left', 'center', 'right'];

function areaName(r, c) {
  if (r === 'center' && c === 'center') return null; // 기준 요소 자리
  if (r === 'center') return c;
  if (c === 'center') return r;
  return `${r} ${c}`;
}

function AreaViz() {
  const [cell, setCell] = useState(['bottom', 'center']);
  const name = areaName(...cell);
  return (
    <Viz>
      <div className="flex min-w-[460px] flex-wrap items-center gap-8">
        <div className="grid grid-cols-3 gap-1.5">
          {ROWS.flatMap((r) =>
            COLS.map((c) => {
              const n = areaName(r, c);
              const active = cell[0] === r && cell[1] === c;
              return n ? (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setCell([r, c])}
                  className={`h-16 w-24 rounded-lg border-2 font-mono text-[11px] transition ${active ? 'border-amber-400 bg-amber-100 font-bold dark:bg-amber-500/20' : 'border-dashed border-zinc-300 hover:border-zinc-400 dark:border-zinc-700'}`}
                >
                  {n}
                </button>
              ) : (
                <div key="anchor" className="grid h-16 w-24 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">anchor</div>
              );
            })
          )}
        </div>
        <div className="space-y-2">
          <CodeBlock code={`.tooltip {\n  position-anchor: --btn;\n  position-area: ${name};\n}`} />
          <p className={`text-sm ${ui.muted}`}>
            <code className="font-mono">span-right</code>, <code className="font-mono">span-all</code> 같은 값을 쓰면 여러 칸에 걸치게 할 수 있어요. (예: <code className="font-mono">bottom span-right</code> → 왼쪽 정렬된 드롭다운)
          </p>
        </div>
      </div>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const AREAS = ['bottom', 'bottom span-right', 'top', 'right', 'left'];

function MenuDemo() {
  const [area, setArea] = useState('bottom');
  return (
    <Demo hint="메뉴 버튼을 눌러 보세요. 바깥을 클릭하거나 Esc를 누르면 닫힙니다. 이 동작은 useState나 이벤트 리스너 없이 HTML popover 속성만으로 동작합니다. 위치를 바꿔 다시 열어 보세요.">
      <Segmented value={area} onChange={setArea} options={AREAS.map((a) => ({ value: a, label: a }))} />
      <div className="mt-6 grid place-items-center py-16">
        <button className={`ap-btn ${ui.btnPrimary}`} popoverTarget="ap-menu">메뉴 열기</button>
        <div id="ap-menu" popover="auto" className="ap-menu border-zinc-200 bg-white text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" data-area={area}>
          {['프로필', '설정', '로그아웃'].map((m) => (
            <button
              key={m}
              popoverTarget="ap-menu"
              popoverTargetAction="hide"
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <code className="block font-mono text-xs text-zinc-400">position-area: {area}; position-try-fallbacks: flip-block, flip-inline;</code>
    </Demo>
  );
}

function FlipDemo() {
  return (
    <Demo hint="'툴팁 띄우기'를 누른 뒤 페이지를 스크롤해서 버튼을 화면 맨 위 가장자리로 올려 보세요. 위에 공간이 없어지면 툴팁이 버튼 아래로 뒤집힙니다. (popover='manual'이라 바깥을 클릭해도 닫히지 않아요)">
      <div className="flex flex-wrap items-center gap-3">
        <button className={`ap-flip-btn ${ui.btnPrimary}`} popoverTarget="ap-tip" popoverTargetAction="toggle">툴팁 띄우기 / 닫기</button>
        <span className={`text-sm ${ui.muted}`}>position-area: top + position-try-fallbacks: flip-block</span>
      </div>
      <div id="ap-tip" popover="manual" className="ap-tip">위에 공간이 없으면 아래로 내려가요</div>
    </Demo>
  );
}
