import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, ui,
} from '../components/kit.jsx';

export default function Webpack() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Webpack은 진입점(entry)에서 시작해 import를 따라가며 <u>모든 모듈의 의존성 그래프를 만들고, 이를 브라우저가 실행할 수 있는 번들 파일로 묶어주는</u> 모듈 번들러입니다.
          그 과정에서 loader로 JS가 아닌 파일(TS, JSX, CSS, 이미지)을 변환하고, plugin으로 최적화·HTML 생성 같은 작업을 합니다.
        </OneLiner>

        <H3>왜 번들러가 필요했나?</H3>
        <List
          items={[
            <>파일이 수백 개면 <Code>{'<script>'}</Code> 태그도 수백 개 → 요청이 많고, <b>순서를 사람이 맞춰야</b> 하고, 전역 변수끼리 충돌한다.</>,
            <>브라우저는 TS, JSX, SCSS를 모른다 → 변환이 필요하다.</>,
            <>배포용으로 압축, 트리 쉐이킹, 코드 스플리팅, 파일명 해시 같은 최적화가 필요하다.</>,
          ]}
        />

        <H3>핵심 개념 5가지</H3>
        <Table
          head={['개념', '역할', '예']}
          rows={[
            ['entry', '의존성 그래프를 그리기 시작할 파일', <Code>entry: './src/index.js'</Code>],
            ['output', '결과 번들을 어디에, 어떤 이름으로', <Code>{"filename: '[name].[contenthash].js'"}</Code>],
            ['loader', <><b>파일 하나하나를 변환</b>. JS가 아닌 것을 모듈로 만든다</>, <><Code>babel-loader</Code>, <Code>ts-loader</Code>, <Code>css-loader</Code></>],
            ['plugin', <><b>번들 전체 과정에 개입</b>하는 추가 기능</>, <><Code>HtmlWebpackPlugin</Code>, <Code>MiniCssExtractPlugin</Code>, <Code>DefinePlugin</Code></>],
            ['mode', 'development / production — 최적화 기본값이 달라진다', 'production이면 압축 + 트리 쉐이킹'],
          ]}
        />
        <Callout type="tip" title="면접 단골: loader vs plugin">
          <p><b>loader</b>는 "파일 단위 변환기"입니다. <Code>.ts</Code> 파일이 들어오면 JS로 바꿔서 내보내는 식으로, 모듈 하나를 입력받아 변환합니다.</p>
          <p><b>plugin</b>은 "빌드 과정 전체에 끼어드는 확장"입니다. 번들이 다 만들어진 뒤 HTML을 생성하거나, 압축하거나, 환경 변수를 주입하는 등 loader가 할 수 없는 일을 합니다.</p>
        </Callout>

        <H3>Webpack vs Vite</H3>
        <Table
          head={['', 'Webpack', 'Vite']}
          rows={[
            ['개발 서버', '시작할 때 전체를 번들링 → 프로젝트가 크면 느림', '번들링 없이 브라우저의 ESM으로 파일 단위 제공 → 빠름'],
            ['수정 반영(HMR)', '변경된 모듈과 연관 부분 다시 번들', '변경된 파일만 다시 요청'],
            ['배포 빌드', 'Webpack', 'Rollup (차기: Rolldown)'],
            ['설정', '유연하지만 복잡', '기본값이 좋아 설정이 적음'],
            ['쓰이는 곳', 'Next.js(기본은 Turbopack으로 이동 중), 오래된 CRA 프로젝트', '새 React/Vue 프로젝트 대부분 (이 사이트도 Vite)'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            '이미 Webpack 기반인 프로젝트를 유지보수할 때 (CRA, 오래된 사내 프로젝트)',
            'Module Federation(마이크로 프론트엔드)처럼 Webpack에만 있는 기능이 필요할 때',
            '세밀한 빌드 커스터마이징이 필요하고, 그에 맞는 loader/plugin 생태계가 필요할 때',
          ]}
          avoid={[
            '새 프로젝트 — 대부분 Vite(또는 Next.js 같은 프레임워크)가 더 빠르고 설정이 적다',
            '설정 파일을 직접 다 짜는 것 — 프레임워크가 이미 최적화된 설정을 갖고 있다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>Webpack이 빌드할 때 거치는 단계입니다. 단계를 눌러 보세요.</p>
        <PipelineViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '번들러 없이',
            code: `
<!-- index.html -->
<script src="lodash.js"></script>
<script src="utils.js"></script>   <!-- lodash가 먼저 있어야 함 -->
<script src="api.js"></script>     <!-- utils가 먼저 있어야 함 -->
<script src="app.js"></script>
<!-- 순서가 틀리면 에러, 전부 전역 변수, TS/JSX는 못 씀 -->`,
            note: '파일이 늘수록 순서 관리와 전역 충돌이 지옥이 된다. 압축·변환도 따로 해야 한다.',
          }}
          after={{
            label: 'Webpack',
            code: `
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      { test: /\\.tsx?$/, use: 'ts-loader' },            // loader: TS → JS
      { test: /\\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './index.html' })], // plugin
  resolve: { extensions: ['.ts', '.tsx', '.js'] },
};`,
            note: '진입점만 알려주면 import를 따라가며 순서를 알아서 정하고, 변환·압축·HTML 생성까지 해준다.',
          }}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <ToyBundler />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const PIPELINE = [
  { name: 'Entry', desc: 'webpack.config.js의 entry 파일(src/index.js)에서 시작한다.', detail: 'entry: "./src/index.js"' },
  { name: '의존성 그래프', desc: 'import / require를 따라가며 필요한 모든 파일을 찾는다. 아무도 import하지 않는 파일은 그래프에 없으니 번들에도 안 들어간다.', detail: 'index.js → App.tsx → Button.tsx, style.css, logo.png' },
  { name: 'Loader', desc: '그래프의 파일을 하나씩 변환한다. 규칙(test)에 맞는 loader가 오른쪽에서 왼쪽 순서로 적용된다.', detail: 'App.tsx --ts-loader--> JS,  style.css --css-loader--> JS 모듈' },
  { name: 'Plugin', desc: '빌드 전 과정에 끼어들어 추가 작업을 한다: 압축, 환경 변수 주입, CSS 파일 분리, HTML 생성 등.', detail: 'TerserPlugin(압축), HtmlWebpackPlugin(index.html 생성)' },
  { name: 'Output', desc: '청크로 묶어 dist 폴더에 쓴다. 파일명에 내용 해시를 붙여 캐시를 관리한다.', detail: 'dist/main.3f9a1c.js, dist/index.html' },
];

function PipelineViz() {
  const [step, setStep] = useState(0);
  return (
    <Viz>
      <div className="flex min-w-[560px] items-stretch gap-1">
        {PIPELINE.map((p, i) => (
          <button
            key={p.name}
            onClick={() => setStep(i)}
            className={`relative flex-1 rounded-lg px-2 py-3 text-sm font-semibold transition ${
              i === step
                ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                : i < step
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {i + 1}. {p.name}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/60">
        <p>{PIPELINE[step].desc}</p>
        <p className="mt-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">{PIPELINE[step].detail}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <button className={ui.btn} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← 이전</button>
        <button className={ui.btn} disabled={step === PIPELINE.length - 1} onClick={() => setStep((s) => s + 1)}>다음 →</button>
      </div>
    </Viz>
  );
}

/* ---------- 데모: 아주 작은 번들러 ---------- */

const INITIAL_FILES = {
  'index.js': "import add from './math.js';\nimport format from './format.js';\n\nconsole.log(format(add(2, 3)));",
  'math.js': 'export default function add(a, b) {\n  return a + b;\n}',
  'format.js': "export default function format(n) {\n  return '결과: ' + n;\n}",
  'unused.js': "export default function unused() {\n  return '아무도 import하지 않는 파일';\n}",
};
const IMPORT_RE = /import\s+(\w+)\s+from\s+['"]\.\/([\w.-]+)['"];?/g;

// entry부터 import를 따라가며 그래프를 만들고(DFS), webpack 런타임과 비슷한 모양의 번들 코드를 만든다
function bundle(files, entry) {
  const graph = {};
  const order = [];
  const errors = [];
  const visit = (name, from) => {
    if (graph[name]) return;
    if (files[name] == null) {
      errors.push(`${from}에서 import한 './${name}' 파일을 찾을 수 없어요`);
      return;
    }
    graph[name] = [...files[name].matchAll(IMPORT_RE)].map((m) => m[2]);
    graph[name].forEach((dep) => visit(dep, name));
    order.push(name);
  };
  visit(entry, 'entry');

  // loader 역할: ESM 문법을 런타임이 이해하는 require/exports 형태로 바꾼다
  const transform = (src) =>
    src
      .replace(IMPORT_RE, 'const $1 = require("./$2").default;')
      .replace(/export\s+default\s+/g, 'exports.default = ');
  const indent = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

  const modules = order
    .map((name) => `    "./${name}": (exports, require) => {\n${indent(transform(files[name]), 6)}\n    },`)
    .join('\n');
  const code = `(() => {
  // 1. 모든 모듈을 { 경로: 함수 } 형태로 한 파일에 담는다
  const modules = {
${modules}
  };

  // 2. require 구현: 한 번 실행한 모듈은 캐시해서 재사용
  const cache = {};
  function require(path) {
    if (cache[path]) return cache[path].exports;
    const module = (cache[path] = { exports: {} });
    modules[path](module.exports, require);
    return module.exports;
  }

  // 3. entry부터 실행
  require("./${entry}");
})();`;
  return { graph, order, errors, code };
}

function ToyBundler() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [active, setActive] = useState('index.js');
  const [result, setResult] = useState(null);
  const [output, setOutput] = useState([]);

  const build = () => {
    setResult(bundle(files, 'index.js'));
    setOutput([]);
  };

  const run = () => {
    const logs = [];
    const fakeConsole = { log: (...args) => logs.push(args.join(' ')) };
    try {
      new Function('console', result.code)(fakeConsole);
    } catch (e) {
      logs.push(`에러: ${e.message}`);
    }
    setOutput(logs.length ? logs : ['(출력 없음)']);
  };

  const excluded = result ? Object.keys(files).filter((f) => !result.order.includes(f)) : [];

  return (
    <Demo hint="Webpack이 하는 일을 아주 작게 흉내 낸 번들러입니다. 파일을 고친 뒤 '빌드'를 누르면 의존성 그래프와 번들 결과가 나옵니다. index.js에 import './unused.js'를 추가하거나, 없는 파일을 import해 보세요.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap gap-1">
            {Object.keys(files).map((f) => (
              <button key={f} onClick={() => setActive(f)} className={`rounded-t-lg px-3 py-1.5 font-mono text-xs ${f === active ? 'bg-[#1e1f24] text-zinc-100' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                src/{f}
              </button>
            ))}
          </div>
          <textarea
            value={files[active]}
            onChange={(e) => setFiles((fs) => ({ ...fs, [active]: e.target.value }))}
            spellCheck={false}
            className="h-40 w-full rounded-b-lg rounded-tr-lg bg-[#1e1f24] p-3 font-mono text-[13px] text-zinc-100 outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button className={ui.btnPrimary} onClick={build}>빌드</button>
            <button className={ui.btn} onClick={run} disabled={!result || result.errors.length > 0}>번들 실행</button>
            <button className={ui.btn} onClick={() => { setFiles(INITIAL_FILES); setResult(null); setOutput([]); }}>초기화</button>
          </div>

          {result && (
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-semibold">의존성 그래프 (entry: index.js)</p>
              <div className="space-y-1 font-mono text-xs">
                {Object.entries(result.graph).map(([file, deps]) => (
                  <div key={file}>{file} → {deps.length ? deps.join(', ') : <span className="text-zinc-400">(의존성 없음)</span>}</div>
                ))}
              </div>
              <p>
                실행 순서(의존하는 쪽이 먼저): <span className="font-mono text-xs">{result.order.join(' → ')}</span>
              </p>
              {excluded.length > 0 && <p className={ui.good}>번들에서 빠진 파일: {excluded.join(', ')} (그래프에 없음)</p>}
              {result.errors.map((e) => <p key={e} className={ui.bad}>빌드 에러: {e}</p>)}
              {output.length > 0 && (
                <div className="rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
                  <div className="mb-1 text-zinc-400">콘솔 출력</div>
                  {output.map((o, i) => <div key={i}>{o}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="min-w-0">
          {result ? (
            <CodeBlock code={result.code} title="dist/main.js (번들 결과)" />
          ) : (
            <div className={`grid h-full min-h-40 place-items-center rounded-xl border border-dashed border-zinc-300 text-sm dark:border-zinc-700 ${ui.muted}`}>
              '빌드'를 누르면 번들 결과가 여기에 나와요
            </div>
          )}
        </div>
      </div>
    </Demo>
  );
}
