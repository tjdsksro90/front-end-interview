import { useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function DynamicImport() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Dynamic Import는 <Code>import()</Code> 함수로 모듈을 <u>코드가 실행되는 도중, 필요한 순간에</u> 불러오는 문법입니다.
          Promise를 반환하고, 번들러는 이 지점을 별도 청크로 잘라서 처음 번들에서 빼 줍니다. 코드 스플리팅을 실제로 일으키는 도구입니다.
        </OneLiner>

        <Table
          head={['', '정적 import', '동적 import()']}
          rows={[
            ['형태', <Code>import x from './x'</Code>, <Code>const mod = await import('./x')</Code>],
            ['위치', '파일 맨 위에서만', '어디서든 (함수 안, if 안, 이벤트 핸들러 안)'],
            ['언제 불러오나', '앱 시작 시 무조건', '그 줄이 실행될 때'],
            ['결과', '값이 바로 있음', 'Promise → 모듈 객체 ({ default, 이름있는 export들 })'],
            ['번들', '같은 청크에 합쳐짐', '별도 청크로 분리 (코드 스플리팅)'],
          ]}
        />

        <H3>알아둘 것</H3>
        <List
          items={[
            <><b>default export는 <Code>mod.default</Code></b>로 꺼낸다. <Code>{'const { toCSV } = await import(\'./csv\')'}</Code>처럼 이름 있는 export는 구조분해.</>,
            <>한 번 불러온 모듈은 캐시된다. 같은 <Code>import()</Code>를 다시 호출해도 네트워크 요청은 한 번뿐.</>,
            <>경로는 번들러가 빌드 때 알 수 있어야 한다. <Code>{'import(`./locales/${lang}.json`)'}</Code>처럼 일부만 변수면 해당 폴더 파일들을 전부 청크로 만들어 두고, 경로 전체가 변수면 분석할 수 없다.</>,
            <><b>React.lazy, next/dynamic</b>은 모두 내부에서 import()를 쓴다. React 밖(유틸 함수, 라이브러리)에서도 쓸 수 있다는 게 차이점.</>,
            <><b>미리 불러오기</b>: 마우스를 올렸을 때(hover) 미리 import()를 호출하거나, webpack의 <Code>{'/* webpackPrefetch: true */'}</Code> 주석으로 브라우저가 한가할 때 받아두게 할 수 있다.</>,
            <><b>배포 직후 오류</b>: 사용자가 옛 버전 페이지를 열어둔 채로 새 버전이 배포되면, 옛 청크 파일이 사라져 import()가 실패할 수 있다 → catch해서 새로고침을 유도한다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>버튼을 눌러야 쓰는 무거운 기능</b>: 엑셀 내보내기(xlsx), PDF 생성, 이미지 편집, 마크다운 에디터</>,
            <><b>조건부로만 필요한 코드</b>: 구형 브라우저용 polyfill, 관리자 권한일 때만 쓰는 모듈, 언어별 번역 파일</>,
            '모달·드로어처럼 열기 전엔 안 보이는 큰 UI (React에선 React.lazy 형태로)',
            'SSR이 안 되는 브라우저 전용 라이브러리 (Next.js의 next/dynamic + ssr: false)',
          ]}
          avoid={[
            '앱 시작에 바로 필요한 모듈 — 요청만 하나 늘어난다',
            '몇 KB짜리 작은 유틸 — 청크를 나누는 비용이 더 크다',
            '클릭 후 바로 결과가 나와야 하는데 미리 불러오기 없이 쓰는 경우 — 첫 클릭이 느려진다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>"엑셀 내보내기" 기능(300KB)을 세 가지 방식으로 넣었을 때, 언제 다운로드되고 사용자가 얼마나 기다리는지 비교합니다.</p>
        <TimelineViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '정적 import',
            code: `
import * as XLSX from 'xlsx'; // 300KB, 앱 시작 시 무조건 다운로드

function ExportButton({ rows }) {
  const handleClick = () => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    // ...
  };
  return <button onClick={handleClick}>엑셀로 내보내기</button>;
}`,
            note: '버튼을 한 번도 안 누르는 사용자도 300KB를 받는다. 첫 화면이 그만큼 늦어진다.',
          }}
          after={{
            label: '동적 import() + 미리 불러오기',
            code: `
const loadXLSX = () => import('xlsx'); // 같은 Promise는 캐시된다

function ExportButton({ rows }) {
  const handleClick = async () => {
    try {
      const XLSX = await loadXLSX();
      const sheet = XLSX.utils.json_to_sheet(rows);
      // ...
    } catch {
      alert('새 버전이 배포되었어요. 새로고침 해주세요.');
    }
  };
  return (
    <button onMouseEnter={loadXLSX} onClick={handleClick}>
      엑셀로 내보내기
    </button>
  );
}`,
            note: '평소엔 안 받고, 버튼에 마우스를 올리는 순간 받기 시작해서 클릭할 땐 거의 준비되어 있다.',
          }}
        />
        <Callout title="webpack 매직 주석">
          <CodeBlock
            code={`
import(/* webpackChunkName: "xlsx" */ 'xlsx');   // 청크 파일 이름 지정
import(/* webpackPrefetch: true */ './Modal');   // 한가할 때 미리 받기 (<link rel="prefetch">)
import(/* webpackPreload: true */ './Chart');    // 지금 페이지에서 곧 쓸 것, 병렬로 바로 받기`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <ImportDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const MODES = {
  static: {
    label: '정적 import',
    bars: [{ from: 0, to: 60, kind: 'main', text: 'main.js + xlsx (함께 다운로드)' }],
    firstPaint: 60,
    wait: 0,
    note: '첫 화면이 xlsx 300KB만큼 늦게 뜬다. 대신 클릭하면 바로 실행.',
  },
  dynamic: {
    label: '동적 import()',
    bars: [{ from: 0, to: 25, kind: 'main', text: 'main.js' }, { from: 70, to: 105, kind: 'chunk', text: 'xlsx 청크' }],
    firstPaint: 25,
    wait: 35,
    note: '첫 화면은 빨리 뜬다. 하지만 클릭한 뒤에야 받기 시작해서 사용자가 기다린다.',
  },
  prefetch: {
    label: '동적 import() + hover 시 미리',
    bars: [{ from: 0, to: 25, kind: 'main', text: 'main.js' }, { from: 55, to: 90, kind: 'chunk', text: 'xlsx 청크' }],
    firstPaint: 25,
    wait: 20,
    note: '첫 화면도 빠르고, 마우스를 올린 순간 받기 시작해 클릭 후 대기가 짧다.',
  },
};
const HOVER_AT = 55;
const CLICK_AT = 70;

function TimelineViz() {
  const [key, setKey] = useState('static');
  const m = MODES[key];
  return (
    <Viz>
      <Segmented value={key} onChange={setKey} options={Object.entries(MODES).map(([value, v]) => ({ value, label: v.label }))} />
      <div className="relative mt-8 h-16 min-w-[480px] rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {m.bars.map((b) => (
          <div
            key={b.text}
            className={`absolute top-3 flex h-10 items-center overflow-hidden rounded px-2 text-[11px] font-semibold whitespace-nowrap text-white ${b.kind === 'main' ? 'bg-indigo-500' : 'bg-sky-500'}`}
            style={{ left: `${b.from}%`, width: `${b.to - b.from}%` }}
          >
            {b.text}
          </div>
        ))}
        <Marker at={m.firstPaint} label="첫 화면" color="bg-emerald-500" />
        {key === 'prefetch' && <Marker at={HOVER_AT} label="hover" color="bg-amber-500" top />}
        <Marker at={CLICK_AT} label="클릭" color="bg-rose-500" top={key !== 'prefetch'} />
      </div>
      <div className="mt-8 text-xs text-zinc-400">시간 →</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="첫 화면까지 (상대 시간)" value={m.firstPaint} tone={m.firstPaint > 30 ? 'bad' : 'good'} />
        <Stat label="클릭 후 기다리는 시간" value={m.wait} tone={m.wait > 25 ? 'bad' : 'good'} />
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>→ {m.note}</p>
      <Legend items={[['bg-indigo-500', '첫 번들'], ['bg-sky-500', '나중에 받는 청크']]} />
    </Viz>
  );
}

