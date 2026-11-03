import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeCompare,
  Demo, Viz, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function CodeSplitting() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          코드 스플리팅은 하나의 큰 JS 번들을 <u>여러 개의 작은 청크(chunk)로 나누는 것</u>입니다.
          첫 화면에 필요한 코드만 먼저 받아 초기 로딩을 줄이고, 잘 안 바뀌는 라이브러리를 따로 떼어 브라우저 캐시를 오래 쓰게 만듭니다.
        </OneLiner>

        <H3>왜 나누나? — 두 가지 이득</H3>
        <List
          items={[
            <><b>초기 로딩 감소</b>: 사용자는 한 번에 한 페이지만 본다. 안 볼 페이지 코드까지 처음에 받을 필요가 없다.</>,
            <><b>캐시 효율</b>: 빌드 결과 파일명에는 내용 해시가 붙는다(<Code>main.3f9a1c.js</Code>). 코드 한 줄만 고쳐도 해시가 바뀌어 <b>그 파일 전체를 다시 받는다</b>. React 같은 라이브러리를 별도 청크(vendor)로 떼어 두면, 내 코드만 바꿔 배포했을 때 vendor는 캐시에서 그대로 쓴다.</>,
          ]}
        />

        <H3>어디서 나뉘나? — 분할 지점 3가지</H3>
        <Table
          head={['방법', '설명', '예']}
          rows={[
            ['진입점(entry) 여러 개', '페이지/앱마다 entry를 따로 둔다 (MPA)', <Code>entry: {'{ main, admin }'}</Code>],
            ['동적 import()', '코드에서 import()를 만나면 번들러가 그 지점을 청크로 자른다. 가장 많이 쓰는 방식', <><Code>React.lazy</Code>, <Code>next/dynamic</Code></>],
            ['공통/라이브러리 분리', '여러 청크가 같이 쓰는 코드, node_modules를 별도 청크로', <><Code>splitChunks</Code>, Vite <Code>manualChunks</Code></>],
          ]}
        />
        <Callout title="React.lazy와의 관계">
          <p>
            React.lazy는 "동적 import()로 나뉜 청크를 컴포넌트로 쓰는 방법"이고, 코드 스플리팅은 그보다 넓은 <b>번들을 나누는 전략 전체</b>입니다.
            React.lazy 자체는 <Link className="text-indigo-600 dark:text-indigo-400" to="/react/in-react-optimization/deep/react-lazy">React.lazy 심화</Link>에서 다뤘어요.
            참고로 Next.js는 페이지(라우트)마다 자동으로 코드 스플리팅을 해 줍니다.
          </p>
        </Callout>

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>라우트 단위</b>: SPA에서 페이지가 여러 개일 때 — 가장 효과가 크고 기본</>,
            <><b>vendor 분리</b>: 배포가 잦은 서비스. 라이브러리 청크는 캐시가 오래 유지된다</>,
            '특정 페이지에서만 쓰는 무거운 라이브러리 (차트, 에디터, 지도) — 그 페이지 청크로만 들어가게',
            'Lighthouse에서 "사용하지 않는 JavaScript 줄이기" 경고가 뜰 때',
          ]}
          avoid={[
            '너무 잘게 쪼개기 — 요청 수가 늘고, 청크가 청크를 부르는 워터폴이 생긴다',
            '첫 화면에 바로 필요한 코드 — 나눠도 어차피 바로 받아야 해서 요청만 하나 늘어난다',
            '작은 앱 (번들이 100KB 남짓) — 체감 이득이 거의 없다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>같은 앱(홈, 대시보드)을 세 가지 방식으로 빌드했을 때, 사용자가 받는 파일을 단계별로 비교합니다. 3단계는 <b>홈 코드 한 줄만 고쳐서 재배포</b>한 뒤 다시 방문한 상황입니다.</p>
        <StrategyViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '나누지 않았을 때',
            code: `
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.[contenthash].js',
  },
};
// → main.js 하나에 React + 모든 페이지 + 차트 라이브러리`,
            note: '홈만 볼 사용자도 전부 받고, 코드 한 줄만 바꿔도 사용자는 400KB를 처음부터 다시 받는다.',
          }}
          after={{
            label: '나눴을 때',
            code: `
// 1) 라우트 단위: 동적 import → 페이지별 청크
const Dashboard = lazy(() => import('./pages/Dashboard'));

// 2) 라이브러리 분리 (webpack)
module.exports = {
  output: { filename: '[name].[contenthash].js' },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: { test: /node_modules/, name: 'vendor' },
      },
    },
    runtimeChunk: 'single', // 청크 연결 정보도 분리
  },
};

// Vite라면
build: { rollupOptions: { output: {
  manualChunks: { react: ['react', 'react-dom'] },
} } }`,
            note: '첫 방문엔 vendor + 홈만, 대시보드는 이동할 때. 재배포 후엔 바뀐 청크만 다시 받는다.',
          }}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <LoadedChunksDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const STRATEGIES = {
  single: {
    label: '나누지 않음',
    steps: [
      [{ name: 'main.js (React + 홈 + 대시보드 + 차트)', kb: 400 }],
      [],
      [{ name: 'main.js (해시 바뀜)', kb: 400 }],
    ],
    cachedOnRedeploy: [],
  },
  route: {
    label: '라우트 분할',
    steps: [
      [{ name: 'main.js (React + 홈)', kb: 170 }],
      [{ name: 'dashboard.js (대시보드 + 차트)', kb: 180 }],
      [{ name: 'main.js (해시 바뀜, React도 같이)', kb: 170 }],
    ],
    cachedOnRedeploy: ['dashboard.js'],
  },
  vendor: {
    label: '라우트 + vendor 분할',
    steps: [
      [{ name: 'vendor.js (React)', kb: 140 }, { name: 'home.js', kb: 30 }],
      [{ name: 'dashboard.js', kb: 60 }, { name: 'chart-vendor.js (차트 라이브러리)', kb: 120 }],
      [{ name: 'home.js (해시 바뀜)', kb: 30 }],
    ],
    cachedOnRedeploy: ['vendor.js', 'dashboard.js', 'chart-vendor.js'],
  },
};
const STEP_LABELS = ['① 첫 방문 (홈)', '② 대시보드로 이동', '③ 재배포 후 다시 방문 (홈)'];

