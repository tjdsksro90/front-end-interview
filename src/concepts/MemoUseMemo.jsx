import { memo, useMemo, useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Toggle, Segmented, RenderBadge, useRenderCount, Stat, ui,
} from '../components/kit.jsx';

export default function MemoUseMemo() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          둘 다 "입력이 같으면 이전 결과를 재사용"하는 메모이제이션입니다. React.memo는 <u>컴포넌트</u>를 감싸서
          props가 같으면 리렌더를 건너뛰고, useMemo는 컴포넌트 안에서 <u>계산 결과 값</u>을 의존성이 같을 때 재사용합니다.
        </OneLiner>

        <H3>먼저 알아야 할 것: React는 언제 리렌더하나?</H3>
        <List
          items={[
            <>컴포넌트의 <b>state가 바뀌면</b> 그 컴포넌트가 다시 렌더된다.</>,
            <><b>부모가 렌더되면 자식도 전부 다시 렌더된다</b> — props가 바뀌지 않았어도! 이게 최적화의 출발점.</>,
            <>렌더 = 함수 컴포넌트를 다시 호출하는 것. 그래서 함수 안의 모든 계산·객체·함수가 <b>매번 새로 만들어진다</b>.</>,
          ]}
        />

        <H3>React.memo — 컴포넌트를 기억한다</H3>
        <List
          items={[
            <><Code>memo(Component)</Code>로 감싸면, 부모가 리렌더될 때 <b>이전 props와 새 props를 얕은 비교(Object.is)</b>해서 같으면 렌더를 건너뛴다.</>,
            <>얕은 비교라서 <b>객체·배열·함수 props는 매번 새로 만들어지면 "다르다"고 판단</b> → memo가 무력화된다. (→ useMemo / useCallback이 필요한 이유)</>,
            <>자기 state나 사용 중인 context가 바뀌면 memo여도 리렌더된다.</>,
          ]}
        />

        <H3>useMemo — 값을 기억한다</H3>
        <List
          items={[
            <><Code>useMemo(() =&gt; 계산, [의존성])</Code> — 의존성 배열의 값이 바뀌었을 때만 다시 계산하고, 아니면 저장해 둔 값을 돌려준다.</>,
            <>쓰임새 두 가지: ① <b>비싼 계산</b>을 매 렌더마다 반복하지 않기 ② <b>객체/배열의 참조를 유지</b>해서 memo된 자식이나 useEffect 의존성이 불필요하게 반응하지 않게 하기.</>,
          ]}
        />

        <Table
          head={['', 'React.memo', 'useMemo']}
          rows={[
            ['무엇을 기억?', '컴포넌트의 렌더 결과', '함수가 반환한 값'],
            ['어디에 쓰나?', '컴포넌트 바깥에서 감싼다 (HOC)', '컴포넌트 안에서 쓰는 Hook'],
            ['언제 다시 실행?', 'props가 (얕은 비교로) 바뀌었을 때', '의존성 배열 값이 바뀌었을 때'],
            ['막아주는 것', '불필요한 자식 리렌더', '불필요한 재계산 / 참조 변경'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>React.memo</b>: 부모가 자주 리렌더되는데(입력, 타이머, 스크롤 등) 자식은 props가 거의 안 바뀌고, 그 자식이 무거울 때 (큰 리스트, 차트, 에디터)</>,
            <><b>useMemo</b>: 필터·정렬·집계처럼 데이터가 많아 계산이 눈에 띄게 느릴 때 (1ms 이상)</>,
            <><b>useMemo</b>: memo된 자식에게 객체/배열을 props로 넘기거나, useEffect 의존성에 객체가 들어갈 때 참조를 고정하려고</>,
          ]}
          avoid={[
            '렌더가 원래 가벼운 컴포넌트 (버튼, 텍스트) — 비교 비용이 더 들 수 있음',
            'props가 거의 매번 바뀌는 컴포넌트 — 비교만 하고 결국 렌더함',
            '단순 계산 (a + b, 짧은 배열 map) — useMemo 자체의 비용·가독성 손해가 더 큼',
            '측정 없이 "혹시 몰라서" 전부 감싸기',
          ]}
        />
        <Callout type="tip" title="💡 면접 포인트">
          <p>"메모이제이션도 공짜가 아니다 — 이전 값을 저장하는 메모리와 매번 비교하는 비용이 든다. 그래서 React DevTools Profiler로 실제로 느린 곳을 확인하고 적용한다"까지 말하면 좋습니다.</p>
          <p>React 19의 <b>React Compiler</b>는 이런 메모이제이션을 빌드 시점에 자동으로 넣어줍니다. 그래도 원리를 알아야 언제 컴파일러가 최적화하지 못하는지 이해할 수 있어요.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>부모의 state가 바뀌었을 때 어떤 자식이 다시 렌더되는지 보세요. <b>Counter</b>만 바뀐 props(count)를 받습니다.</p>
        <TreeViz />
        <H3>useMemo는 의존성을 이렇게 비교한다</H3>
        <DepsViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>React.memo</H3>
        <CodeCompare
          before={{
            code: `
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>+1</button>
      {/* count와 상관없는데 매번 같이 렌더됨 */}
      <HeavyChart data={chartData} />
    </>
  );
}

function HeavyChart({ data }) {
  // 그리는 데 50ms 걸리는 무거운 컴포넌트
}`,
            note: '버튼을 누를 때마다 Parent가 렌더 → HeavyChart도 매번 다시 그려져서 클릭이 버벅인다.',
          }}
          after={{
            code: `
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <HeavyChart data={chartData} />
    </>
  );
}

// props(data)가 같으면 렌더를 건너뛴다
const HeavyChart = memo(function HeavyChart({ data }) {
  // ...
});`,
            note: 'data의 참조가 그대로라면 count가 바뀌어도 HeavyChart는 렌더되지 않는다.',
          }}
        />

        <H3>useMemo</H3>
        <CodeCompare
          before={{
            code: `
function ProductList({ products, keyword }) {
  const [isDark, setIsDark] = useState(false);

  // 테마만 바꿔도 10,000개를 다시 필터·정렬
  const visible = products
    .filter((p) => p.name.includes(keyword))
    .sort((a, b) => a.price - b.price);

  return <List items={visible} dark={isDark} />;
}`,
            note: 'keyword와 상관없는 isDark가 바뀌어도 무거운 계산이 반복된다.',
          }}
          after={{
            code: `
function ProductList({ products, keyword }) {
  const [isDark, setIsDark] = useState(false);

  // products, keyword가 바뀔 때만 다시 계산
  const visible = useMemo(
    () => products
      .filter((p) => p.name.includes(keyword))
      .sort((a, b) => a.price - b.price),
    [products, keyword]
  );

  return <List items={visible} dark={isDark} />;
}`,
            note: 'isDark만 바뀌면 저장해 둔 visible을 그대로 쓴다. 참조도 같아서 memo(List)도 제대로 동작한다.',
          }}
        />

        <Callout type="warn" title="⚠️ 자주 하는 실수: memo했는데 왜 계속 렌더되지?">
          <p>props로 객체·배열·함수를 <b>렌더 중에 새로 만들어서</b> 넘기면 매번 참조가 달라져 memo가 무력화됩니다.</p>
          <CodeBlock
            code={`
// ❌ 렌더마다 새 객체 → memo(Chart)가 항상 "props 바뀜"으로 판단
<Chart options={{ color: 'red' }} />

// ✅ 참조 고정
const options = useMemo(() => ({ color: 'red' }), []);
<Chart options={options} />
// (값이 고정이라면 컴포넌트 밖 상수로 빼는 게 가장 간단)`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>A. React.memo — 자식 리렌더 막기</H3>
        <MemoDemo />
        <H3>B. useMemo — 무거운 계산 건너뛰기</H3>
        <UseMemoDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

function TreeViz() {
  const [memoOn, setMemoOn] = useState(false);
  const [tick, setTick] = useState(0);

  const children = [
    { name: 'Header', props: 'title="쇼핑몰"', changed: false },
    { name: 'Counter', props: 'count={count}', changed: true },
    { name: 'ProductList', props: 'items={items}', changed: false },
  ];
  const status = (changed) => (tick === 0 ? 'idle' : !memoOn || changed ? 'rendered' : 'skipped');

  return (
    <Viz>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Toggle checked={memoOn} onChange={setMemoOn} label="자식에 React.memo 적용" />
        <button className={ui.btnPrimary} onClick={() => setTick((t) => t + 1)}>부모 setCount(count + 1)</button>
      </div>
      <div className="flex min-w-[460px] flex-col items-center gap-6">
        <Node key={`p${tick}`} name="App (부모)" sub={`state: count = ${tick}`} status={tick ? 'rendered' : 'idle'} />
        <div className="flex justify-center gap-3">
          {children.map((c) => (
            <Node
              key={`${c.name}${tick}${memoOn}`}
              name={memoOn ? `memo(${c.name})` : c.name}
              sub={c.props}
              status={status(c.changed)}
            />
          ))}
        </div>
      </div>
      <Legend items={[['bg-amber-300', '렌더됨'], ['border-2 border-dashed border-emerald-500', '건너뜀 (props 같음)']]} />
      {tick > 0 && (
        <p className={`mt-3 text-sm ${ui.muted}`}>
          {memoOn
            ? '→ Header와 ProductList는 props가 이전과 같아서 렌더를 건너뛰었다. Counter만 바뀐 count를 받아서 렌더.'
            : '→ 부모가 렌더되니 props가 안 바뀐 Header, ProductList까지 전부 다시 렌더됐다.'}
        </p>
      )}
    </Viz>
  );
}

export function Node({ name, sub, status }) {
  const cls = {
    idle: 'border-zinc-200 dark:border-zinc-700',
    rendered: 'animate-flash border-amber-400 bg-amber-50 dark:bg-amber-500/10',
    skipped: 'border-dashed border-emerald-500 opacity-80',
  }[status];
  return (
    <div className={`min-w-[130px] rounded-xl border-2 px-3 py-2 text-center transition ${cls}`}>
      <div className="text-sm font-semibold">{name}</div>
      <div className="font-mono text-[11px] text-zinc-400">{sub}</div>
      {status === 'skipped' && <div className={`text-[11px] font-bold ${ui.good}`}>건너뜀</div>}
      {status === 'rendered' && <div className={`text-[11px] font-bold ${ui.warn}`}>렌더</div>}
    </div>
  );
}

function DepsViz() {
  const [keyword, setKeyword] = useState('react');
  const [dark, setDark] = useState(false);
  const [log, setLog] = useState([]);
  const prevDeps = useRef(['react']);

  const rerender = (nextKeyword, nextDark, reason) => {
    const same = Object.is(prevDeps.current[0], nextKeyword);
    setLog((l) => [
      { id: l.length + 1, reason, prev: prevDeps.current[0], next: nextKeyword, same },
      ...l,
    ].slice(0, 6));
    prevDeps.current = [nextKeyword];
    setKeyword(nextKeyword);
    setDark(nextDark);
  };

  return (
    <Viz>
      <CodeBlock code={`const visible = useMemo(() => filter(products, keyword), [keyword]);`} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button className={ui.btn} onClick={() => rerender(keyword, !dark, `setDark(${!dark})`)}>
          관련 없는 state 변경 (테마)
        </button>
        <button
          className={ui.btn}
          onClick={() => {
            const next = keyword === 'react' ? 'vue' : 'react';
            rerender(next, dark, `setKeyword('${next}')`);
          }}
        >
          keyword 변경
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {log.length === 0 && <p className={`text-sm ${ui.muted}`}>버튼을 눌러 렌더를 일으켜 보세요.</p>}
        {log.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs dark:bg-zinc-800/60">
            <span className="text-zinc-400">렌더 #{r.id}</span>
            <span>{r.reason}</span>
            <span className="text-zinc-400">→ deps</span>
            <span>['{r.prev}'] vs ['{r.next}']</span>
            {r.same ? (
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">같음 → 저장된 값 사용</span>
            ) : (
              <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">다름 → 다시 계산</span>
            )}
          </div>
        ))}
      </div>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

function MemoDemo() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('홍길동');
  const [memoOn, setMemoOn] = useState(false);
  const Card = memoOn ? MemoProfileCard : ProfileCard;

  return (
    <Demo hint="memo를 끈 상태에서 '+1'을 눌러 보고, 켠 상태에서 다시 눌러 보세요. 이름을 바꾸면 memo여도 렌더됩니다.">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle checked={memoOn} onChange={setMemoOn} label="React.memo" />
        <button className={ui.btnPrimary} onClick={() => setCount((c) => c + 1)}>count +1 (현재 {count})</button>
        <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} aria-label="이름" />
      </div>
      <div className="mt-4">
        <Card name={name} />
      </div>
    </Demo>
  );
}

