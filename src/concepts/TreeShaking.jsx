import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, Toggle, Stat, ui,
} from '../components/kit.jsx';

export default function TreeShaking() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          트리 쉐이킹은 번들러가 <u>import/export 관계를 분석해서, 어디서도 쓰지 않는 코드를 최종 번들에서 제거</u>하는 최적화입니다.
          나무를 흔들어 죽은 잎을 떨어뜨리듯 안 쓰는 export를 털어냅니다. ES Module(import/export)이어야 동작합니다.
        </OneLiner>

        <H3>동작 원리</H3>
        <List
          items={[
            <><b>① 정적 분석</b>: ESM의 import/export는 파일 맨 위에 고정된 형태라, 코드를 실행하지 않고도 "누가 무엇을 쓰는지" 빌드 때 알 수 있다.</>,
            <><b>② 표시(mark)</b>: 번들러(webpack, Rollup)가 진입점부터 따라가며 실제로 쓰이는 export에 표시한다.</>,
            <><b>③ 제거(shake)</b>: 표시되지 않은 코드는 압축 도구(Terser, esbuild)가 production 빌드에서 지운다. 그래서 <b>development 모드에선 지워지지 않는다</b>.</>,
          ]}
        />

        <H3>트리 쉐이킹이 안 되는 경우</H3>
        <Table
          head={['원인', '이유', '해결']}
          rows={[
            [<>CommonJS (<Code>require</Code>)</>, 'require는 실행 중에 무엇이든 될 수 있어 정적 분석이 안 된다', <>ESM 버전 사용 (<Code>lodash</Code> → <Code>lodash-es</Code>)</>],
            ['부수 효과(side effect)', '파일을 불러오기만 해도 실행되는 코드(전역 수정, polyfill, CSS import)가 있으면 함부로 못 지운다', <>package.json에 <Code>"sideEffects": false</Code> (CSS는 예외로 명시)</>],
            ['Babel이 ESM을 CJS로 변환', '번들러가 받기 전에 require로 바뀌어 버림', <><Code>{"['@babel/preset-env', { modules: false }]"}</Code></>],
            ['통째로 가져오기', <><Code>import _ from 'lodash'</Code>는 객체 전체를 쓰는 것으로 본다</>, '필요한 함수만 이름으로 import'],
          ]}
        />

        <H3>그래서 언제 신경 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>유틸 라이브러리</b>에서 함수 몇 개만 쓸 때: lodash, date-fns, rxjs, 아이콘 패키지</>,
            <><b>라이브러리를 직접 만들 때</b>: ESM으로 배포하고 sideEffects를 정확히 적어야 쓰는 쪽에서 트리 쉐이킹이 된다</>,
            '번들 분석기에서 "쓰지도 않는 코드가 큼직하게" 보일 때',
            '배럴 파일(index.js에서 전부 re-export)을 많이 쓰는 프로젝트',
          ]}
          avoid={[
            '대부분의 앱 코드 — Vite/webpack production 빌드가 기본으로 해준다. 따로 할 일은 거의 없다',
            '어차피 전부 쓰는 라이브러리 (React 등)',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"트리 쉐이킹은 번들러가 알아서 해주지만, <b>ESM + 부수 효과 없음</b>이라는 조건이 맞아야 한다. 그래서 lodash 대신 lodash-es를 쓰고, 라이브러리를 만들 땐 sideEffects를 명시한다"까지 말하면 좋습니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p><Code>app.js</Code>가 <Code>utils.js</Code>에서 <Code>formatDate</Code> 하나만 import했을 때, 빌드 단계별로 무슨 일이 일어나는지 봅니다.</p>
        <ShakeViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '트리 쉐이킹 안 됨',
            code: `
// lodash는 CommonJS → 전체(약 70KB)가 들어간다
import _ from 'lodash';
_.debounce(onSearch, 300);

// 배럴 파일에 부수 효과가 있으면 전부 포함
import { Button } from '@/components'; // index.js가 모든 컴포넌트를 re-export`,
            note: 'debounce 하나 쓰려고 lodash 전체가 번들에 들어간다.',
          }}
          after={{
            label: '트리 쉐이킹 됨',
            code: `
// ESM 버전 + 필요한 것만 이름으로
import { debounce } from 'lodash-es';
debounce(onSearch, 300);

// 또는 경로를 직접 지정
import Button from '@/components/Button';

// 라이브러리를 만든다면 package.json에
{
  "type": "module",
  "sideEffects": ["*.css"]   // CSS만 부수 효과, 나머지는 지워도 됨
}`,
            note: 'debounce와 그것이 쓰는 내부 함수만 남는다 (수 KB).',
          }}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <ShakeSimulator />
      </Section>
    </>
  );
}

