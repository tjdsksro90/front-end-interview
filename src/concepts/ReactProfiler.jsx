import { memo, Profiler, useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Toggle, Stat, ui,
} from '../components/kit.jsx';
import { WhereToCheck } from '../components/screens.jsx';

export default function ReactProfiler() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React Profiler는 <u>어떤 컴포넌트가 몇 번, 얼마나 오래, 왜 렌더됐는지</u>를 기록하는 도구입니다.
          React DevTools의 Profiler 탭으로 눈으로 보고, 코드에서는 <Code>{'<Profiler onRender>'}</Code>로 수치를 직접 받을 수 있습니다.
        </OneLiner>

        <H3>DevTools Profiler 화면 읽는 법</H3>
        <List
          items={[
            <><b>커밋(commit)</b>: React가 화면에 변경을 반영한 한 번. 오른쪽 위 막대 하나가 커밋 하나, 높을수록 오래 걸림.</>,
            <><b>Flamegraph</b>: 컴포넌트 트리. 막대 너비 = 렌더 시간, 색 = 노랑일수록 느림 / 초록 빠름 / <b>회색 = 이번 커밋에서 렌더 안 됨</b>(memo 효과 확인).</>,
            <><b>Ranked</b>: 이번 커밋에서 오래 걸린 컴포넌트 순서대로.</>,
            <><b>왜 렌더됐나</b>: 설정(톱니) → "Record why each component rendered while profiling" 체크 → 컴포넌트 클릭 시 "Props changed: onClick" 같은 이유가 나온다.</>,
            <>설정 → "Highlight updates when components render": 렌더되는 영역이 화면에서 테두리로 깜빡인다.</>,
          ]}
        />

        <H3>{'<Profiler>'} API의 onRender 값</H3>
        <Table
          head={['인자', '뜻']}
          rows={[
            [<Code>id</Code>, 'Profiler에 붙인 이름'],
            [<Code>phase</Code>, '"mount"(처음) / "update"(다시 렌더) / "nested-update"'],
            [<Code>actualDuration</Code>, <>이번 커밋에서 <b>실제로</b> 렌더하는 데 걸린 시간. memo로 건너뛴 자식은 빠진다 → 최적화 효과가 여기서 보인다</>],
            [<Code>baseDuration</Code>, '메모이제이션 없이 전체를 렌더하면 걸릴 예상 시간 (최악의 경우)'],
            [<><Code>startTime</Code>, <Code>commitTime</Code></>, '렌더 시작 / 커밋 시각'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>"느리다"는 제보가 왔을 때 원인 찾기</b>: 어떤 컴포넌트가 오래 걸리는지 감이 아니라 숫자로</>,
            <><b>memo/useMemo/useCallback 적용 전후 비교</b>: 회색(건너뜀)이 늘었는지, actualDuration이 줄었는지</>,
            '불필요한 리렌더 추적: 입력 한 글자에 목록 전체가 렌더되는지',
            '중요한 화면에 <Profiler>를 심어 렌더 시간을 모니터링 서버로 전송',
          ]}
          avoid={[
            'production 빌드에서 그냥 측정 — 기본 production 빌드는 프로파일링이 꺼져 있다 (profiling 빌드 필요)',
            '개발 모드 수치를 절대값으로 믿기 — 개발 모드는 검사 코드 때문에 실제보다 느리다. 상대 비교용으로 본다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>DevTools Profiler에서 입력창에 한 글자 친 커밋을 연 화면을 단순화했습니다. 막대를 클릭하면 커밋을 바꿔 볼 수 있습니다.</p>
        <FlamegraphViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'console.time으로 대충',
            code: `
function ProductList({ items }) {
  console.time('render');
  const result = items.map(...);
  console.timeEnd('render');   // 렌더 함수 실행만 잰다
  return result;
}
// 자식 렌더 시간, 커밋 단위, 건너뛴 컴포넌트는 알 수 없다`,
            note: '컴포넌트 함수 호출 시간만 재고, 자식 트리 전체와 실제 커밋은 알 수 없다.',
          }}
          after={{
            label: '<Profiler>',
            code: `
import { Profiler } from 'react';

function onRender(id, phase, actualDuration, baseDuration) {
  if (actualDuration > 16) {      // 한 프레임(16ms)을 넘으면 기록
    sendToAnalytics({ id, phase, actualDuration, baseDuration });
  }
}

<Profiler id="ProductList" onRender={onRender}>
  <ProductList items={items} />
</Profiler>`,
            note: '자식 트리 전체의 렌더 시간을 커밋마다 받는다. 여러 개를 중첩해서 구역별로 잴 수도 있다.',
          }}
        />
        <Callout title="production에서도 측정하려면">
          <CodeBlock
            code={`
// webpack/vite alias로 profiling 빌드 사용 (약간 느려짐)
resolve: { alias: { 'react-dom/client': 'react-dom/profiling' } }`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <ProfilerDemo />
        <H3>DevTools로 같은 걸 보려면</H3>
        <WhereToCheck
          items={[
            { where: 'React DevTools 설치', path: ['Chrome 웹 스토어', 'React Developer Tools'], what: '설치하면 F12에 Components, Profiler 탭이 생긴다.' },
            { where: '녹화', path: ['F12', 'Profiler', '● 녹화', '화면 조작', '■ 정지'], what: '위 데모에서 입력창에 몇 글자 쳐보고 정지하면 커밋 막대와 flamegraph가 나온다.' },
            { where: '렌더 이유 보기', path: ['Profiler', '톱니(설정)', 'Profiler', 'Record why each component rendered'], what: '체크 후 다시 녹화 → 컴포넌트 클릭 시 오른쪽에 "Why did this render?"' },
          ]}
        />
      </Section>
    </>
  );
}

