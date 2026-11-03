import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, Toggle, Stat, ui,
} from '../components/kit.jsx';

export default function BundleAnalyzer() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          번들 분석기는 빌드 결과물 안에 <u>어떤 모듈이 얼마만큼의 용량을 차지하는지 트리맵(사각형 지도)으로 보여주는 도구</u>입니다.
          "번들이 크다"는 막연한 느낌 대신, 어떤 라이브러리 때문에 커졌는지 눈으로 찾아서 줄일 곳을 정할 수 있습니다.
        </OneLiner>

        <H3>도구 (번들러별)</H3>
        <Table
          head={['번들러', '도구', '실행']}
          rows={[
            ['webpack', <b>webpack-bundle-analyzer</b>, '플러그인 추가 후 빌드 → 브라우저에 트리맵 자동으로 열림'],
            ['Next.js', <Code>@next/bundle-analyzer</Code>, <><Code>ANALYZE=true next build</Code> (내부적으로 webpack-bundle-analyzer)</>],
            ['Vite / Rollup', <Code>rollup-plugin-visualizer</Code>, '빌드하면 stats.html 생성'],
            ['아무 번들러', <Code>source-map-explorer</Code>, '소스맵으로 분석 (빌드 설정 변경 없이)'],
          ]}
        />

        <H3>Webpack Bundle Analyzer 보는 법</H3>
        <List
          items={[
            <><b>사각형 크기 = 용량</b>. 큰 사각형부터 본다. 바깥 사각형은 청크(파일), 안쪽은 그 청크에 들어간 모듈/패키지.</>,
            <><b>세 가지 크기</b>를 오른쪽 위에서 바꿔 볼 수 있다:
              <ul className="mt-1 list-[circle] pl-5">
                <li><b>Stat</b>: 압축·최소화 전 원본 크기 (트리 쉐이킹 전)</li>
                <li><b>Parsed</b>: 최소화된 실제 JS 파일 크기 — 브라우저가 파싱·실행하는 양 (CPU 비용)</li>
                <li><b>Gzipped</b>: 네트워크로 전송되는 크기 — 다운로드 시간</li>
              </ul>
            </>,
            <>보통 <b>Parsed로 무엇이 큰지 찾고, Gzipped로 실제 전송량</b>을 본다.</>,
          ]}
        />

        <H3>자주 발견되는 문제와 해결</H3>
        <Table
          head={['보이는 모습', '원인', '해결']}
          rows={[
            ['moment가 거대함 (locale 폴더가 꽉 참)', '모든 언어 파일이 같이 들어감', <>dayjs / date-fns로 교체, 또는 webpack <Code>IgnorePlugin</Code>으로 locale 제외</>],
            ['lodash가 통째로 있음', 'CommonJS라 트리 쉐이킹 안 됨', <><Code>lodash-es</Code> + 이름 import (<Link className="text-indigo-600 dark:text-indigo-400" to="/web/bundler-tarnspiler/deep/tree-shaking">Tree Shaking</Link>)</>],
            ['같은 라이브러리가 두 번 보임', '버전이 달라 중복 설치됨', <><Code>npm dedupe</Code>, 버전 맞추기, <Code>overrides</Code></>],
            ['특정 페이지만 쓰는 라이브러리가 main에 있음', '정적 import로 첫 번들에 포함', <>동적 import로 분리 (<Link className="text-indigo-600 dark:text-indigo-400" to="/project/project-opti/deep/code-splitting">Code Splitting</Link>)</>],
            ['아이콘 패키지 전체가 들어감', '배럴 파일에서 import', '아이콘별 경로 import, Next.js의 optimizePackageImports'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>성능 개선을 시작할 때 가장 먼저</b> — 추측하지 말고 측정부터</>,
            '새 라이브러리를 추가한 뒤 번들이 얼마나 커졌는지 확인할 때',
            'Lighthouse에서 "사용하지 않는 JavaScript 줄이기", 큰 JS 실행 시간 경고가 뜰 때',
            'CI에서 번들 크기 예산(size-limit 등)을 넘었을 때 원인 찾기',
          ]}
          avoid={[
            '매 빌드마다 켜 두기 — 빌드가 느려진다. 필요할 때 환경 변수로 켠다',
            '개발 서버(dev) 결과로 판단하기 — 반드시 production 빌드로 분석',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>가상의 쇼핑몰 프로젝트를 webpack-bundle-analyzer로 열었다고 생각해 보세요. 사각형에 마우스를 올리면 크기가 나오고, 크기 기준을 바꿀 수 있습니다.</p>
        <TreemapViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '분석 없이 감으로',
            code: `
// "번들이 왜 이렇게 크지?"
// → 의심 가는 import를 하나씩 지워보며 빌드 크기 비교
// → 오래 걸리고, 진짜 원인(중복 설치, locale 파일)은
//   코드에 보이지 않아서 못 찾는다`,
            note: '원인이 package-lock 안(중복 버전)이나 라이브러리 내부(locale)에 있으면 코드만 봐서는 절대 안 보인다.',
          }}
          after={{
            label: 'Webpack Bundle Analyzer',
            code: `
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',      // report.html 파일로 저장
      openAnalyzer: true,
    }),
  ].filter(Boolean),
};

// Next.js — next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({});
// 실행: ANALYZE=true npm run build`,
            note: '빌드가 끝나면 트리맵이 열려서 가장 큰 사각형부터 원인을 바로 볼 수 있다.',
          }}
        />
        <Callout title="Vite 프로젝트라면">
          <CodeBlock
            code={`
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [react(), visualizer({ open: true, gzipSize: true })],
});`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <FixDemo />
      </Section>
    </>
  );
}

