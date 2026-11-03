import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, ui,
} from '../components/kit.jsx';

// 데모용 CSS. 이름이 겹치지 않게 cq- 접두어를 쓴다
const DEMO_CSS = `
.cq-wrap { container-type: inline-size; container-name: cq-card; }
.cq-card { display: grid; gap: 12px; padding: 12px; border-radius: 12px; }
.cq-thumb { aspect-ratio: 16 / 9; border-radius: 8px; }
.cq-cta { display: none; }
.cq-title { font-weight: 700; font-size: clamp(14px, 4cqi, 20px); }
@container cq-card (min-width: 420px) {
  .cq-card { grid-template-columns: 160px 1fr; align-items: center; }
  .cq-thumb { aspect-ratio: 1; }
}
@container cq-card (min-width: 620px) {
  .cq-card { grid-template-columns: 220px 1fr auto; }
  .cq-cta { display: inline-flex; }
}
.mq-card { display: grid; gap: 12px; padding: 12px; border-radius: 12px; }
.mq-thumb { aspect-ratio: 16 / 9; border-radius: 8px; }
@media (min-width: 900px) {
  .mq-card { grid-template-columns: 160px 1fr; align-items: center; }
  .mq-thumb { aspect-ratio: 1; }
}
`;

export default function ContainerQueries() {
  return (
    <>
      <style>{DEMO_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          Container Queries는 <u>화면 크기가 아니라 부모(컨테이너) 크기에 따라</u> 스타일을 바꾸는 기능입니다.
          같은 카드 컴포넌트가 넓은 본문에서는 가로형, 좁은 사이드바에서는 세로형으로 <u>놓인 자리에 맞춰</u> 스스로 바뀝니다.
        </OneLiner>

        <H3>미디어 쿼리로는 왜 안 됐나?</H3>
        <List
          items={[
            <><Code>@media (min-width: 900px)</Code>는 <b>브라우저 화면 너비</b>만 안다. 카드가 실제로 몇 px 공간을 받았는지는 모른다.</>,
            <>그래서 화면은 넓은데 카드가 좁은 사이드바에 들어가면, 미디어 쿼리는 "넓다"고 판단해 가로형으로 그려서 깨진다.</>,
            <>예전 해결법: 위치마다 다른 클래스(<Code>.card--sidebar</Code>)를 붙이거나, JS의 ResizeObserver로 크기를 재서 클래스를 바꿨다.</>,
          ]}
        />

        <H3>사용법 세 줄</H3>
        <List
          items={[
            <>부모에 <Code>container-type: inline-size</Code> → "이 요소의 가로 크기를 기준으로 삼겠다"</>,
            <>(선택) <Code>container-name: card</Code> → 여러 컨테이너 중 어떤 걸 기준으로 할지 이름 지정</>,
            <><Code>@container card (min-width: 420px) {'{ ... }'}</Code> → 그 컨테이너가 420px 이상일 때 적용</>,
          ]}
        />

        <Table
          head={['', '@media', '@container']}
          rows={[
            ['기준', '브라우저 화면(viewport) 크기', '가장 가까운 컨테이너(부모) 크기'],
            ['어울리는 곳', '페이지 전체 레이아웃 (사이드바를 접을지 등)', '재사용 컴포넌트 (카드, 위젯, 상품 아이템)'],
            ['단위', <><Code>vw</Code>, <Code>vh</Code></>, <><Code>cqi</Code>(컨테이너 가로의 1%), <Code>cqb</Code>, <Code>cqw</Code></>],
            ['컴포넌트 재사용', '놓이는 위치마다 별도 처리 필요', '어디에 넣어도 알아서 맞춤'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>여러 곳에 재사용되는 컴포넌트</b>: 상품 카드가 메인(3열), 검색 결과(1열), 사이드바(좁음)에 모두 쓰일 때</>,
            '대시보드 위젯처럼 사용자가 크기를 바꾸는 패널',
            '디자인 시스템 컴포넌트 — 쓰는 쪽이 위치에 따라 props를 따로 넘기지 않아도 된다',
          ]}
          avoid={[
            '페이지 전체 레이아웃(헤더, 사이드바 표시 여부) — 이건 여전히 미디어 쿼리가 맞다',
            <>컨테이너 자신의 스타일을 바꾸기 — <b>자기 자신은 조회할 수 없고 자식만</b> 바꿀 수 있다 (크기가 순환 참조되므로)</>,
            <>모든 div에 <Code>container-type</Code> 붙이기 — 크기 계산 방식이 바뀌어(내용으로 크기가 정해지지 않음) 레이아웃이 깨질 수 있다</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"미디어 쿼리는 페이지 레이아웃용, 컨테이너 쿼리는 컴포넌트용"이라고 나눠 말하면 됩니다. "같은 카드가 사이드바와 본문에서 다르게 보여야 해서 예전엔 ResizeObserver를 썼는데, 컨테이너 쿼리로 CSS만으로 해결했다"는 식의 경험으로 연결하기 좋아요.</p>
          <p>2023년부터 모든 주요 브라우저가 지원합니다. 컨테이너의 CSS 변수 값으로 조회하는 <Code>@container style(--theme: dark)</Code>(Style Queries)는 아직 지원이 갈립니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>화면 너비는 그대로 두고 <b>카드가 놓인 칸의 너비</b>만 바꿔 보세요. 두 쿼리가 각각 무엇을 보고 판단하는지 비교합니다.</p>
        <QueryViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '미디어 쿼리 + 위치별 클래스',
            code: `
.card { display: grid; }

/* 화면이 넓으면 가로형 */
@media (min-width: 900px) {
  .card { grid-template-columns: 160px 1fr; }
}

/* 그런데 사이드바 안에서는 다시 세로형으로 되돌려야 한다 */
@media (min-width: 900px) {
  .sidebar .card { grid-template-columns: 1fr; }
}`,
            note: '카드가 놓이는 위치가 늘어날 때마다 예외 규칙이 늘어난다. 컴포넌트가 자기가 어디 있는지 알아야 한다.',
          }}
          after={{
            label: '컨테이너 쿼리',
            code: `
.card-wrap {
  container-type: inline-size;
  container-name: card;
}
.card { display: grid; }

/* 카드가 받은 공간이 420px 이상이면 가로형 */
@container card (min-width: 420px) {
  .card { grid-template-columns: 160px 1fr; }
}`,
            note: '어디에 넣든 받은 공간에 맞춰 바뀐다. 위치별 예외 규칙이 필요 없다.',
          }}
        />

        <H3>JS로 하던 방식</H3>
        <CodeBlock
          code={`
// 컨테이너 쿼리 이전: 크기를 재서 클래스를 붙였다
function Card() {
  const ref = useRef(null);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setWide(entry.contentRect.width >= 420));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className={wide ? 'card card--wide' : 'card'}>...</div>;
}
// 크기가 바뀔 때마다 리렌더 + 첫 렌더에서는 크기를 몰라 깜빡임이 생길 수 있다`}
        />

        <H3>Tailwind에서는</H3>
        <CodeBlock
          code={`
<div class="@container">
  <div class="grid @md:grid-cols-[160px_1fr]">...</div>   <!-- 컨테이너가 md(28rem) 이상이면 -->
</div>`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <ResizeDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

function QueryViz() {
  const [slot, setSlot] = useState(300);
  const viewport = 1280;
  return (
    <Viz>
      <label className="flex flex-wrap items-center gap-3 text-sm">
        카드가 놓인 칸의 너비
        <input type="range" min={200} max={800} value={slot} onChange={(e) => setSlot(Number(e.target.value))} className="w-48" />
        <b className="tabular-nums">{slot}px</b>
      </label>
      <div className="mt-5 min-w-[460px] space-y-3">
        <Row label="@media (min-width: 900px)" sees={`화면 ${viewport}px`} pass />
        <Row label="@container (min-width: 420px)" sees={`칸 ${slot}px`} pass={slot >= 420} />
      </div>
      <Legend items={[['bg-emerald-400', '조건 만족 → 가로형 적용'], ['bg-zinc-300', '조건 불만족 → 세로형 유지']]} />
      <p className={`mt-3 text-sm ${ui.muted}`}>
        {slot < 420
          ? '→ 칸이 좁은데도 미디어 쿼리는 화면만 보고 "넓다"고 판단한다. 카드가 좁은 칸에 가로형으로 끼워져 깨진다. 컨테이너 쿼리는 칸 크기를 보고 세로형을 유지한다.'
          : '→ 칸이 충분히 넓어서 둘 다 가로형. 차이는 칸이 좁아질 때 드러난다.'}
      </p>
    </Viz>
  );
}

function Row({ label, sees, pass }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
      <span className="w-56 font-mono text-sm">{label}</span>
      <span className={`text-sm ${ui.muted}`}>보는 값: {sees}</span>
      <span className={`ml-auto rounded px-2 py-0.5 text-xs font-bold ${pass ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
        {pass ? '가로형' : '세로형'}
      </span>
    </div>
  );
}

/* ---------- 데모 ---------- */

function ResizeDemo() {
  const [width, setWidth] = useState(360);
  return (
    <Demo hint="슬라이더로 칸의 너비를 바꾸거나, 칸 오른쪽 아래 모서리를 끌어 보세요. 위 카드는 컨테이너 쿼리, 아래 카드는 미디어 쿼리입니다. 화면 너비는 바뀌지 않으므로 아래 카드는 반응하지 않습니다.">
      <label className="flex flex-wrap items-center gap-3 text-sm">
        칸 너비
        <input type="range" min={240} max={760} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-48" />
        <b className="tabular-nums">{width}px</b>
        <span className={ui.muted}>(420px, 620px에서 바뀜)</span>
      </label>

      <p className="mt-4 mb-2 text-sm font-semibold">@container</p>
      <div className="cq-wrap max-w-full resize-x overflow-auto rounded-xl border-2 border-dashed border-indigo-300 p-2 dark:border-indigo-500/40" style={{ width }}>
        <Card cls="cq" />
      </div>

      <p className="mt-5 mb-2 text-sm font-semibold">@media (min-width: 900px)</p>
      <div className="max-w-full overflow-auto rounded-xl border-2 border-dashed border-zinc-300 p-2 dark:border-zinc-700" style={{ width }}>
        <Card cls="mq" />
      </div>
    </Demo>
  );
}

function Card({ cls }) {
  return (
    <div className={`${cls}-card bg-white ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800`}>
      <div className={`${cls}-thumb bg-gradient-to-br from-indigo-400 to-violet-500`} />
      <div className="min-w-0">
        <div className={cls === 'cq' ? 'cq-title' : 'font-bold'}>무선 이어폰 X2</div>
        <p className={`mt-1 text-sm ${ui.muted}`}>노이즈 캔슬링 · 30시간 재생</p>
        <p className="mt-1 font-bold text-indigo-600 dark:text-indigo-400">129,000원</p>
      </div>
      {cls === 'cq' && <button className={`cq-cta ${ui.btnPrimary}`}>담기</button>}
    </div>
  );
}
