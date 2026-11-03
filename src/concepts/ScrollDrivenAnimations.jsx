import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, RenderBadge, useRenderCount, ui,
} from '../components/kit.jsx';

const DEMO_CSS = `
@keyframes sda-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes sda-reveal { from { opacity: 0; transform: translateY(24px) scale(.96); } to { opacity: 1; transform: none; } }
.sda-progress { transform-origin: left; animation: sda-grow linear both; animation-timeline: scroll(nearest block); }
.sda-item { animation: sda-reveal linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; }
`;

const supported = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');

export default function ScrollDrivenAnimations() {
  return (
    <>
      <style>{DEMO_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          Scroll-driven Animations는 <u>애니메이션의 진행을 시간 대신 스크롤 위치에 연결</u>하는 기능입니다.
          <Code>animation-timeline: scroll()</Code>이면 스크롤 0~100%가, <Code>view()</Code>면 요소가 화면에 들어오고 나가는 정도가 애니메이션 0~100%가 됩니다. <u>scroll 이벤트 JS 없이</u> 읽기 진행률 바나 등장 효과를 만듭니다.
        </OneLiner>

        <H3>두 가지 타임라인</H3>
        <Table
          head={['', 'scroll()', 'view()']}
          rows={[
            ['무엇에 연결?', '스크롤 컨테이너의 스크롤 진행률', '이 요소가 스크롤 영역(보이는 영역)에 보이는 정도'],
            ['0%', '맨 위', '요소가 아래에서 막 들어오기 시작'],
            ['100%', '맨 아래', '요소가 위로 완전히 빠져나감'],
            ['예', '읽기 진행률 바, 헤더 축소', '스크롤하면 카드가 나타나기, 이미지 패럴랙스'],
          ]}
        />

        <H3>알아야 할 것</H3>
        <List
          items={[
            <><Code>animation-range: entry 0% cover 30%</Code>로 "요소가 들어오기 시작할 때부터 30% 보일 때까지"처럼 구간을 정한다. 구간 이름: <Code>entry</Code>(들어옴), <Code>exit</Code>(나감), <Code>contain</Code>(완전히 보임), <Code>cover</Code>(조금이라도 보이는 전체 구간)</>,
            <><Code>animation</Code> 단축 속성이 <Code>animation-timeline</Code>을 초기화한다. 그래서 <b>timeline은 반드시 animation 뒤에</b> 쓴다.</>,
            <>keyframes는 평소처럼 쓰고, duration은 의미가 없다(스크롤이 시간 대신이므로). <Code>linear</Code>로 두면 스크롤과 1:1로 움직인다.</>,
            <>transform·opacity 애니메이션이면 메인 스레드가 아니라 <b>컴포지터에서 실행</b>되어, JS가 바빠도 부드럽다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>읽기 진행률 바</b>: 블로그·문서 상단의 진행 바</>,
            <><b>등장 효과</b>: 스크롤하면 카드·섹션이 서서히 나타나기 (IntersectionObserver + 클래스 토글을 대체)</>,
            <><b>스크롤에 따라 줄어드는 헤더</b>, 패럴랙스 배경</>,
          ]}
          avoid={[
            '스크롤 위치에 따라 데이터를 불러오는 일(무한 스크롤) — 이건 여전히 IntersectionObserver',
            '중요한 정보를 애니메이션 뒤에 숨기기 — 지원하지 않는 브라우저나 모션 줄이기 설정에서는 처음부터 보이게 해야 한다',
            <>모든 요소에 과한 효과 — <Code>prefers-reduced-motion</Code> 사용자는 끄기</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"예전에는 scroll 이벤트로 스크롤 위치를 읽어 상태를 바꿨는데, 이벤트가 매우 자주 일어나 리렌더와 메인 스레드 부담이 컸다. CSS scroll-driven animation은 브라우저가 컴포지터에서 처리해 JS 없이 부드럽게 동작한다."</p>
          <p>Chrome·Edge(115+)와 Safari 26이 지원하고, Firefox는 확인이 필요합니다. 그래서 <Code>@supports (animation-timeline: scroll())</Code>로 감싸고, 지원하지 않으면 애니메이션 없이 그냥 보이게 합니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>슬라이더로 스크롤 위치를 움직여 보세요. 같은 스크롤 위치가 <b>scroll() 타임라인</b>과 <b>view() 타임라인</b>에서 각각 몇 %인지 보여줍니다.</p>
        <TimelineViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'scroll 이벤트 + state',
            code: `
function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(scrollY / max);          // 스크롤할 때마다 리렌더
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return <div className="bar" style={{ transform: \`scaleX(\${progress})\` }} />;
}`,
            note: '스크롤 한 번에 이벤트가 수십 번 → 그때마다 setState와 리렌더. 메인 스레드가 바쁘면 버벅인다.',
          }}
          after={{
            label: 'animation-timeline',
            code: `
function ReadingProgress() {
  return <div className="bar" />;
}

/* CSS */
.bar {
  transform-origin: left;
  animation: grow linear both;
  animation-timeline: scroll();   /* animation 뒤에! */
}
@keyframes grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}`,
            note: 'JS도 state도 없다. 브라우저가 스크롤과 애니메이션을 직접 연결한다.',
          }}
        />

        <H3>등장 효과와 지원 여부 처리</H3>
        <CodeBlock
          code={`
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .card {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;   /* 들어오기 시작 ~ 30% 보일 때까지 */
    }
  }
}
@keyframes reveal {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: none; }
}`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        {!supported && (
          <Callout type="warn" title="이 브라우저는 animation-timeline을 지원하지 않아요">
            <p>CSS 쪽 데모는 애니메이션 없이 보입니다. 최신 Chrome·Edge·Safari에서 열어 보세요. JS 쪽 데모는 동작합니다.</p>
          </Callout>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          <CssScroller />
          <JsScroller />
        </div>
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

function TimelineViz() {
  const [scroll, setScroll] = useState(30);
  // 스크롤 영역 높이 100, 콘텐츠 높이 300 → 최대 스크롤 200. 요소는 콘텐츠 기준 180~220 위치
  const top = 180 - scroll * 2;
  const el = { top, bottom: top + 40 };
  const viewPct = Math.min(100, Math.max(0, ((100 - el.top) / (100 + 40)) * 100));
  return (
    <Viz>
      <label className="flex flex-wrap items-center gap-3 text-sm">
        스크롤 위치
        <input type="range" min={0} max={100} value={scroll} onChange={(e) => setScroll(Number(e.target.value))} className="w-48" />
      </label>
      <div className="mt-5 flex min-w-[460px] items-start gap-8">
        <div className="relative h-[200px] w-40 overflow-hidden rounded-xl border-2 border-indigo-400">
          <span className="absolute top-1 left-2 z-10 text-[10px] text-indigo-500">보이는 영역</span>
          <div className="absolute inset-x-3 rounded-lg bg-amber-300" style={{ top: el.top * 2, height: 80 }} />
        </div>
        <div className="flex-1 space-y-4">
          <Bar label="scroll() 진행률" value={scroll} color="bg-indigo-500" />
          <Bar label="노란 요소의 view() 진행률" value={Math.round(viewPct)} color="bg-amber-400" />
          <p className={`text-sm ${ui.muted}`}>
            {viewPct <= 0 ? '요소가 아직 아래에 있어 view()는 0%.' : viewPct >= 100 ? '요소가 위로 다 빠져나가 view()는 100%.' : '요소가 화면을 지나가는 동안 view()가 0 → 100%로 진행.'}
          </p>
        </div>
      </div>
      <Legend items={[['bg-indigo-500', '스크롤 컨테이너 전체 기준'], ['bg-amber-400', '요소 하나가 보이는 정도 기준']]} />
    </Viz>
  );
}

function Bar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><b className="tabular-nums">{value}%</b></div>
      <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ---------- 데모 ---------- */

const CARDS = Array.from({ length: 12 }, (_, i) => i + 1);

function Scroller({ children, onScroll }) {
  return (
    <div className="relative h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60" onScroll={onScroll}>
      {children}
    </div>
  );
}

function CssScroller() {
  const renders = useRenderCount();
  return (
    <div className={ui.box}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">CSS (animation-timeline)</span>
        <RenderBadge count={renders} />
      </div>
      <p className={`mt-1 mb-3 text-xs ${ui.muted}`}>진행률 바: scroll() / 카드 등장: view()</p>
      <Scroller>
        <div className="sticky top-0 z-10 h-1.5 bg-zinc-200 dark:bg-zinc-800">
          <div className="sda-progress h-full bg-indigo-500" />
        </div>
        <div className="space-y-3 p-3">
          {CARDS.map((n) => (
            <div key={n} className="sda-item rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">카드 {n}</div>
          ))}
        </div>
      </Scroller>
    </div>
  );
}

function JsScroller() {
  const renders = useRenderCount();
  const [progress, setProgress] = useState(0);
  return (
    <div className={ui.box}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">JS (onScroll + setState)</span>
        <RenderBadge count={renders} />
      </div>
      <p className={`mt-1 mb-3 text-xs ${ui.muted}`}>스크롤할 때마다 진행률을 state로 계산</p>
      <Scroller onScroll={(e) => {
        const t = e.currentTarget;
        setProgress(t.scrollTop / (t.scrollHeight - t.clientHeight));
      }}>
        <div className="sticky top-0 z-10 h-1.5 bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full origin-left bg-rose-500" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <div className="space-y-3 p-3">
          {CARDS.map((n) => (
            <div key={n} className="rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">카드 {n}</div>
          ))}
        </div>
      </Scroller>
    </div>
  );
}