/* ---------- 데이터 ---------- */

// 크기 단위 KB: [stat, parsed, gzip]
const PACKAGES = {
  'moment (+ 모든 locale)': [470, 290, 72],
  'chart.js': [410, 200, 65],
  'react-dom': [520, 130, 42],
  lodash: [530, 72, 25],
  'lodash (중복, 다른 버전)': [520, 70, 24],
  'src (우리 코드)': [180, 60, 18],
  react: [20, 8, 3],
  dayjs: [12, 7, 3],
  'lodash-es (debounce만)': [6, 3, 1],
};
const COLORS = ['bg-indigo-400', 'bg-sky-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-violet-400', 'bg-teal-400', 'bg-orange-400', 'bg-lime-400'];
const colorOf = (name) => COLORS[Object.keys(PACKAGES).indexOf(name) % COLORS.length];
const SIZE_INDEX = { stat: 0, parsed: 1, gzip: 2 };

function buildChunks(fixes) {
  const main = ['react-dom', 'react', 'src (우리 코드)'];
  main.push(fixes.moment ? 'dayjs' : 'moment (+ 모든 locale)');
  main.push(fixes.lodash ? 'lodash-es (debounce만)' : 'lodash');
  if (!fixes.dedupe) main.push('lodash (중복, 다른 버전)');
  const chunks = [{ name: 'main.js', packages: main }];
  if (fixes.chart) chunks.push({ name: 'dashboard.js (동적 import)', packages: ['chart.js'] });
  else main.push('chart.js');
  return chunks;
}

const sizeOf = (pkg, mode) => PACKAGES[pkg][SIZE_INDEX[mode]];
const chunkSize = (chunk, mode) => chunk.packages.reduce((a, p) => a + sizeOf(p, mode), 0);

