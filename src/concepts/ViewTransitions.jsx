import { useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Toggle, ui,
} from '../components/kit.jsx';

const DEMO_CSS = `
/* 이 페이지의 데모에서는 페이지 전체가 크로스페이드되지 않게 root 전환을 끈다 */
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
::view-transition-group(*) { animation-duration: 450ms; animation-timing-function: cubic-bezier(.2,.8,.2,1); }
`;

const supported = typeof document !== 'undefined' && 'startViewTransition' in document;

// 화면을 바꾸는 함수를 View Transition으로 감싼다. React는 콜백이 끝날 때 DOM이 바뀌어 있도록 flushSync가 필요하다
function transition(enabled, update) {
  if (!enabled || !supported) return update();
  const t = document.startViewTransition(() => flushSync(update));
  // 전환 중에 또 누르면 이전 전환이 건너뛰어지며(AbortError) 거부된다. 화면 변경은 그대로 일어나므로 무시한다
  t.ready.catch(() => {});
}

export default function ViewTransitions() {
  return (
    <>
      <style>{DEMO_CSS}</style>
      <Section step={1} title="개념">
        <OneLiner>
          View Transitions는 <u>화면이 바뀌기 전 모습과 바뀐 뒤 모습을 브라우저가 캡처해서, 그 사이를 애니메이션으로 이어주는</u> 기능입니다.
          <Code>document.startViewTransition(() =&gt; 화면 바꾸기)</Code>로 감싸기만 하면 되고, 같은 <Code>view-transition-name</Code>을 가진 요소는 <u>이전 위치에서 새 위치로 이동하듯</u> 움직입니다.
        </OneLiner>

        <H3>동작 순서</H3>
        <List
          items={[
            <>① 현재 화면을 캡처한다 (old)</>,
            <>② 콜백을 실행해서 DOM을 바꾼다 (이 동안 화면은 멈춘 것처럼 보인다)</>,
            <>③ 바뀐 화면을 캡처한다 (new)</>,
            <>④ <Code>::view-transition-*</Code> 가상 요소로 old → new를 애니메이션한다. 기본은 크로스페이드, 이름이 같은 요소는 위치·크기까지 이어서 이동</>,
          ]}
        />

        <Table
          head={['종류', '사용법', '지원']}
          rows={[
            ['같은 페이지 안 (SPA)', <><Code>document.startViewTransition(cb)</Code></>, '모든 주요 브라우저 (2025년 10월 Baseline)'],
            ['페이지 이동 (MPA)', <><Code>@view-transition {'{ navigation: auto; }'}</Code>를 양쪽 페이지 CSS에</>, 'Chrome·Edge·Safari (Firefox는 확인 필요)'],
            ['React', <>상태 변경을 <Code>flushSync</Code>로 감싸거나, React 19.3의 <Code>&lt;ViewTransition&gt;</Code></>, '-'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>목록 변화</b>: 정렬·필터·추가·삭제 시 항목이 순간이동하지 않고 움직이게</>,
            <><b>목록 → 상세</b>: 썸네일이 상세 화면의 큰 이미지로 커지는 전환 (공유 요소 전환)</>,
            <><b>탭·페이지 전환</b>: 콘텐츠가 바뀌는 걸 부드럽게 연결해 맥락을 유지</>,
            'Framer Motion의 layout 애니메이션 같은 효과를 라이브러리 없이 내고 싶을 때',
          ]}
          avoid={[
            '입력할 때마다 바뀌는 검색 결과처럼 매우 잦은 업데이트 — 전환 중에는 화면이 멈춰 클릭이 잠깐 막힌다',
            <>같은 <Code>view-transition-name</Code>을 한 화면에 두 개 이상 — 전환이 실패한다(이름은 화면에서 유일해야 함)</>,
            <>모션을 줄이길 원하는 사용자 — <Code>@media (prefers-reduced-motion: reduce)</Code>에서는 애니메이션을 끈다</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"View Transitions API는 DOM 변경 전후를 스냅샷으로 찍어 브라우저가 애니메이션을 처리한다. 그래서 애니메이션 라이브러리 없이 목록 이동이나 공유 요소 전환을 만들 수 있다. React에서는 DOM이 콜백 안에서 동기적으로 바뀌어야 해서 flushSync를 같이 썼다."</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>버튼을 눌러 단계를 넘겨 보세요. 브라우저가 내부적으로 만드는 가상 요소 트리가 단계마다 어떻게 바뀌는지 보여줍니다.</p>
        <StepsViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '전환 없음',
            code: `
function List() {
  const [items, setItems] = useState(initial);
  const shuffle = () => setItems(shuffled(items));

  return (
    <>
      <button onClick={shuffle}>섞기</button>
      {items.map((it) => <Item key={it.id} {...it} />)}
    </>
  );
}`,
            note: '항목이 새 위치로 순간이동한다. 무엇이 어디로 갔는지 눈으로 따라가기 어렵다.',
          }}
          after={{
            label: 'View Transition',
            code: `
import { flushSync } from 'react-dom';

function List() {
  const [items, setItems] = useState(initial);
  const shuffle = () =>
    document.startViewTransition(() =>
      flushSync(() => setItems(shuffled(items)))
    );

  return (
    <>
      <button onClick={shuffle}>섞기</button>
      {items.map((it) => (
        <Item key={it.id} {...it}
          style={{ viewTransitionName: \`item-\${it.id}\` }} />
      ))}
    </>
  );
}`,
            note: '항목마다 고유한 이름을 주면, 각 항목이 이전 위치에서 새 위치로 미끄러지듯 이동한다.',
          }}
        />

        <H3>애니메이션 바꾸기</H3>
        <CodeBlock
          code={`
/* 모든 전환의 길이·속도 곡선 */
::view-transition-group(*) { animation-duration: 400ms; }

/* 특정 요소만: 새 화면이 아래에서 올라오게 */
::view-transition-new(detail) { animation: slide-up 300ms ease-out; }

/* 모션 줄이기 설정을 켠 사용자에게는 끄기 */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
}`}
        />

        <H3>페이지 이동(MPA)에서는 JS 없이</H3>
        <CodeBlock
          code={`
/* 이동 전·후 페이지 양쪽 CSS에 */
@view-transition { navigation: auto; }

/* 목록 페이지의 썸네일과 상세 페이지의 큰 이미지에 같은 이름 */
.product-thumb, .product-hero { view-transition-name: product-42; }`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        {!supported && (
          <Callout type="warn" title="이 브라우저는 View Transitions를 지원하지 않아요">
            <p>전환 없이 바로 바뀝니다. 최신 Chrome·Edge·Safari·Firefox에서 열어 보세요.</p>
          </Callout>
        )}
        <H3>A. 목록 섞기·추가·삭제</H3>
        <ListDemo />
        <H3>B. 썸네일 → 상세 (공유 요소 전환)</H3>
        <GalleryDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const STEPS = [
  { title: '평소', tree: ['(전환 없음) 일반 DOM만 있음'] },
  { title: '① old 캡처', tree: ['::view-transition', '  ::view-transition-group(item-1)', '    ::view-transition-image-pair(item-1)', '      ::view-transition-old(item-1)   ← 이전 화면 스냅샷'] },
  { title: '② DOM 변경', tree: ['(콜백 실행: setState → flushSync로 DOM 즉시 반영)', '이 동안 화면은 old 스냅샷으로 덮여 있어 변경 과정이 보이지 않음'] },
  { title: '③ new 캡처', tree: ['::view-transition', '  ::view-transition-group(item-1)   ← 위치·크기를 old → new로 이동', '    ::view-transition-image-pair(item-1)', '      ::view-transition-old(item-1)   ← 서서히 사라짐', '      ::view-transition-new(item-1)   ← 서서히 나타남'] },
  { title: '④ 끝', tree: ['가상 요소 제거, 실제 DOM이 보임'] },
];

function StepsViz() {
  const [i, setI] = useState(0);
  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, n) => (
          <button key={s.title} className={n === i ? ui.btnPrimary : ui.btn} onClick={() => setI(n)}>{s.title}</button>
        ))}
      </div>
      <pre key={i} className="mt-4 min-w-[460px] animate-flash overflow-x-auto rounded-xl bg-zinc-50 p-4 font-mono text-xs leading-relaxed dark:bg-zinc-800/60">
        {STEPS[i].tree.join('\n')}
      </pre>
      <p className={`mt-3 text-sm ${ui.muted}`}>
        group은 위치와 크기를, old/new는 내용의 크로스페이드를 담당합니다. 그래서 CSS로 <code className="font-mono">::view-transition-group(이름)</code>의 animation을 바꾸면 움직임이, old/new를 바꾸면 사라지고 나타나는 효과가 바뀝니다.
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-indigo-400', 'bg-fuchsia-400', 'bg-teal-400', 'bg-orange-400'];
let nextId = 6;

function ListDemo() {
  const [on, setOn] = useState(true);
  const [items, setItems] = useState(() => [1, 2, 3, 4, 5].map((id) => ({ id, color: COLORS[id % COLORS.length] })));
  const run = (fn) => transition(on, () => setItems(fn));

  return (
    <Demo hint="View Transition을 켜고 끄며 같은 버튼을 눌러 비교해 보세요. 켜면 항목이 새 위치로 이동하고, 끄면 순간이동합니다.">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle checked={on} onChange={setOn} label="View Transition" />
        <button className={ui.btnPrimary} onClick={() => run((xs) => [...xs].sort(() => Math.random() - 0.5))}>섞기</button>
        <button className={ui.btn} onClick={() => run((xs) => [...xs].sort((a, b) => a.id - b.id))}>정렬</button>
        <button className={ui.btn} onClick={() => run((xs) => [{ id: nextId, color: COLORS[nextId++ % COLORS.length] }, ...xs])}>앞에 추가</button>
        <button className={ui.btn} onClick={() => run((xs) => xs.slice(1))} disabled={!items.length}>첫 항목 삭제</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            className={`grid h-16 w-16 place-items-center rounded-xl text-lg font-bold text-white ${it.color}`}
            style={on ? { viewTransitionName: `vt-item-${it.id}` } : undefined}
          >
            {it.id}
          </div>
        ))}
      </div>
    </Demo>
  );
}

