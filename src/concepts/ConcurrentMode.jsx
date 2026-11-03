import { memo, useDeferredValue, useEffect, useRef, useState, useTransition } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, CodeBlock, CodeCompare, Table,
  Demo, Viz, Legend, Segmented, ui,
} from '../components/kit.jsx';

export default function ConcurrentMode() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          동시성 렌더링(Concurrent Rendering)은 React가 렌더링을 <u>잘게 나눠서 중간에 멈추고, 더 급한 업데이트를 먼저 처리한 뒤 다시 이어갈 수 있게</u> 하는 기능입니다.
          React 18부터 createRoot를 쓰면 켜지고, useTransition·useDeferredValue로 "이 업데이트는 급하지 않다"고 알려주면 입력 같은 급한 반응이 막히지 않습니다.
        </OneLiner>

        <H3>먼저 용어 정리</H3>
        <List
          items={[
            <><b>Concurrent Mode</b>는 실험 단계 때 이름이다. 정식 출시(React 18)에선 "모드"를 통째로 켜는 게 아니라, <b>동시성 기능(Concurrent Features)</b>을 필요한 곳에만 쓰는 방식으로 바뀌었다.</>,
            <><Code>ReactDOM.render</Code> → <Code>createRoot().render</Code>로 바꾸면 동시성 렌더링이 가능해진다. (자동 배칭도 이때 같이 적용)</>,
          ]}
        />

        <H3>왜 필요한가? — 기존(동기) 렌더링의 문제</H3>
        <List
          items={[
            <>React 17까지 렌더링은 <b>한번 시작하면 끝날 때까지 멈출 수 없었다</b>. (blocking rendering)</>,
            <>JS는 싱글 스레드라, 300ms짜리 렌더가 돌고 있으면 그동안 <b>키 입력·클릭·애니메이션이 전부 멈춘다</b>.</>,
            <>예: 검색창에 입력할 때마다 1만 개 결과를 다시 그리면 → 글자가 한 박자씩 늦게 찍힌다.</>,
          ]}
        />

        <H3>동시성 렌더링은 어떻게 해결하나?</H3>
        <List
          items={[
            <><b>우선순위 구분</b>: 업데이트를 "급한 것(Urgent: 타이핑, 클릭)"과 "급하지 않은 것(Transition: 결과 목록, 화면 전환)"으로 나눈다.</>,
            <><b>중단 가능한 렌더링</b>: 급하지 않은 렌더를 작은 단위로 쪼개 하다가 브라우저에 틈틈이 제어권을 돌려준다(약 5ms마다). 그 사이 입력이 들어오면 먼저 처리한다.</>,
            <><b>버리고 다시 하기</b>: 진행 중이던 렌더가 이미 낡았으면(새 입력이 들어옴) 버리고 최신 값으로 다시 시작한다.</>,
            <><b>기존 화면 유지</b>: 새 화면이 준비되는 동안 이전 화면을 계속 보여줄 수 있다 (Suspense fallback으로 갈아엎지 않음).</>,
          ]}
        />

        <Table
          head={['', 'useTransition', 'useDeferredValue']}
          rows={[
            ['형태', <><Code>const [isPending, startTransition] = useTransition()</Code></>, <><Code>const deferred = useDeferredValue(value)</Code></>],
            ['무엇을 늦추나', 'state를 바꾸는 "업데이트 코드"를 감싼다', '"값"을 받아서 늦게 따라오는 사본을 만든다'],
            ['언제 쓰기 좋나', 'setState 코드를 내가 직접 갖고 있을 때', '값이 props로 내려오는 등 setState를 못 건드릴 때'],
            ['로딩 표시', 'isPending 제공', 'value !== deferred 로 비교'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>입력 + 무거운 결과 렌더</b>: 검색어 입력에 따라 큰 목록/차트를 필터링할 때 → 입력은 즉시, 결과는 transition으로</>,
            <><b>탭·페이지 전환</b>: 새 탭 렌더가 무거울 때 클릭 반응을 막지 않고, 준비되는 동안 이전 탭을 유지</>,
            <><b>Suspense와 함께</b>: 이미 보이던 화면이 다음 데이터를 기다릴 때 fallback으로 깜빡이지 않게 (startTransition 안에서 업데이트하면 기존 UI 유지)</>,
          ]}
          avoid={[
            <><b>input의 value 자체</b>를 transition으로 업데이트 — 입력창이 늦게 반응한다 (입력값은 항상 급한 업데이트)</>,
            '렌더 자체가 가벼운 곳 — 체감 차이가 없다',
            '네트워크 요청을 줄이고 싶을 때 — 그건 debounce/throttle의 역할 (동시성은 "렌더링" 우선순위만 조절)',
          ]}
        />
        <Callout type="tip" title="debounce와의 차이 (단골 질문)">
          <p><b>debounce</b>는 정해진 시간(예: 300ms) 동안 <b>무조건 기다렸다가</b> 실행합니다. 빠른 기기에서도 300ms 늦습니다.</p>
          <p><b>useDeferredValue/useTransition</b>은 기다리는 시간이 정해져 있지 않고, <b>기기가 빠르면 바로, 느리면 입력을 우선</b>하며 남는 시간에 렌더합니다. 또 진행 중인 렌더를 중단할 수 있습니다. 대신 API 호출 횟수를 줄이는 효과는 없습니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>사용자가 렌더링 도중 키를 세 번 눌렀을 때, 메인 스레드에서 일어나는 일을 비교합니다.</p>
        <TimelineViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            code: `
function Search() {
  const [query, setQuery] = useState('');

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* 렌더 300ms → 그동안 입력이 멈춤 */}
      <SlowResults query={query} />
    </>
  );
}`,
            note: '입력과 결과 렌더가 같은 우선순위라, 결과를 다 그릴 때까지 다음 글자가 화면에 안 찍힌다.',
          }}
          after={{
            label: '썼을 때 (useDeferredValue)',
            code: `
function Search() {
  const [query, setQuery] = useState('');
  // query가 바뀌어도 급한 렌더가 끝난 뒤에 따라온다
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        {/* memo 필수: deferredQuery가 같으면 렌더 건너뜀 */}
        <SlowResults query={deferredQuery} />
      </div>
    </>
  );
}
const SlowResults = memo(function SlowResults({ query }) { ... });`,
            note: '입력창은 즉시 반응하고, 결과 목록은 틈나는 대로 렌더된다. 그 사이 새 입력이 오면 이전 렌더를 버린다.',
          }}
        />
        <Callout title="useTransition으로 쓰면">
          <CodeBlock
            code={`
const [text, setText] = useState('');      // 입력창용 (급함)
const [query, setQuery] = useState('');    // 결과용 (급하지 않음)
const [isPending, startTransition] = useTransition();

const onChange = (e) => {
  setText(e.target.value);                 // 즉시 반영
  startTransition(() => {
    setQuery(e.target.value);              // 중단 가능한 낮은 우선순위로
  });
};

<input value={text} onChange={onChange} />
{isPending && <Spinner />}
<SlowResults query={query} />`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <ConcurrentDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const KEYS = [{ at: 12, ch: 'r' }, { at: 32, ch: 'e' }, { at: 52, ch: 'a' }];
const DURATION = 4500;

// 동시성: 5칸 일하고 1칸 쉬면서(브라우저에 양보) 렌더. 쉬는 틈에 키 입력이 오면 먼저 처리하고, 낡은 렌더는 버리고 처음부터 다시.
function concurrentBlocks() {
  const blocks = [];
  let t = 0;
  let done = 0; // 현재 렌더에서 끝낸 작업량 (총 20칸이면 완료)
  for (const key of [...KEYS.map((k) => k.at), Infinity]) {
    while (t + 5 <= key && done < 20) {
      blocks.push({ from: t, to: t + 5, kind: 'render' });
      t += 6;
      done += 5;
    }
    if (key === Infinity) break;
    blocks.push({ from: key, to: key + 2, kind: 'input' }, { from: key, kind: 'restart' });
    t = key + 2;
    done = 0;
  }
  blocks.push({ from: t, to: t + 2, kind: 'commit' });
  return blocks;
}

const LANES = {
  sync: {
    title: '동기 렌더링 (React 17 / 일반 setState)',
    blocks: [{ from: 0, to: 70, kind: 'render' }, { from: 70, to: 72, kind: 'commit' }, { from: 72, to: 78, kind: 'input' }],
    inputShownAt: () => 72,
  },
  concurrent: {
    title: '동시성 렌더링 (useTransition / useDeferredValue)',
    blocks: concurrentBlocks(),
    inputShownAt: (keyAt) => keyAt + 1,
  },
};

const BLOCK_STYLE = {
  render: 'bg-indigo-400 dark:bg-indigo-500',
  commit: 'bg-emerald-500',
  input: 'bg-amber-400',
};

function TimelineViz() {
  const [t, setT] = useState(100);
  const raf = useRef(0);

  const play = () => {
    cancelAnimationFrame(raf.current);
    const startedAt = performance.now();
    const tick = (now) => {
      const next = Math.min(100, ((now - startedAt) / DURATION) * 100);
      setT(next);
      if (next < 100) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <button className={ui.btnPrimary} onClick={play}>재생</button>
        <span className="text-sm text-zinc-400">사용자가 시점 {KEYS.map((k) => k.at).join(', ')}에 r, e, a를 입력</span>
      </div>
      <div className="mt-5 min-w-[560px] space-y-6">
        {Object.entries(LANES).map(([key, lane]) => {
          const typed = KEYS.filter((k) => t >= (key === 'sync' ? lane.inputShownAt() : lane.inputShownAt(k.at))).map((k) => k.ch).join('');
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <b>{lane.title}</b>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">입력창:</span>
                  <span className="min-w-20 rounded border border-zinc-300 px-2 font-mono dark:border-zinc-700">{typed || ' '}<span className="animate-pulse">|</span></span>
                </span>
              </div>
              <div className="relative h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {lane.blocks.filter((b) => b.kind !== 'restart').map((b, i) => (
                  <div
                    key={i}
                    className={`absolute top-1.5 bottom-1.5 rounded-sm ${BLOCK_STYLE[b.kind]} transition-opacity`}
                    style={{ left: `${b.from}%`, width: `${Math.max(b.to - b.from, 0.6)}%`, opacity: t >= b.from ? 1 : 0.15 }}
                  />
                ))}
                {lane.blocks.filter((b) => b.kind === 'restart').map((b, i) => (
                  <div key={`r${i}`} className="absolute -top-4 text-[10px] text-rose-500" style={{ left: `${b.from}%`, opacity: t >= b.from ? 1 : 0 }}>↺</div>
                ))}
                {KEYS.map((k) => (
                  <div key={k.at} className="absolute -bottom-5 -translate-x-1/2 font-mono text-[11px] text-amber-600 dark:text-amber-400" style={{ left: `${k.at}%` }}>
                    key: {k.ch}
                  </div>
                ))}
                <div className="absolute top-0 bottom-0 w-0.5 bg-rose-500" style={{ left: `${t}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8">
        <Legend items={[['bg-indigo-400', '렌더링 작업'], ['bg-amber-400', '키 입력 처리 (급함)'], ['bg-emerald-500', '화면에 반영(commit)']]} />
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>
        → 동기: 렌더가 끝날 때까지 키 입력 3개가 대기하다가 한꺼번에 찍힌다. 동시성: 렌더 사이사이 틈(빈칸)에 입력을 즉시 처리하고, 낡은 렌더는 버리고(↺) 최신 값으로 다시 시작한다.
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const WORDS = ['react', 'redux', 'router', 'render', 'ref', 'reducer', 'query', 'memo', 'suspense', 'lazy', 'transition', 'deferred', 'virtual', 'hook', 'state', 'effect', 'context', 'portal', 'fiber', 'concurrent'];
const ITEMS = Array.from({ length: 250 }, (_, i) => `${WORDS[i % WORDS.length]}-${i}`);

function ConcurrentDemo() {
  const [mode, setMode] = useState('sync');
  return (
    <Demo hint="검색창에 빠르게 'react'를 쳐보세요. 결과 아이템 하나가 1ms씩 걸리도록 일부러 느리게 만들어서, 목록 전체 렌더에 약 250ms 걸립니다. 오른쪽 위 공이 멈추면 메인 스레드가 막힌 것!">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'sync', label: '일반 (동기)' },
            { value: 'deferred', label: 'useDeferredValue' },
            { value: 'transition', label: 'useTransition' },
          ]}
        />
        <Heartbeat />
      </div>
      <div className="mt-4">
        {mode === 'sync' && <SyncSearch />}
        {mode === 'deferred' && <DeferredSearch />}
        {mode === 'transition' && <TransitionSearch />}
      </div>
    </Demo>
  );
}

// requestAnimationFrame으로 움직이는 공. 메인 스레드가 막히면 같이 멈춘다.
function Heartbeat() {
  const ref = useRef(null);
  useEffect(() => {
    let id;
    const loop = (now) => {
      if (ref.current) ref.current.style.transform = `translateX(${(Math.sin(now / 250) + 1) * 40}px)`;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      메인 스레드
      <div className="relative h-5 w-24 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div ref={ref} className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}

function SearchInputBox({ value, onChange, pending }) {
  return (
    <div className="flex items-center gap-3">
      <input className={`${ui.input} w-full`} placeholder="검색어 입력 (예: react)" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className={`w-28 shrink-0 text-xs font-semibold ${pending ? ui.warn : 'text-zinc-400'}`}>{pending ? '결과 준비 중' : '최신'}</span>
    </div>
  );
}

function SyncSearch() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchInputBox value={query} onChange={setQuery} pending={false} />
      <SlowList query={query} />
    </>
  );
}

function DeferredSearch() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;
  return (
    <>
      <SearchInputBox value={query} onChange={setQuery} pending={isStale} />
      <div className={`transition-opacity ${isStale ? 'opacity-50' : ''}`}>
        <SlowList query={deferredQuery} />
      </div>
    </>
  );
}

function TransitionSearch() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const onChange = (v) => {
    setText(v);
    startTransition(() => setQuery(v));
  };
  return (
    <>
      <SearchInputBox value={text} onChange={onChange} pending={isPending} />
      <div className={`transition-opacity ${isPending ? 'opacity-50' : ''}`}>
        <SlowList query={query} />
      </div>
    </>
  );
}

const SlowList = memo(function SlowList({ query }) {
  const filtered = ITEMS.filter((it) => it.includes(query.trim().toLowerCase()));
  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-zinc-400">"{query}" 결과 {filtered.length}개 (최대 250개 렌더)</p>
      <ul className="grid max-h-72 grid-cols-2 gap-1 overflow-auto sm:grid-cols-4">
        {ITEMS.map((it) => <SlowItem key={it} text={it} hidden={!filtered.includes(it)} />)}
      </ul>
    </div>
  );
});

function SlowItem({ text, hidden }) {
  const start = performance.now();
  while (performance.now() - start < 1) {
    // 아이템 하나당 1ms — 무거운 컴포넌트를 흉내 낸다
  }
  if (hidden) return null;
  return <li className="truncate rounded bg-zinc-50 px-2 py-1 font-mono text-xs dark:bg-zinc-800/60">{text}</li>;
}