function Treemap({ chunks, mode }) {
  const [hover, setHover] = useState(null);
  return (
    <div>
      <div className="flex h-72 min-w-[520px] gap-1">
        {chunks.map((c) => {
          const total = chunkSize(c, mode);
          const pkgs = [...c.packages].sort((a, b) => sizeOf(b, mode) - sizeOf(a, mode));
          return (
            <div key={c.name} className="flex min-w-0 flex-col rounded-lg bg-zinc-200 p-1 dark:bg-zinc-700" style={{ flexGrow: total, flexBasis: 0 }}>
              <div className="truncate px-1 pb-1 font-mono text-[11px] font-semibold">{c.name} · {total}KB</div>
              <div className="flex min-h-0 flex-1 flex-wrap gap-0.5">
                {pkgs.map((p) => (
                  <div
                    key={p}
                    onMouseEnter={() => setHover(p)}
                    onMouseLeave={() => setHover(null)}
                    className={`${colorOf(p)} flex min-w-0 items-start overflow-hidden rounded p-1 text-[11px] leading-tight font-semibold text-zinc-900 transition ${hover && hover !== p ? 'opacity-50' : ''}`}
                    style={{ flexGrow: sizeOf(p, mode), flexBasis: `${Math.max(14, (sizeOf(p, mode) / total) * 100)}%` }}
                  >
                    <span className="truncate">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 h-5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {hover ? `${hover} — stat ${PACKAGES[hover][0]}KB · parsed ${PACKAGES[hover][1]}KB · gzip ${PACKAGES[hover][2]}KB` : '사각형에 마우스를 올려 보세요'}
      </p>
    </div>
  );
}

/* ---------- 시각화 ---------- */

const MODE_DESC = {
  stat: 'Stat: 최소화 전 원본. 주석·공백·안 쓰는 코드 포함이라 가장 크다. 실제로 받는 양은 아니다.',
  parsed: 'Parsed: 최소화된 실제 파일 크기. 브라우저가 파싱·실행하는 양 → 무엇이 큰지 찾을 때 기준.',
  gzip: 'Gzipped: 네트워크로 전송되는 크기 → 다운로드 시간 기준.',
};

function TreemapViz() {
  const [mode, setMode] = useState('parsed');
  const chunks = buildChunks({});
  return (
    <Viz>
      <Segmented value={mode} onChange={setMode} options={[{ value: 'stat', label: 'Stat' }, { value: 'parsed', label: 'Parsed' }, { value: 'gzip', label: 'Gzipped' }]} />
      <p className={`mt-2 mb-4 text-sm ${ui.muted}`}>{MODE_DESC[mode]}</p>
      <Treemap chunks={chunks} mode={mode} />
      <p className={`mt-2 text-sm ${ui.muted}`}>
        → 우리 코드(src)보다 moment, chart.js, lodash(두 벌!)가 훨씬 크다. 이런 건 코드만 봐서는 잘 안 보이고, 분석기로 봐야 바로 드러난다.
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const FIXES = [
  { key: 'moment', label: 'moment → dayjs로 교체' },
  { key: 'lodash', label: "lodash → lodash-es에서 debounce만 import" },
  { key: 'dedupe', label: '중복 설치된 lodash 정리 (npm dedupe)' },
  { key: 'chart', label: 'chart.js를 대시보드에서만 동적 import' },
];

function FixDemo() {
  const [fixes, setFixes] = useState({});
  const chunks = buildChunks(fixes);
  const before = chunkSize(buildChunks({})[0], 'gzip');
  const mainNow = chunkSize(chunks[0], 'gzip');

  return (
    <Demo hint="분석 결과를 보고 고칠 항목을 하나씩 켜 보세요. 첫 화면에 받는 main.js(gzip 기준)가 얼마나 줄어드는지 확인할 수 있습니다.">
      <div className="grid gap-2 sm:grid-cols-2">
        {FIXES.map((f) => (
          <Toggle key={f.key} checked={!!fixes[f.key]} onChange={(on) => setFixes((x) => ({ ...x, [f.key]: on }))} label={<span className="text-sm font-normal">{f.label}</span>} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="고치기 전 main.js (gzip)" value={`${before}KB`} />
        <Stat label="지금 main.js (gzip)" value={`${mainNow}KB`} tone={mainNow < before * 0.5 ? 'good' : mainNow < before ? undefined : 'bad'} />
        <Stat label="줄어든 비율" value={`${Math.round((1 - mainNow / before) * 100)}%`} tone={mainNow < before ? 'good' : undefined} />
      </div>
      <div className="mt-4">
        <Treemap chunks={chunks} mode="gzip" />
      </div>
    </Demo>
  );
}