/* ---------- 데이터 ---------- */

const EXPORTS = [
  { name: 'formatDate', kb: 3 },
  { name: 'debounce', kb: 2 },
  { name: 'throttle', kb: 2 },
  { name: 'deepClone', kb: 5 },
  { name: 'chartPreset', kb: 40, note: '차트 라이브러리 포함' },
];
const SIDE_EFFECT_KB = 4; // utils.js 최상단: window.__utils = ... (부수 효과)

const STATUS_STYLE = {
  used: 'bg-emerald-50 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/40',
  dead: 'bg-rose-50 text-rose-800 ring-rose-300 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/40',
  shaken: 'bg-zinc-50 text-zinc-400 line-through ring-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-600 dark:ring-zinc-700',
  idle: 'bg-white ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700',
  kept: 'bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/40',
};

function ExportRow({ name, kb, note, status }) {
  const label = { used: '사용함 → 포함', dead: '안 쓰는데 포함됨', shaken: '제거됨', idle: '', kept: '부수 효과라 남김' }[status];
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 font-mono text-xs ring-1 transition ${STATUS_STYLE[status]}`}>
      <span>{name}{note && <span className="ml-2 font-sans text-[11px] opacity-70">({note})</span>}</span>
      <span className="flex items-center gap-2 font-sans">
        {label && <span className="font-semibold">{label}</span>}
        <span className="tabular-nums">{kb}KB</span>
      </span>
    </div>
  );
}

/* ---------- 시각화 ---------- */

const STEPS = [
  { title: '빌드 전', desc: 'utils.js에는 export가 5개 있고, app.js는 그중 formatDate만 import한다.' },
  { title: '① 정적 분석', desc: 'import { formatDate } from "./utils" 를 읽고, 의존성 그래프를 만든다. (코드를 실행하지 않음)' },
  { title: '② 사용 표시 (mark)', desc: 'formatDate만 "사용됨"으로 표시. 나머지는 "unused export" 표시만 하고 아직 코드에 남아 있다. (development 빌드는 여기까지)' },
  { title: '③ 제거 (shake)', desc: 'production 빌드에서 압축 도구가 표시 안 된 코드를 지운다. 최종 번들엔 formatDate만 남는다.' },
];

function ShakeViz() {
  const [step, setStep] = useState(0);
  const statusOf = (name) => {
    if (step < 2) return 'idle';
    if (name === 'formatDate') return 'used';
    return step === 2 ? 'dead' : 'shaken';
  };
  const total = EXPORTS.reduce((a, e) => a + (statusOf(e.name) === 'shaken' ? 0 : e.kb), 0);

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => (
          <button key={s.title} className={i === step ? ui.btnPrimary : ui.btn} onClick={() => setStep(i)}>{s.title}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
        <div className={`rounded-xl p-3 ring-1 ring-zinc-200 dark:ring-zinc-700 ${step === 1 ? 'ring-2 ring-indigo-400' : ''}`}>
          <div className="font-mono text-xs font-semibold">app.js</div>
          <pre className="mt-2 font-mono text-[11px] whitespace-pre-wrap text-zinc-500">{"import { formatDate } from './utils';\n\nformatDate(new Date());"}</pre>
        </div>
        <div className={`rounded-xl p-3 ring-1 ring-zinc-200 dark:ring-zinc-700 ${step === 1 ? 'ring-2 ring-indigo-400' : ''}`}>
          <div className="mb-2 flex justify-between font-mono text-xs font-semibold"><span>utils.js</span><span className="font-sans text-zinc-400">번들에 남는 양 {total}KB</span></div>
          <div className="space-y-1.5">{EXPORTS.map((e) => <ExportRow key={e.name} {...e} status={statusOf(e.name)} />)}</div>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/60"><b>{STEPS[step].title}</b> — {STEPS[step].desc}</div>
      <Legend items={[['bg-emerald-400', '사용함'], ['bg-rose-400', '아직 남아 있음 (안 씀)'], ['bg-zinc-300 dark:bg-zinc-600', '제거됨']]} />
    </Viz>
  );
}

/* ---------- 데모 ---------- */

function ShakeSimulator() {
  const [picked, setPicked] = useState(['formatDate']);
  const [format, setFormat] = useState('esm');
  const [mode, setMode] = useState('production');
  const [sideEffectsFree, setSideEffectsFree] = useState(false);

  const shakes = format === 'esm' && mode === 'production';
  const nothingUsed = picked.length === 0;
  // 모듈에서 아무것도 안 쓰고 sideEffects:false면 모듈 전체를 건너뛴다
  const moduleDropped = shakes && nothingUsed && sideEffectsFree;
  const statusOf = (name) => (picked.includes(name) ? 'used' : shakes ? 'shaken' : 'dead');
  const sideEffectIncluded = !moduleDropped;

  const included = EXPORTS.filter((e) => !moduleDropped && statusOf(e.name) !== 'shaken');
  const total = included.reduce((a, e) => a + e.kb, 0) + (sideEffectIncluded ? SIDE_EFFECT_KB : 0);
  const full = EXPORTS.reduce((a, e) => a + e.kb, 0) + SIDE_EFFECT_KB;
  const toggle = (name) => setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  const importLine = format === 'esm'
    ? (nothingUsed ? "import './utils';" : `import { ${picked.join(', ')} } from './utils';`)
    : (nothingUsed ? "require('./utils');" : `const { ${picked.join(', ')} } = require('./utils');`);

  return (
    <Demo hint="app.js에서 쓸 함수를 고르고, 모듈 형식·빌드 모드·sideEffects를 바꿔가며 번들 크기가 어떻게 변하는지 보세요.">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">app.js에서 쓰는 함수</p>
            <div className="flex flex-wrap gap-2">
              {EXPORTS.map((e) => (
                <label key={e.name} className={`cursor-pointer rounded-lg px-3 py-1.5 font-mono text-xs ring-1 ${picked.includes(e.name) ? 'bg-indigo-50 text-indigo-700 ring-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/40' : 'ring-zinc-200 dark:ring-zinc-700'}`}>
                  <input type="checkbox" className="sr-only" checked={picked.includes(e.name)} onChange={() => toggle(e.name)} />
                  {e.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented value={format} onChange={setFormat} options={[{ value: 'esm', label: 'ES Module' }, { value: 'cjs', label: 'CommonJS' }]} />
            <Segmented value={mode} onChange={setMode} options={[{ value: 'production', label: 'production' }, { value: 'development', label: 'development' }]} />
          </div>
          <Toggle checked={sideEffectsFree} onChange={setSideEffectsFree} label={<span className="font-mono text-sm">"sideEffects": false</span>} />
          <CodeBlock code={importLine} title="app.js" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
            <span>번들에 들어간 utils.js</span>
          </div>
          <div className="space-y-1.5">
            <ExportRow name="(최상단 부수 효과 코드)" kb={SIDE_EFFECT_KB} status={sideEffectIncluded ? 'kept' : 'shaken'} />
            {EXPORTS.map((e) => <ExportRow key={e.name} {...e} status={moduleDropped ? 'shaken' : statusOf(e.name)} />)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
            <Stat label="번들 크기" value={`${total}KB`} tone={total > 20 ? 'bad' : 'good'} />
            <Stat label="제거된 양" value={`${full - total}KB`} />
          </div>
          <p className={`mt-3 text-sm ${ui.muted}`}>
            {format === 'cjs' && '→ CommonJS는 require가 실행 중에 무엇을 가져갈지 알 수 없어서, 안 쓰는 함수까지 전부 들어간다.'}
            {format === 'esm' && mode === 'development' && '→ development 모드는 "안 쓰는 export" 표시만 하고 지우지 않는다. 트리 쉐이킹 결과는 production 빌드에서 확인해야 한다.'}
            {shakes && !nothingUsed && '→ 쓰는 함수만 남고 나머지는 제거됐다. 단, 최상단 부수 효과 코드는 지워도 되는지 확신할 수 없어서 남는다.'}
            {shakes && nothingUsed && !sideEffectsFree && '→ 아무 함수도 안 쓰지만, 파일을 불러오는 것 자체가 부수 효과일 수 있어서 최상단 코드는 남는다.'}
            {moduleDropped && '→ sideEffects: false라서 "아무것도 안 쓰면 파일 전체를 건너뛰어도 된다"고 판단해 통째로 제거했다.'}
          </p>
        </div>
      </div>
    </Demo>
  );
}
