import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, Toggle, ui,
} from '../components/kit.jsx';

const supported = typeof CSS !== 'undefined' && CSS.supports?.('clip-path', 'shape(from 0 0, line to 1px 1px)');

export default function ShapeFunction() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          <Code>shape()</Code>는 <u>CSS 문법으로 직선·곡선·호를 이어 그리는 도형 함수</u>입니다. SVG <Code>path()</Code>와 달리
          <u> %·rem·calc()·CSS 변수</u>를 쓸 수 있어서, 요소 크기가 바뀌면 도형도 함께 늘어나는 <b>반응형 clip-path</b>를 만들 수 있습니다.
        </OneLiner>

        {!supported && (
          <Callout type="warn" title="이 브라우저는 shape()를 지원하지 않아요">
            <p>아래 데모의 실제 잘라내기(clip-path)는 보이지 않을 수 있어요. 최신 Chrome·Edge·Firefox·Safari에서 열어 보세요. 2026년 2월부터 주요 브라우저가 모두 지원합니다.</p>
          </Callout>
        )}

        <H3>왜 새로 나왔나?</H3>
        <List
          items={[
            <><Code>polygon()</Code>: %를 쓸 수 있어 반응형이지만 <b>직선만</b> 된다. 물결, 둥근 꼬리는 못 그린다.</>,
            <><Code>path()</Code>: 곡선은 되지만 SVG 문자열이라 <b>px만</b> 된다. 너비 300px에 맞춰 그리면 400px 요소에서는 오른쪽 100px이 잘려 나간다.</>,
            <>그래서 예전에는 화면 크기마다 path를 따로 만들거나, SVG <Code>{'<clipPath clipPathUnits="objectBoundingBox">'}</Code>로 0~1 좌표를 써야 했다.</>,
            <><Code>shape()</Code>는 둘의 장점을 합쳤다: <b>곡선 + % 단위 + calc()</b>.</>,
          ]}
        />

        <H3>명령어 정리</H3>
        <Table
          head={['명령', '하는 일', '예']}
          rows={[
            [<Code>from x y</Code>, '시작점 (맨 앞에 한 번, 뒤에 쉼표)', <Code>from 0% 0%</Code>],
            [<Code>line</Code>, '직선', <Code>line to 100% 0%</Code>],
            [<><Code>hline</Code> · <Code>vline</Code></>, '가로선 · 세로선 (좌표 하나만)', <Code>vline to 80%</Code>],
            [<Code>curve … with</Code>, '베지어 곡선. 제어점 1개 = 2차, 2개(/로 구분) = 3차', <Code>curve to 0% 80% with 50% 100%</Code>],
            [<Code>smooth</Code>, '앞 곡선의 제어점을 뒤집어 매끄럽게 이어지는 곡선', <Code>smooth to 0% 80%</Code>],
            [<Code>arc … of r</Code>, '원호. cw/ccw(기본), small(기본)/large, rotate', <Code>arc by 0 24px of 12px</Code>],
            [<Code>move</Code>, '그리지 않고 위치만 이동', <Code>move to 50% 50%</Code>],
            [<Code>close</Code>, '시작점까지 닫기', <Code>close</Code>],
          ]}
        />
        <List
          items={[
            <><Code>to</Code>는 요소 왼쪽 위 기준 절대 좌표, <Code>by</Code>는 직전 점 기준 상대 좌표.</>,
            <>쓸 수 있는 곳: <Code>clip-path</Code>, <Code>offset-path</Code>(이동 경로). MDN은 <Code>border-shape</Code>도 함께 소개한다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나?</H3>
        <WhenToUse
          use={[
            '섹션 아래쪽 물결·사선처럼 너비에 따라 늘어나야 하는 장식',
            <>말풍선 꼬리, 화살표 태그처럼 <b>"전체는 비율, 꼬리는 고정 px"</b>이 섞인 도형 — <Code>calc(100% - 12px)</Code></>,
            'CSS 변수로 깊이·각도를 조절하는 도형, hover 시 모양이 바뀌는 애니메이션',
            <><Code>offset-path</Code>로 화면 크기에 맞춘 곡선 경로를 따라 움직이는 요소</>,
          ]}
          avoid={[
            <>직선만 있는 도형 — <Code>polygon()</Code>이 더 짧고 지원 범위도 넓다</>,
            '아이콘·일러스트처럼 복잡한 그림 — SVG 파일이 편집·관리하기 쉽다',
            <>그림자까지 필요한 카드 — clip-path는 <Code>box-shadow</Code>도 잘라낸다 (부모에 <Code>filter: drop-shadow()</Code>로 대신)</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"path()는 px 고정이라 반응형이 안 되고, polygon()은 곡선이 안 되는데, shape()는 CSS 문법이라 %·calc·변수를 쓰면서 곡선도 그릴 수 있다"는 비교가 핵심이에요.</p>
          <p>애니메이션은 <b>명령 구조가 같은 도형끼리만</b> 부드럽게 보간됩니다. 다르면 한 번에 바뀝니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <H3>명령을 하나씩 따라 그려 보기</H3>
        <p>각 명령이 이전 점에서 어디로 선을 긋는지, 곡선의 제어점이 어디에 있는지 확인해 보세요.</p>
        <StepViz />

        <H3>너비만 바꿔 보기: path() vs shape()</H3>
        <p>둘 다 "아래쪽이 볼록한 카드"를 그렸습니다. path()는 너비 300px 기준 px 좌표, shape()는 % 좌표입니다.</p>
        <WidthViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'path() — SVG 문법, px 고정',
            code: `
.card {
  /* 300px × 120px에 맞춰 계산한 좌표 */
  clip-path: path("M 0 0 L 300 0 L 300 90
                   Q 150 130 0 90 Z");
}
/* 너비가 바뀌면? 화면 크기마다 다시 계산 */
@media (min-width: 768px) {
  .card {
    clip-path: path("M 0 0 L 600 0 L 600 90
                     Q 300 130 0 90 Z");
  }
}`,
            note: '요소 크기가 바뀔 때마다 좌표를 다시 계산해야 한다. 컨테이너 너비에 맞추려면 JS가 필요하다.',
          }}
          after={{
            label: 'shape() — CSS 문법, % 사용',
            code: `
.card {
  clip-path: shape(
    from 0% 0%,
    line to 100% 0%,
    line to 100% 75%,
    curve to 0% 75% with 50% 108%,
    close
  );
}`,
            note: '어떤 크기에서도 같은 비율로 그려진다. 미디어 쿼리가 필요 없다.',
          }}
        />

        <H3>고정 크기와 비율 섞기 (calc)</H3>
        <CodeBlock
          code={`
/* 말풍선: 몸통은 요소 크기에 맞추고, 꼬리는 항상 16px */
.bubble {
  clip-path: shape(
    from 0% 0%,
    hline to 100%,
    vline to calc(100% - 16px),
    hline to 40%,
    line by -16px 16px,      /* 꼬리 끝 */
    vline by -16px,
    hline to 0%,
    close
  );
}`}
        />

        <H3>CSS 변수로 조절하고 애니메이션</H3>
        <CodeBlock
          code={`
@property --depth { syntax: '<percentage>'; inherits: false; initial-value: 100%; }

.hero {
  clip-path: shape(from 0% 0%, hline to 100%, vline to 80%,
                   curve to 0% 80% with 50% var(--depth), close);
  transition: --depth .4s;
}
.hero:hover { --depth: 65%; }   /* 볼록 → 오목 */

/* 또는 clip-path 자체를 transition (명령 구조가 같아야 부드럽다) */`}
        />

        <H3>지원하지 않는 브라우저 대비</H3>
        <CodeBlock
          code={`
.hero { clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%); } /* 직선 대체 */

@supports (clip-path: shape(from 0 0, line to 1px 1px)) {
  .hero { clip-path: shape(from 0% 0%, hline to 100%, vline to 80%,
                           curve to 0% 80% with 50% 100%, close); }
}`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <Playground />
      </Section>
    </>
  );
}

// ───────────────── 시각화 1: 명령 하나씩 ─────────────────
// 300 × 180 좌표계에서 % 좌표를 픽셀로 바꿔 SVG로 그린다
const W = 300;
const H = 180;
const px = ([x, y]) => [(x / 100) * W, (y / 100) * H];

const STEPS = [
  { css: 'from 0% 0%', to: [0, 0], desc: '시작점을 왼쪽 위에 둔다. 아무것도 그리지 않는다.' },
  { css: 'line to 100% 0%', to: [100, 0], desc: '오른쪽 위까지 직선.' },
  { css: 'line to 100% 70%', to: [100, 70], desc: '아래로 70% 지점까지 직선.' },
  { css: 'curve to 50% 70% with 75% 100%', to: [50, 70], ctrl: [75, 100], desc: '가운데까지 2차 베지어 곡선. 제어점(75% 100%) 쪽으로 끌려 내려간다.' },
  { css: 'smooth to 0% 70%', to: [0, 70], ctrl: [25, 40], smooth: true, desc: '앞 곡선의 제어점을 끝점 기준으로 뒤집은 점(25% 40%)을 제어점으로 써서 매끄럽게 잇는다. 그래서 물결이 된다.' },
  { css: 'close', to: [0, 0], desc: '시작점까지 직선으로 닫는다. 이 안쪽만 보이고 나머지는 잘린다.' },
];

function segment(prev, s) {
  const [x, y] = px(s.to);
  if (s.ctrl) {
    const [cx, cy] = px(s.ctrl);
    return `M ${px(prev).join(' ')} Q ${cx} ${cy} ${x} ${y}`;
  }
  return `M ${px(prev).join(' ')} L ${x} ${y}`;
}

function StepViz() {
  const [i, setI] = useState(0);
  const done = STEPS.slice(1, i + 1);
  const cur = STEPS[i];
  const prevPoint = i > 0 ? STEPS[i - 1].to : null;
  const fullCss = `shape(${STEPS.map((s) => s.css).join(', ')})`;

  return (
    <Viz>
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <svg viewBox={`-20 -20 ${W + 40} ${H + 40}`} className="w-full max-w-md" role="img" aria-label="shape() 명령을 하나씩 그린 도형">
            <rect x="0" y="0" width={W} height={H} fill="none" stroke="currentColor" strokeOpacity=".2" strokeDasharray="4 4" />
            {i === STEPS.length - 1 && (
              <path d={`M 0 0 L ${W} 0 L ${W} ${H * 0.7} Q ${W * 0.75} ${H} ${W * 0.5} ${H * 0.7} T 0 ${H * 0.7} Z`} className="fill-indigo-500/20" />
            )}
            {done.map((s, k) => (
              <path
                key={k}
                d={segment(STEPS[k].to, s)}
                fill="none"
                strokeWidth={k === i - 1 ? 3.5 : 2}
                className={k === i - 1 ? 'stroke-indigo-500' : 'stroke-zinc-400 dark:stroke-zinc-500'}
              />
            ))}
            {cur.ctrl && prevPoint && (
              <g className="text-amber-500">
                <line x1={px(prevPoint)[0]} y1={px(prevPoint)[1]} x2={px(cur.ctrl)[0]} y2={px(cur.ctrl)[1]} stroke="currentColor" strokeDasharray="3 3" />
                <line x1={px(cur.to)[0]} y1={px(cur.to)[1]} x2={px(cur.ctrl)[0]} y2={px(cur.ctrl)[1]} stroke="currentColor" strokeDasharray="3 3" />
                <circle cx={px(cur.ctrl)[0]} cy={px(cur.ctrl)[1]} r="5" fill="currentColor" />
              </g>
            )}
            <circle cx={px(cur.to)[0]} cy={px(cur.to)[1]} r="6" className="fill-indigo-600 dark:fill-indigo-400" />
          </svg>
          <Legend items={[['bg-indigo-500', '지금 명령이 그린 선'], ['bg-zinc-400', '이미 그린 선'], ['bg-amber-500', '곡선의 제어점']]} />
        </div>
        <div className="min-w-0 space-y-1 md:w-64">
          {STEPS.map((s, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={`block w-full rounded-lg px-3 py-1.5 text-left font-mono text-xs transition ${k === i ? 'bg-indigo-600 text-white' : k < i ? 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
            >
              {k + 1}. {s.css}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm"><b>{cur.css}</b> — {cur.desc}</p>
      <div className="mt-3 flex gap-2">
        <button className={ui.btn} disabled={i === 0} onClick={() => setI(i - 1)}>이전</button>
        <button className={ui.btnPrimary} disabled={i === STEPS.length - 1} onClick={() => setI(i + 1)}>다음 명령</button>
      </div>
      {i === STEPS.length - 1 && (
        <div className="mt-4">
          <p className={`text-xs ${ui.muted}`}>실제 CSS로 잘라낸 결과</p>
          <div className="mt-1 h-28 w-full max-w-md bg-gradient-to-br from-indigo-500 to-violet-500" style={{ clipPath: fullCss }} />
          <p className="mt-1 break-all font-mono text-xs text-zinc-500">clip-path: {fullCss}</p>
        </div>
      )}
    </Viz>
  );
}

// ───────────────── 시각화 2: 너비만 바꾸기 ─────────────────
const PATH_300 = 'path("M 0 0 L 300 0 L 300 90 Q 150 130 0 90 Z")';
const SHAPE_PCT = 'shape(from 0% 0%, line to 100% 0%, line to 100% 75%, curve to 0% 75% with 50% 108%, close)';

function WidthViz() {
  const [w, setW] = useState(300);
  return (
    <Viz>
      <label className="flex items-center gap-3 text-sm">
        요소 너비
        <input type="range" min="160" max="440" step="10" value={w} onChange={(e) => setW(+e.target.value)} className="w-48" aria-label="요소 너비" />
        <span className="font-mono">{w}px</span>
        {w === 300 && <span className={`text-xs ${ui.good}`}>path()를 만든 기준 너비</span>}
      </label>
      <div className="mt-4 grid gap-6">
        {[
          ['path() — px 고정', PATH_300, w === 300 ? '기준 너비라 정상' : w > 300 ? `오른쪽 ${w - 300}px이 잘려 나갔다` : '곡선이 중간에 끊겼다'],
          ['shape() — % 좌표', SHAPE_PCT, '어떤 너비에서도 같은 모양'],
        ].map(([label, clip, note], k) => (
          <div key={label} className="min-w-0">
            <p className="mb-1 text-sm font-semibold">{label}</p>
            <div className="overflow-hidden">
              <div className="relative h-[120px] border border-dashed border-zinc-300 dark:border-zinc-700" style={{ width: w, maxWidth: '100%' }}>
                <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-violet-500" style={{ clipPath: clip }} />
              </div>
            </div>
            <p className={`mt-1 text-xs ${k === 1 || w === 300 ? ui.good : ui.bad}`}>{note}</p>
          </div>
        ))}
      </div>
      <p className={`mt-3 text-xs ${ui.muted}`}>점선 상자가 요소의 크기, 색칠된 부분이 clip-path로 남은 영역입니다.</p>
    </Viz>
  );
}

// ───────────────── 직접 해보기 ─────────────────
const PRESETS = {
  wave: {
    label: '물결 하단',
    css: 'shape(from 0% 0%, hline to 100%, vline to 80%, curve to 50% 80% with 75% 100%, smooth to 0% 80%, close)',
    alt: 'shape(from 0% 0%, hline to 100%, vline to 80%, curve to 50% 80% with 75% 60%, smooth to 0% 80%, close)',
  },
  bubble: {
    label: '말풍선',
    css: 'shape(from 0% 0%, hline to 100%, vline to calc(100% - 16px), hline to 40%, line by -16px 16px, vline by -16px, hline to 0%, close)',
    alt: 'shape(from 0% 0%, hline to 100%, vline to calc(100% - 16px), hline to 80%, line by -16px 16px, vline by -16px, hline to 0%, close)',
  },
  tag: {
    label: '화살표 태그',
    css: 'shape(from 0% 0%, hline to calc(100% - 24px), line to 100% 50%, line to calc(100% - 24px) 100%, hline to 0%, close)',
    alt: 'shape(from 0% 0%, hline to calc(100% - 48px), line to 100% 50%, line to calc(100% - 48px) 100%, hline to 0%, close)',
  },
  ticket: {
    label: '티켓 (arc)',
    css: 'shape(from 0% 0%, hline to 100%, vline to calc(50% - 14px), arc by 0px 28px of 14px, vline to 100%, hline to 0%, vline to calc(50% + 14px), arc by 0px -28px of 14px, close)',
    alt: 'shape(from 0% 0%, hline to 100%, vline to calc(50% - 24px), arc by 0px 48px of 24px, vline to 100%, hline to 0%, vline to calc(50% + 24px), arc by 0px -48px of 24px, close)',
  },
};

function Playground() {
  const [preset, setPreset] = useState('wave');
  const [text, setText] = useState(PRESETS.wave.css);
  const [w, setW] = useState(320);
  const [alt, setAlt] = useState(false);

  const valid = supported && CSS.supports('clip-path', text);
  const isPreset = text === PRESETS[preset].css;
  const clip = alt && isPreset ? PRESETS[preset].alt : text;

  return (
    <Demo hint="프리셋을 고르거나 아래 shape()를 직접 고쳐 보세요. 너비를 바꿔도 모양이 따라오는지, '모양 바꾸기'로 애니메이션이 되는지 확인해 보세요.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={preset}
          onChange={(v) => { setPreset(v); setText(PRESETS[v].css); setAlt(false); }}
          options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))}
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        spellCheck={false}
        aria-label="clip-path에 넣을 shape() 값"
        className={`${ui.input} mt-3 w-full font-mono text-xs`}
      />
      <p className={`mt-1 text-xs ${valid ? ui.good : ui.bad}`}>
        {!supported ? '이 브라우저는 shape()를 지원하지 않아요.' : valid ? '올바른 clip-path 값이에요.' : '문법 오류: 쉼표, from 뒤 쉼표, to/by, 단위를 확인해 보세요.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          너비
          <input type="range" min="160" max="480" step="10" value={w} onChange={(e) => setW(+e.target.value)} aria-label="미리보기 너비" />
          <span className="font-mono">{w}px</span>
        </label>
        <Toggle checked={alt} onChange={setAlt} label="모양 바꾸기 (transition)" />
      </div>
      {!isPreset && alt && <p className={`mt-1 text-xs ${ui.muted}`}>직접 고친 값에는 '모양 바꾸기'가 적용되지 않아요.</p>}

      <div className="mt-4 overflow-hidden">
        <div className="relative h-40 border border-dashed border-zinc-300 dark:border-zinc-700" style={{ width: w, maxWidth: '100%' }}>
          <div
            className="grid h-full w-full place-items-center bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white transition-[clip-path] duration-500"
            style={{ clipPath: valid ? clip : undefined }}
          >
            shape()
          </div>
        </div>
      </div>
      {alt && isPreset && <ChangedValues from={PRESETS[preset].css} to={PRESETS[preset].alt} />}
      <p className={`mt-2 text-xs ${ui.muted}`}>
        두 모양은 명령 구조가 같아서(값만 다름) 부드럽게 바뀝니다. 명령의 종류나 개수가 다르면 애니메이션 없이 한 번에 바뀝니다.
      </p>
    </Demo>
  );
}

// 모양 바꾸기 전후 값을 공백 단위로 비교해, 바뀐 값(숫자+단위)에만 밑줄을 긋는다.
// 프리셋 두 값은 명령 구조가 같으므로 같은 위치의 토큰끼리 비교하면 된다.
// 'calc(50%'나 '14px),'처럼 괄호·쉼표가 붙은 토큰은 숫자 부분만 떼어 낸다.
const splitValue = (t) => t.match(/^(.*?)(-?[\d.]+[a-z%]*)(.*)$/) ?? [t, '', t, ''];

function ChangedValues({ from, to }) {
  const a = from.split(/(\s+)/);
  const b = to.split(/(\s+)/);
  const diff = b.map((t, i) => t !== a[i]);
  // 같은 변화(예: 14px → 24px가 여러 군데)는 한 번만 보여 준다
  const pairs = [...new Map(
    b.flatMap((t, i) => (diff[i] ? [[splitValue(a[i] ?? '')[2], splitValue(t)[2]]] : [])).map((p) => [p.join('→'), p])
  ).values()];

  return (
    <div className="mt-2 space-y-1">
      <p className="break-all font-mono text-xs text-zinc-500">
        →{' '}
        {b.map((t, i) => {
          if (!diff[i]) return <span key={i}>{t}</span>;
          const [, pre, value, post] = splitValue(t);
          return (
            <span key={i}>
              {pre}
              <u className="font-semibold text-indigo-600 decoration-2 underline-offset-4 dark:text-indigo-300">{value}</u>
              {post}
            </span>
          );
        })}
      </p>
      <p className="text-xs text-zinc-500">
        바뀐 값:{' '}
        {pairs.map(([x, y], i) => (
          <span key={i} className="mr-3 font-mono">
            {x} → <u className="font-semibold text-indigo-600 decoration-2 underline-offset-4 dark:text-indigo-300">{y}</u>
          </span>
        ))}
      </p>
    </div>
  );
}