function ProfileCard({ name }) {
  const renders = useRenderCount();
  return (
    <div className={ui.box}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">👤 ProfileCard</span>
        <RenderBadge count={renders} />
      </div>
      <p className={`mt-1 text-sm ${ui.muted}`}>props: name="{name}" (count는 받지 않음)</p>
    </div>
  );
}
const MemoProfileCard = memo(ProfileCard);

// 일부러 느리게 만든 계산: n 이하 소수 개수 + 최소 120ms 대기
function slowCountPrimes(n) {
  const start = performance.now();
  while (performance.now() - start < 120) {
    // 무거운 계산을 흉내 내기 위해 메인 스레드를 잡아둔다
  }
  let count = 0;
  for (let i = 2; i <= n; i++) {
    let prime = true;
    for (let j = 2; j * j <= i; j++) if (i % j === 0) { prime = false; break; }
    if (prime) count++;
  }
  return count;
}

function UseMemoDemo() {
  const [mode, setMode] = useState('off');
  return (
    <Demo hint="'관련 없는 state 변경'을 연타해 보세요. useMemo가 없으면 매번 120ms 계산이 돌아서 버튼 반응이 느려집니다.">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[{ value: 'off', label: 'useMemo 없음' }, { value: 'on', label: 'useMemo 사용' }]}
      />
      <div className="mt-4">{mode === 'off' ? <CalcPlain /> : <CalcMemo />}</div>
    </Demo>
  );
}