const PHOTOS = [
  { id: 1, title: '바다', g: 'from-sky-400 to-indigo-500' },
  { id: 2, title: '숲', g: 'from-emerald-400 to-teal-600' },
  { id: 3, title: '노을', g: 'from-orange-400 to-rose-500' },
  { id: 4, title: '밤하늘', g: 'from-indigo-600 to-violet-900' },
];

function GalleryDemo() {
  const [on, setOn] = useState(true);
  const [open, setOpen] = useState(null);
  const select = (p) => transition(on, () => setOpen(p));
  const name = (id) => (on ? { viewTransitionName: `vt-photo-${id}` } : undefined);

  return (
    <Demo hint="사진을 눌러 상세로 들어갔다가 닫아 보세요. 썸네일과 큰 이미지에 같은 view-transition-name을 줘서, 썸네일이 그대로 커지는 것처럼 보입니다.">
      <Toggle checked={on} onChange={setOn} label="View Transition" />
      <div className="mt-4 min-h-[240px]">
        {open ? (
          <div className={ui.box}>
            <div className={`h-48 rounded-xl bg-gradient-to-br ${open.g}`} style={name(open.id)} />
            <div className="mt-3 flex items-center justify-between">
              <b>{open.title}</b>
              <button className={ui.btn} onClick={() => select(null)}>닫기</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PHOTOS.map((p) => (
              <button key={p.id} onClick={() => select(p)} className="text-left">
                <div className={`h-24 rounded-xl bg-gradient-to-br ${p.g}`} style={name(p.id)} />
                <span className="mt-1 block text-sm">{p.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Demo>
  );
}