function Marker({ at, label, color, top }) {
  return (
    <div className="absolute top-0 bottom-0" style={{ left: `${at}%` }}>
      <div className={`h-full w-0.5 ${color}`} />
      <span className={`absolute ${top ? '-top-6' : '-bottom-6'} -translate-x-1/2 text-[11px] font-bold whitespace-nowrap`}>{label}</span>
    </div>
  );
}

/* ---------- 데모 ---------- */

const ROWS = [
  { 이름: '김리액트', 직무: 'Frontend', 연차: 3 },
  { 이름: '박타입', 직무: 'Frontend', 연차: 5 },
  { 이름: '이노드', 직무: 'Backend', 연차: 2 },
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function ImportDemo() {
  const [prefetch, setPrefetch] = useState('off');
  const [delay, setDelay] = useState(1500);
  const [status, setStatus] = useState('아직 csvExport.js를 받지 않았어요');
  const [result, setResult] = useState(null);
  const [log, setLog] = useState([]);
  const loading = useRef(null); // 진행 중인 import() Promise (한 번만 요청)
  const startedAt = useRef(0);

  const add = (line) => setLog((l) => [`${(performance.now() / 1000).toFixed(1)}s  ${line}`, ...l].slice(0, 6));

  // 느린 네트워크를 흉내 내려고 지연을 넣었다. 같은 Promise를 재사용하므로 hover 후 클릭하면 남은 시간만 기다린다.
  const load = (why) => {
    if (!loading.current) {
      startedAt.current = performance.now();
      add(`${why} → import('./demo/csvExport.js') 시작`);
      setStatus('다운로드 중…');
      loading.current = wait(delay).then(() => import('./demo/csvExport.js'));
    }
    return loading.current;
  };

  const exportCSV = async () => {
    const clickedAt = performance.now();
    add('클릭');
    const mod = await load('클릭');
    const waited = Math.round(performance.now() - clickedAt);
    add(`모듈 준비 완료 → 클릭 후 ${waited}ms 기다림`);
    setStatus(`불러옴 (클릭 후 ${waited}ms 대기)`);
    setResult(mod.toCSV(ROWS));
  };

  const reset = () => {
    loading.current = null;
    setResult(null);
    setLog([]);
    setStatus('초기화됨 (다시 받는 것처럼 동작)');
  };

  return (
    <Demo hint="'CSV로 내보내기'를 누르면 그때 CSV 변환 모듈을 import()로 불러옵니다. '마우스 올리면 미리 받기'를 켜고, 버튼에 마우스를 1~2초 올렸다가 클릭해서 대기 시간을 비교해 보세요.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={prefetch} onChange={(v) => { setPrefetch(v); reset(); }} options={[{ value: 'off', label: '클릭할 때 받기' }, { value: 'on', label: '마우스 올리면 미리 받기' }]} />
        <select className={ui.input} value={delay} onChange={(e) => { setDelay(Number(e.target.value)); reset(); }}>
          <option value={800}>네트워크 0.8초</option>
          <option value={1500}>네트워크 1.5초</option>
          <option value={3000}>네트워크 3초</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className={ui.btnPrimary}
          onMouseEnter={() => prefetch === 'on' && load('마우스 올림')}
          onClick={exportCSV}
        >
          CSV로 내보내기
        </button>
        <button className={ui.btn} onClick={reset}>초기화</button>
        <span className={`text-sm ${ui.muted}`}>{status}</span>
      </div>
      {result && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">{result}</pre>
      )}
      {log.length > 0 && (
        <div className="mt-3 space-y-0.5 rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </Demo>
  );
}
