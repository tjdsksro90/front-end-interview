import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, CodeCompare,
  Demo, Viz, Segmented, ui,
} from '../components/kit.jsx';

export default function ReactLazy() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React.lazy는 컴포넌트를 <u>동적 import()로 필요할 때 불러오게</u> 해주는 함수입니다. 번들러가 그 컴포넌트를 별도 파일(청크)로
          쪼개기 때문에, 첫 화면에서 받는 JS 용량이 줄어 초기 로딩이 빨라집니다. 로딩 중에 보여줄 화면은 Suspense로 지정합니다.
        </OneLiner>

        <H3>동작 원리</H3>
        <List
          items={[
            <>보통 <Code>import Admin from './Admin'</Code>은 빌드할 때 <b>하나의 큰 번들(main.js)</b>에 합쳐진다 → 사용자가 안 들어갈 페이지 코드까지 처음에 다 받는다.</>,
            <><Code>import('./Admin')</Code> (동적 import)를 쓰면 번들러(Vite, webpack)가 그 파일을 <b>별도 청크</b>로 분리한다. = <b>코드 스플리팅</b></>,
            <><Code>lazy(() =&gt; import('./Admin'))</Code>는 그 Promise를 컴포넌트처럼 쓸 수 있게 해준다. 처음 렌더될 때 다운로드를 시작하고, 끝날 때까지 가장 가까운 <b>Suspense의 fallback</b>을 보여준다.</>,
            <>한 번 받은 청크는 캐시되어서 두 번째부터는 바로 뜬다.</>,
            <>규칙: import하는 파일은 <b>default export</b> 컴포넌트여야 하고, lazy는 <b>컴포넌트 바깥(모듈 최상단)</b>에서 선언해야 한다 (안에서 하면 렌더마다 새로 만들어져 state가 초기화됨).</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>라우트(페이지) 단위</b> — 가장 효과가 크고 기본이 되는 위치. 사용자는 한 번에 한 페이지만 본다.</>,
            <>처음엔 안 보이는 <b>무거운 UI</b>: 모달, 에디터(리치 텍스트), 차트, 지도, PDF 뷰어</>,
            <>일부 사용자만 쓰는 기능: 관리자 페이지, 설정 화면</>,
            '번들 분석(rollup-plugin-visualizer 등)에서 큰 덩어리로 보이는 라이브러리를 쓰는 컴포넌트',
          ]}
          avoid={[
            '첫 화면에 바로 보이는 컴포넌트 (헤더, 메인 배너) — 오히려 요청이 하나 더 생겨 늦어진다',
            '작은 컴포넌트를 잘게 다 쪼개기 — 요청 수만 늘고 이득이 없다',
            'SSR이 필요한 곳 (Next.js에선 next/dynamic 사용)',
          ]}
        />
        <Callout type="tip" title="💡 UX 팁: 미리 불러오기(prefetch)">
          <p>버튼에 마우스를 올렸을 때(onMouseEnter) <Code>import('./Admin')</Code>을 미리 호출해 두면, 실제 클릭 시점엔 이미 받아져 있어 fallback이 거의 안 보입니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>사용자가 사이트에 처음 들어왔을 때 네트워크에서 어떤 JS 파일을 받는지 비교합니다. (용량은 예시)</p>
        <BundleViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            code: `
import Home from './pages/Home';
import Dashboard from './pages/Dashboard'; // 차트 라이브러리 포함 400KB
import Admin from './pages/Admin';         // 300KB

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}`,
            note: '홈만 보는 사용자도 Dashboard, Admin 코드까지 전부 받는다. 첫 화면이 늦게 뜬다.',
          }}
          after={{
            code: `
import { lazy, Suspense } from 'react';
import Home from './pages/Home'; // 첫 화면은 그대로

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  );
}`,
            note: '첫 접속엔 Home 코드만 받고, /dashboard로 이동하는 순간 Dashboard 청크를 받는다.',
          }}
        />
        <Callout title="📌 이 사이트도 이렇게 만들어져 있어요">
          <p>각 개념 페이지가 <Code>lazy(() =&gt; import('./MemoUseMemo.jsx'))</Code>처럼 등록되어 있어서, 개념에 들어갈 때 그 페이지 파일만 받습니다. 배포된 사이트에서 개발자도구 → Network 탭을 열고 개념을 클릭해 보세요.</p>
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <LazyDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const SCENARIOS = {
  bundle: {
    first: [{ name: 'main.js (Home + Dashboard + Admin)', kb: 900 }],
    nav: [],
    note: '모든 페이지 코드가 한 파일이라 첫 다운로드가 크다. 대신 이후 이동은 추가 요청이 없다.',
  },
  lazy: {
    first: [{ name: 'main.js (Home)', kb: 200 }],
    nav: [{ name: 'Dashboard-[hash].js', kb: 400 }],
    note: '첫 화면은 200KB만 받아서 훨씬 빨리 뜬다. Dashboard로 이동하는 순간 그 청크만 추가로 받는다.',
  },
};