function useCalcStats() {
  const stats = useRef({ calls: 0, ms: 0 });
  const measure = (n) => {
    const t = performance.now();
    const result = slowCountPrimes(n);
    stats.current = { calls: stats.current.calls + 1, ms: Math.round(performance.now() - t) };
    return result;
  };
  return [stats, measure];
}

function CalcPlain() {
  const [n, setN] = useState(20000);
  const [other, setOther] = useState(0);
  const [stats, measure] = useCalcStats();
  const primes = measure(n);
  return <CalcView {...{ n, setN, other, setOther, primes }} stats={stats.current} />;
}

function CalcMemo() {
  const [n, setN] = useState(20000);
  const [other, setOther] = useState(0);
  const [stats, measure] = useCalcStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const primes = useMemo(() => measure(n), [n]);
  return <CalcView {...{ n, setN, other, setOther, primes }} stats={stats.current} />;
}

function CalcView({ n, setN, other, setOther, primes, stats }) {
  const renders = useRenderCount();
  return (
    <div className={ui.box}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">n =</label>
        <input type="number" step={1000} className={`${ui.input} w-28`} value={n} onChange={(e) => setN(Number(e.target.value) || 0)} />
        <button className={ui.btn} onClick={() => setOther((o) => o + 1)}>관련 없는 state 변경 ({other})</button>
        <RenderBadge count={renders} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label={`${n} 이하 소수`} value={primes.toLocaleString()} />
        <Stat label="계산 실행 횟수" value={`${stats.calls}회`} />
        <Stat label="마지막 계산" value={`${stats.ms}ms`} />
      </div>
    </div>
  );
}
