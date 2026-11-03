import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, Stat, ui,
} from '../components/kit.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

export default function React18() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React 18(2022년 3월)의 핵심은 <u>동시성 렌더링(Concurrent Rendering)</u>입니다.
          <Code>createRoot</Code>로 바꾸면 렌더링을 중단·재개할 수 있게 되고, 그 위에서 <u>자동 배칭, useTransition, Suspense 스트리밍 SSR</u>이 동작합니다.
        </OneLiner>

        <H3>새로 생긴 것 한눈에 보기</H3>
        <Table
          head={['기능', '한 줄 설명']}
          rows={[
            [<Code>createRoot</Code>, <>새 루트 API. 이걸 써야 18의 동시성 기능이 켜진다. (<Code>ReactDOM.render</Code>는 17 방식으로 동작, 19에서 삭제)</>],
            ['Automatic Batching', <>setTimeout·Promise·이벤트 리스너 안의 여러 setState도 <b>한 번의 렌더로 묶는다</b>. 17은 React 이벤트 핸들러 안에서만 묶었다.</>],
            [<Code>useTransition</Code>, <>급하지 않은 업데이트를 표시해서, 입력 같은 급한 업데이트가 먼저 처리되게 한다. (<Link className={linkCls} to="/react/in-react-optimization/deep/concurrent-mode">Concurrent Mode 심화</Link>)</>],
            [<Code>useDeferredValue</Code>, '값의 "늦게 따라오는 버전"을 만든다. 무거운 목록은 이전 값으로 먼저 그리고 나중에 따라온다.'],
            ['Suspense SSR 스트리밍', <>서버가 준비된 HTML부터 먼저 보내고, 느린 부분은 <Code>&lt;Suspense&gt;</Code> fallback으로 두었다가 나중에 채운다. 선택적 Hydration도 가능.</>],
            [<Code>useId</Code>, '서버와 클라이언트에서 같은 고유 ID를 만든다. label-input 연결, aria 속성에 사용.'],
            [<Code>useSyncExternalStore</Code>, '외부 저장소(Redux, Zustand, 브라우저 API)를 동시성 렌더링에서도 안전하게 구독. 라이브러리 작성자용.'],
            [<Code>useInsertionEffect</Code>, 'DOM 변경 전에 스타일을 넣는 CSS-in-JS 라이브러리용 Hook.'],
            ['Strict Mode 강화', '개발 모드에서 컴포넌트를 마운트 → 언마운트 → 다시 마운트해서, effect 정리(cleanup)를 빠뜨린 버그를 드러낸다.'],
          ]}
        />

        <H3>React 17과 가장 많이 비교되는 것: Automatic Batching</H3>
        <List
          items={[
            <><b>배칭</b> = 여러 state 변경을 모아서 렌더를 한 번만 하는 것.</>,
            <>React 17: <Code>onClick</Code> 같은 React 이벤트 안에서만 배칭. <Code>setTimeout</Code>, <Code>fetch().then</Code> 안에서 setState를 두 번 하면 <b>렌더도 두 번</b>.</>,
            <>React 18(createRoot): <b>어디서 호출하든</b> 같은 틱의 setState는 묶어서 한 번 렌더. 꼭 즉시 반영해야 하면 <Code>flushSync</Code>로 빠져나온다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>createRoot</b>: React 18 이상이면 무조건. 이게 동시성 기능의 스위치</>,
            <><b>useTransition / useDeferredValue</b>: 검색어 입력에 따라 큰 목록·차트가 다시 그려져 입력이 버벅일 때</>,
            <><b>useId</b>: SSR 환경에서 폼 label-input을 연결하거나 aria-describedby 같은 ID가 필요할 때 (Math.random은 서버/클라이언트 값이 달라져 hydration 경고)</>,
            <><b>Suspense + 스트리밍</b>: Next.js App Router의 loading.tsx처럼, 느린 데이터 영역만 나중에 보여주고 싶을 때</>,
          ]}
          avoid={[
            <><b>useId</b>를 리스트의 key로 쓰기 — key는 데이터의 id로</>,
            <><b>useSyncExternalStore</b>를 앱 코드에서 직접 쓰기 — 보통은 Zustand·Redux가 내부에서 쓰고 있다</>,
            <>모든 setState를 <b>startTransition</b>으로 감싸기 — 입력값처럼 바로 보여야 하는 건 급한 업데이트로 둬야 한다</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"React 18의 핵심은 동시성 렌더링이고, 그 덕분에 자동 배칭, 트랜지션, 스트리밍 SSR이 가능해졌다. createRoot로 바꾸는 것만으로 자동 배칭이 적용되고, 개발 모드 Strict Mode에서 effect가 두 번 실행되는 것도 18부터"라고 정리하면 됩니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>setTimeout 안에서 state를 두 번 바꿀 때, 버전에 따라 렌더가 몇 번 일어나는지 보세요.</p>
        <BatchViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>루트 만들기</H3>
        <CodeCompare
          before={{
            label: 'React 17',
            code: `
import ReactDOM from 'react-dom';

ReactDOM.render(<App />, document.getElementById('root'));`,
            note: '18에서도 동작은 하지만 경고가 뜨고, 17처럼 동작한다(동시성 기능 꺼짐). React 19에서는 삭제됐다.',
          }}
          after={{
            label: 'React 18+',
            code: `
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(<App />);`,
            note: '이 한 줄을 바꾸는 것이 18 업그레이드의 핵심. 자동 배칭과 동시성 기능이 켜진다.',
          }}
        />

        <H3>Automatic Batching</H3>
        <CodeCompare
          before={{
            label: 'React 17',
            code: `
function handleClick() {
  fetch('/api/user').then(() => {
    setLoading(false);  // 렌더 1
    setUser(data);      // 렌더 2 — 그 사이에 loading=false, user=null 인 화면이 잠깐 그려짐
  });
}`,
            note: 'Promise·setTimeout 안에서는 배칭이 안 돼서 렌더가 두 번, 중간 상태가 화면에 보일 수 있다.',
          }}
          after={{
            label: 'React 18+',
            code: `
function handleClick() {
  fetch('/api/user').then(() => {
    setLoading(false);
    setUser(data);      // 둘을 묶어서 렌더 1번
  });
}

// 정말 바로 반영해야 할 때만
flushSync(() => setLoading(false));  // 여기서 즉시 렌더`,
            note: '같은 코드인데 렌더가 한 번으로 줄었다. 업그레이드만으로 얻는 성능 개선.',
          }}
        />

        <H3>useId</H3>
        <CodeBlock
          code={`
function EmailField() {
  const id = useId();                // 예: ":r1:" — 서버와 클라이언트에서 같은 값
  return (
    <>
      <label htmlFor={id}>이메일</label>
      <input id={id} aria-describedby={\`\${id}-hint\`} />
      <p id={\`\${id}-hint\`}>회사 이메일을 입력하세요</p>
    </>
  );
}`}
        />

        <H3>useSyncExternalStore</H3>
        <CodeBlock
          code={`
// 브라우저의 온라인 상태(외부 저장소)를 구독
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  //                          구독 함수   현재 값 읽기              서버에서의 값
}`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>A. Automatic Batching</H3>
        <BatchDemo />
        <H3>B. useId · useSyncExternalStore</H3>
        <HooksDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

function BatchViz() {
  const [version, setVersion] = useState('18');
  const steps =
    version === '17'
      ? [['setCount(c + 1)', true], ['setFlag(f => !f)', true]]
      : [['setCount(c + 1)', false], ['setFlag(f => !f)', true]];

  return (
    <Viz>
      <Segmented
        value={version}
        onChange={setVersion}
        options={[{ value: '17', label: 'React 17 (ReactDOM.render)' }, { value: '18', label: 'React 18 (createRoot)' }]}
      />
      <div className="mt-5 min-w-[460px]">
        <div className="font-mono text-xs text-zinc-400">{'setTimeout(() => {'}</div>
        <div key={version} className="my-2 space-y-2 pl-6">
          {steps.map(([label, renders]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-40 font-mono text-sm">{label}</span>
              <span className="text-zinc-400">→</span>
              {renders ? (
                <span className="animate-flash rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold dark:bg-amber-500/10">렌더</span>
              ) : (
                <span className="rounded-lg border-2 border-dashed border-emerald-500 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">대기 (모아 둠)</span>
              )}
            </div>
          ))}
        </div>
        <div className="font-mono text-xs text-zinc-400">{'}, 0);'}</div>
      </div>
      <Legend items={[['bg-amber-300', '렌더 발생'], ['border-2 border-dashed border-emerald-500', '다음 변경과 묶기 위해 대기']]} />
      <p className={`mt-3 text-sm ${ui.muted}`}>
        {version === '17'
          ? '→ React 이벤트 핸들러 밖이라 배칭이 안 된다. setState마다 렌더 → 총 2번.'
          : '→ 같은 틱의 변경을 모아서 마지막에 한 번만 렌더 → 총 1번.'}
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

function BatchDemo() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  const renders = useRef(0);
  renders.current += 1;
  const [log, setLog] = useState([]);

  const run = (mode) => {
    const before = renders.current;
    setTimeout(() => {
      if (mode === '17') {
        // flushSync로 setState마다 즉시 렌더 → React 17의 setTimeout 안 동작과 같아진다
        flushSync(() => setCount((c) => c + 1));
        flushSync(() => setFlag((f) => !f));
      } else {
        setCount((c) => c + 1);
        setFlag((f) => !f);
      }
      // 렌더가 끝난 뒤 몇 번 렌더됐는지 기록
      setTimeout(() => {
        const n = renders.current - before;
        setLog((l) => [{ id: Date.now(), mode, n }, ...l].slice(0, 4));
      }, 50);
    }, 0);
  };

  return (
    <Demo hint="두 버튼 모두 setTimeout 안에서 state를 두 번 바꿉니다. 왼쪽은 flushSync로 React 17의 동작을 흉내 낸 것입니다. (기록하는 setLog 자체의 렌더는 빼고 셉니다)">
      <div className="flex flex-wrap gap-2">
        <button className={ui.btn} onClick={() => run('17')}>17 방식 (배칭 안 됨)</button>
        <button className={ui.btnPrimary} onClick={() => run('18')}>18 방식 (자동 배칭)</button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="count" value={count} />
        <Stat label="flag" value={String(flag)} />
        <Stat label="총 렌더" value={`${renders.current}회`} />
      </div>
      <ul className="mt-3 space-y-1">
        {log.map((r) => (
          <li key={r.id} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 font-mono text-xs dark:bg-zinc-800/60">
            <span>{r.mode === '17' ? '17 방식' : '18 방식'}: setState 2번</span>
            <span className={`ml-auto rounded px-2 py-0.5 font-bold ${r.n > 1 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
              렌더 {r.n}번
            </span>
          </li>
        ))}
      </ul>
    </Demo>
  );
}

function subscribeOnline(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function HooksDemo() {
  const id = useId();
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  return (
    <Demo hint="useId가 만든 ID가 label과 input을 연결합니다(라벨을 누르면 입력칸에 포커스). 개발자 도구 Network 탭에서 Offline으로 바꾸면 온라인 상태가 바로 바뀝니다.">
      <div className="grid gap-4 md:grid-cols-2">
        <div className={ui.box}>
          <label htmlFor={id} className="text-sm font-semibold">이메일 (라벨을 눌러 보세요)</label>
          <input id={id} className={`${ui.input} mt-2 w-full`} aria-describedby={`${id}-hint`} />
          <p id={`${id}-hint`} className={`mt-1 text-xs ${ui.muted}`}>useId 결과: <code className="font-mono">{id}</code></p>
        </div>
        <div className={ui.box}>
          <div className="text-sm font-semibold">useSyncExternalStore(navigator.onLine)</div>
          <div className={`mt-3 text-2xl font-bold ${online ? ui.good : ui.bad}`}>{online ? '온라인' : '오프라인'}</div>
          <p className={`mt-1 text-xs ${ui.muted}`}>브라우저의 online/offline 이벤트를 구독합니다.</p>
        </div>
      </div>
    </Demo>
  );
}