function BundleViz() {
  const [mode, setMode] = useState('bundle');
  const [step, setStep] = useState(0);
  const s = SCENARIOS[mode];
  const rows = [...(step >= 1 ? s.first : []), ...(step >= 2 ? s.nav.map((r) => ({ ...r, later: true })) : [])];

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={mode}
          onChange={(v) => { setMode(v); setStep(0); }}
          options={[{ value: 'bundle', label: '일반 import' }, { value: 'lazy', label: 'React.lazy' }]}
        />
        <button className={ui.btnPrimary} onClick={() => setStep(1)}>① 사이트 첫 접속</button>
        <button className={ui.btn} disabled={step < 1} onClick={() => setStep(2)}>② /dashboard 로 이동</button>
      </div>
      <div className="mt-5 min-w-[460px] space-y-2">
        <div className="flex justify-between font-mono text-[11px] text-zinc-400">
          <span>Network</span><span>0KB ─────────────── 900KB</span>
        </div>
        {rows.length === 0 && <p className={`py-6 text-center text-sm ${ui.muted}`}>버튼을 눌러보세요</p>}
        {rows.map((r) => <NetRow key={`${mode}${r.name}`} {...r} />)}
      </div>
      {step >= 1 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/60">
            <div className={`text-lg font-bold ${mode === 'lazy' ? ui.good : ui.bad}`}>{s.first.reduce((a, r) => a + r.kb, 0)}KB</div>
            <div className="text-xs text-zinc-400">첫 화면까지 받은 JS</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/60">
            <div className="text-lg font-bold">{step >= 2 ? `${s.nav.reduce((a, r) => a + r.kb, 0)}KB` : '-'}</div>
            <div className="text-xs text-zinc-400">페이지 이동 시 추가로 받은 JS</div>
          </div>
        </div>
      )}
      {step >= 1 && <p className={`mt-3 text-sm ${ui.muted}`}>→ {s.note}</p>}
    </Viz>
  );
}

function NetRow({ name, kb, later }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth((kb / 900) * 100));
    return () => cancelAnimationFrame(id);
  }, [kb]);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-56 shrink-0 truncate font-mono">{name}</span>
      <div className="h-4 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-4 rounded ${later ? 'bg-sky-500' : 'bg-indigo-500'}`}
          style={{ width: `${width}%`, transition: `width ${kb * 2}ms linear` }}
        />
      </div>
      <span className="w-14 text-right tabular-nums">{kb}KB</span>
    </div>
  );
}

/* ---------- 데모 ---------- */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function LazyDemo() {
  const [attempt, setAttempt] = useState(0);
  const [log, setLog] = useState([]);
  const [delay, setDelay] = useState(1500);

  // 데모를 반복할 수 있게 시도마다 새 lazy 컴포넌트를 만든다. (실제 코드에선 모듈 최상단에 한 번만 선언!)
  const Widget = useMemo(() => {
    if (attempt === 0) return null;
    const started = performance.now();
    return lazy(() =>
      wait(delay)
        .then(() => import('./demo/HeavyWidget.jsx'))
        .then((mod) => {
          setLog((l) => [`#${attempt} import() 완료 — ${Math.round(performance.now() - started)}ms 걸림`, ...l]);
          return mod;
        })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <Demo hint="버튼을 누르면 그때 HeavyWidget.jsx를 불러옵니다. 느린 네트워크를 흉내 내려고 지연을 넣었어요. 받는 동안 Suspense의 fallback이 보입니다.">
      <div className="flex flex-wrap items-center gap-3">
        <button className={ui.btnPrimary} onClick={() => { setAttempt((a) => a + 1); setLog((l) => [`#${attempt + 1} lazy 컴포넌트 렌더 → import() 시작`, ...l]); }}>
          {attempt ? '다시 불러오기' : '차트 컴포넌트 불러오기'}
        </button>
        <label className="text-sm">
          네트워크 지연{' '}
          <select className={ui.input} value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
            <option value={300}>빠름 (0.3초)</option>
            <option value={1500}>보통 (1.5초)</option>
            <option value={3000}>느림 (3초)</option>
          </select>
        </label>
      </div>
      <div className="mt-4 min-h-[220px]">
        {Widget ? (
          <Suspense key={attempt} fallback={<Skeleton />}>
            <Widget />
          </Suspense>
        ) : (
          <div className={`grid h-[220px] place-items-center rounded-xl border border-zinc-200 text-sm dark:border-zinc-800 ${ui.muted}`}>
            아직 HeavyWidget 코드를 받지 않았어요
          </div>
        )}
      </div>
      {log.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
          {log.slice(0, 5).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </Demo>
  );
}

function Skeleton() {
  return (
    <div className="h-[220px] animate-pulse rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">⏳ Suspense fallback 표시 중… (청크 다운로드 중)</div>
      <div className="mt-6 flex h-32 items-end gap-1.5">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="flex-1 rounded-t bg-zinc-200 dark:bg-zinc-800" style={{ height: `${30 + ((i * 37) % 60)}%` }} />
        ))}
      </div>
    </div>
  );
}