/* ---------- 시각화: flamegraph 모형 ---------- */

const COMMITS = [
  {
    label: '#1 mount', ms: 48,
    nodes: [['App', 48, 0, 'slow'], ['SearchInput', 2, 1, 'fast'], ['ProductList', 44, 1, 'slow'], ['ProductItem ×100', 40, 2, 'slow']],
    note: '처음 그릴 때(mount)는 모두 렌더된다.',
  },
  {
    label: '#2 입력 (memo 없음)', ms: 46,
    nodes: [['App', 46, 0, 'slow'], ['SearchInput', 2, 1, 'fast'], ['ProductList', 42, 1, 'slow'], ['ProductItem ×100', 39, 2, 'slow']],
    note: '한 글자 입력했을 뿐인데 ProductItem 100개가 전부 다시 렌더 (노랑). "Why did this render? → The parent component rendered."',
  },
  {
    label: '#3 입력 (memo 적용)', ms: 4,
    nodes: [['App', 4, 0, 'fast'], ['SearchInput', 2, 1, 'fast'], ['ProductList', 0, 1, 'skip'], ['ProductItem ×100', 0, 2, 'skip']],
    note: 'memo 적용 후: ProductList 이하가 회색 = 이번 커밋에서 렌더 안 됨. 커밋 시간 46ms → 4ms.',
  },
];
const NODE_STYLE = { slow: 'bg-amber-300 text-amber-900', fast: 'bg-emerald-300 text-emerald-900', skip: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400' };

function FlamegraphViz() {
  const [i, setI] = useState(1);
  const c = COMMITS[i];
  const max = Math.max(...COMMITS.map((x) => x.ms));
  return (
    <Viz>
      <div className="flex items-end justify-end gap-1.5">
        {COMMITS.map((x, n) => (
          <button key={x.label} onClick={() => setI(n)} title={x.label} className={`w-6 rounded-sm ${n === i ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-zinc-900' : ''} ${x.ms > 16 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ height: `${10 + (x.ms / max) * 40}px` }} />
        ))}
      </div>
      <div className="mt-2 text-right text-xs text-zinc-400">커밋 {c.label} · {c.ms}ms</div>
      <div className="mt-3 min-w-[460px] space-y-1">
        {c.nodes.map(([name, ms, depth, kind]) => (
          <div key={name} style={{ marginLeft: `${depth * 8}%` }}>
            <div className={`truncate rounded px-2 py-1.5 font-mono text-xs font-semibold ${NODE_STYLE[kind]}`} style={{ width: kind === 'skip' ? `${100 - depth * 8}%` : `${Math.max(12, (ms / 48) * (100 - depth * 8))}%` }}>
              {name} {kind === 'skip' ? '(Did not render)' : `${ms}ms`}
            </div>
          </div>
        ))}
      </div>
      <Legend items={[['bg-amber-300', '느림'], ['bg-emerald-300', '빠름'], ['bg-zinc-300', '이번 커밋에서 렌더 안 됨']]} />
      <p className={`mt-3 text-sm ${ui.muted}`}>→ {c.note}</p>
    </Viz>
  );
}

/* ---------- 데모: 실제 <Profiler> ---------- */

const PRODUCTS = Array.from({ length: 60 }, (_, i) => `상품 ${i + 1}`);

function ProfilerDemo() {
  const [memoOn, setMemoOn] = useState(false);
  const [text, setText] = useState('');
  const [records, setRecords] = useState([]);
  const pending = useRef([]);

  // onRender 안에서 setState를 하면 렌더가 또 일어나므로, 모아뒀다가 다음 이벤트 때 반영
  const onRender = (id, phase, actualDuration, baseDuration) => {
    pending.current.push({ id, phase, actual: actualDuration, base: baseDuration });
  };
  const flush = () => {
    if (pending.current.length) {
      const next = pending.current;
      pending.current = [];
      setRecords((r) => [...next.reverse(), ...r].slice(0, 8));
    }
  };

  const Products = memoOn ? MemoProductList : ProductList;
  const last = records.find((r) => r.id === 'ProductList');

  return (
    <Demo hint="입력창에 글자를 쳐보세요. 각 상품은 렌더에 약 0.3ms가 걸리게 만들었습니다. memo를 켜면 ProductList의 actualDuration이 0 근처로 떨어집니다. (개발 모드 수치)">
      <div className="flex flex-wrap items-center gap-3">
        <Toggle checked={memoOn} onChange={(v) => { setMemoOn(v); setRecords([]); }} label="ProductList에 memo" />
        <input className={`${ui.input} flex-1`} placeholder="입력 (부모 state 변경)" value={text} onChange={(e) => { flush(); setText(e.target.value); }} onKeyUp={flush} />
        <button className={ui.btn} onClick={flush}>기록 새로고침</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="ProductList 마지막 actualDuration" value={last ? `${last.actual.toFixed(1)}ms` : '-'} tone={last ? (last.actual > 5 ? 'bad' : 'good') : undefined} />
        <Stat label="같은 커밋의 baseDuration (memo 없을 때 예상)" value={last ? `${last.base.toFixed(1)}ms` : '-'} />
      </div>
      <Profiler id="App" onRender={onRender}>
        <Profiler id="ProductList" onRender={onRender}>
          <Products />
        </Profiler>
      </Profiler>
      <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-700">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800"><tr><th className="px-3 py-1.5">id</th><th className="px-3 py-1.5">phase</th><th className="px-3 py-1.5">actualDuration</th><th className="px-3 py-1.5">baseDuration</th></tr></thead>
          <tbody>
            {records.length === 0 && <tr><td colSpan={4} className="px-3 py-2 text-zinc-400">입력하면 onRender 기록이 쌓입니다</td></tr>}
            {records.map((r, i) => (
              <tr key={i} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-1.5">{r.id}</td><td className="px-3 py-1.5">{r.phase}</td>
                <td className={`px-3 py-1.5 ${r.actual > 5 ? ui.bad : ui.good}`}>{r.actual.toFixed(2)}ms</td><td className="px-3 py-1.5">{r.base.toFixed(2)}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Demo>
  );
}

function ProductList() {
  return (
    <ul className="mt-3 grid max-h-32 grid-cols-3 gap-1 overflow-auto sm:grid-cols-6">
      {PRODUCTS.map((p) => <ProductItem key={p} name={p} />)}
    </ul>
  );
}
const MemoProductList = memo(ProductList);

function ProductItem({ name }) {
  const t = performance.now();
  while (performance.now() - t < 0.3) {
    // 아이템 하나 렌더에 0.3ms (무거운 컴포넌트 흉내)
  }
  return <li className="truncate rounded bg-zinc-50 px-2 py-1 text-xs dark:bg-zinc-800/60">{name}</li>;
}