function StrategyViz() {
  const [key, setKey] = useState('single');
  const s = STRATEGIES[key];
  const totals = s.steps.map((files) => files.reduce((a, f) => a + f.kb, 0));

  return (
    <Viz>
      <Segmented value={key} onChange={setKey} options={Object.entries(STRATEGIES).map(([value, v]) => ({ value, label: v.label }))} />
      <div className="mt-5 min-w-[460px] space-y-4">
        {s.steps.map((files, i) => (
          <div key={`${key}${i}`}>
            <div className="flex justify-between text-sm font-semibold">
              <span>{STEP_LABELS[i]}</span>
              <span className={totals[i] >= 300 ? ui.bad : totals[i] === 0 ? ui.good : ''}>{totals[i]}KB 다운로드</span>
            </div>
            <div className="mt-1.5 space-y-1">
              {files.length === 0 && <div className={`text-xs ${ui.muted}`}>추가 다운로드 없음 (이미 다 받았음)</div>}
              {files.map((f) => (
                <div key={f.name} className="flex items-center gap-3 text-xs">
                  <span className="w-60 shrink-0 truncate font-mono">{f.name}</span>
                  <div className="h-3.5 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                    <div className="h-3.5 rounded bg-indigo-500" style={{ width: `${(f.kb / 400) * 100}%` }} />
                  </div>
                  <span className="w-12 text-right tabular-nums">{f.kb}KB</span>
                </div>
              ))}
              {i === 2 && s.cachedOnRedeploy.length > 0 && (
                <div className={`text-xs ${ui.good}`}>캐시에서 재사용: {s.cachedOnRedeploy.join(', ')}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="첫 화면까지" value={`${totals[0]}KB`} tone={totals[0] > 200 ? 'bad' : 'good'} />
        <Stat label="대시보드 이동 시" value={`${totals[1]}KB`} />
        <Stat label="재배포 후 재방문" value={`${totals[2]}KB`} tone={totals[2] > 100 ? 'bad' : 'good'} />
      </div>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

// 이 사이트가 지금까지 받은 JS 파일을 보여준다 (PerformanceObserver로 실시간 반영)
const OTHER_PAGES = [
  { label: 'Webpack 심화', load: () => import('./Webpack.jsx') },
  { label: 'Tree Shaking 심화', load: () => import('./TreeShaking.jsx') },
  { label: 'Suspense 심화', load: () => import('./SuspensePage.jsx') },
];

function jsEntries() {
  return performance
    .getEntriesByType('resource')
    .filter((e) => /\.(m?js|jsx)(\?|$)/.test(new URL(e.name).pathname) && new URL(e.name).origin === location.origin)
    .map((e) => ({
      name: decodeURIComponent(new URL(e.name).pathname).split('/').pop(),
      kb: e.decodedBodySize ? (e.decodedBodySize / 1024).toFixed(1) : null,
      at: Math.round(e.startTime),
    }));
}

function LoadedChunksDemo() {
  const [files, setFiles] = useState(jsEntries);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const observer = new PerformanceObserver(() => setFiles(jsEntries()));
    observer.observe({ type: 'resource', buffered: false });
    return () => observer.disconnect();
  }, []);

  const load = async (p) => {
    setLoading(p.label);
    await p.load();
    setLoading(null);
    setFiles(jsEntries());
  };

  return (
    <Demo hint="이 사이트도 코드 스플리팅되어 있습니다. 아래는 지금 이 탭이 실제로 받은 JS 파일 목록이에요. 버튼으로 다른 심화 페이지 코드를 불러오면 목록에 새 파일이 추가됩니다.">
      <div className="flex flex-wrap gap-2">
        {OTHER_PAGES.map((p) => (
          <button key={p.label} className={ui.btn} onClick={() => load(p)} disabled={loading != null}>
            {loading === p.label ? '불러오는 중…' : `${p.label} 코드 불러오기`}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="지금까지 받은 JS 파일" value={`${files.length}개`} />
        <Stat label="합계 (압축 해제 기준)" value={`${files.reduce((a, f) => a + Number(f.kb ?? 0), 0).toFixed(0)}KB`} />
      </div>
      <div className="mt-3 max-h-72 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
        {files.map((f, i) => (
          <div key={i} className="flex justify-between gap-3 py-0.5">
            <span className="truncate">{f.name}</span>
            <span className="shrink-0 text-zinc-400">{f.kb != null ? `${f.kb}KB · ` : ''}{f.at}ms</span>
          </div>
        ))}
      </div>
      <p className={`mt-2 text-xs ${ui.muted}`}>
        배포된 사이트에서는 <Code>index-[hash].js</Code>(공통), <Code>CodeSplitting-[hash].js</Code>(이 페이지) 같은 청크로 보이고,
        로컬 개발 서버에서는 번들링 없이 파일 단위로 보입니다. 오른쪽 숫자는 페이지를 연 뒤 요청을 시작한 시점이에요.
      </p>
    </Demo>
  );
}
