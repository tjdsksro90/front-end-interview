import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function ReactClosure() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React 컴포넌트는 <u>렌더할 때마다 다시 실행되는 함수</u>이고, 그 안에서 만든 이벤트 핸들러·effect는 <u>그 렌더의 state를 기억하는 클로저</u>입니다.
          그래서 state는 "변하는 변수"가 아니라 <b>렌더마다 찍힌 스냅샷</b>처럼 동작하고, 오래된 렌더의 클로저가 살아 있으면 <b>오래된 값(stale closure)</b>을 보게 됩니다.
        </OneLiner>

        <H3>JS 클로저와 React를 나란히 보면</H3>
        <Table
          head={['', 'JS 클로저 (createCounter)', 'React (useCounter)']}
          rows={[
            ['값 보관', <>바깥 함수의 <Code>let count</Code></>, <><Code>useState</Code> — React가 컴포넌트 밖에 보관</>],
            ['바깥 함수 실행', '한 번 실행, 그 환경이 계속 살아 있음', <><b>렌더마다</b> 다시 실행 → 새 지역 변수, 새 클로저</>],
            ['내부 함수가 보는 값', '항상 같은 변수 (최신 값)', <b key="s">자기가 만들어진 렌더의 값</b>],
            ['은닉', '돌려준 함수로만 접근', '커스텀 Hook이 돌려준 함수로만 접근'],
            ['렌더와 무관한 가변 값', <Code>let</Code>, <><Code>useRef</Code> (바꿔도 다시 그리지 않음)</>],
          ]}
        />

        <H3>핵심 세 줄</H3>
        <List
          items={[
            <><b>state는 스냅샷이다.</b> <Code>setCount(5)</Code>를 불러도 <u>지금 실행 중인 코드의</u> <Code>count</Code>는 바뀌지 않는다. 바뀐 값은 <u>다음 렌더</u>에서 보인다.</>,
            <><b>렌더마다 새 클로저가 생긴다.</b> 3번째 렌더의 <Code>onClick</Code>은 3번째 렌더의 <Code>count</Code>를 기억한다.</>,
            <><b>오래 사는 콜백이 문제다.</b> <Code>setInterval</Code>, <Code>setTimeout</Code>, 이벤트 구독, <Code>useCallback</Code>/<Code>useEffect</Code>의 빠진 의존성 — 처음 만든 클로저를 계속 붙잡으면 값이 멈춘다.</>,
          ]}
        />

        <H3>오래된 값을 피하는 4가지 도구</H3>
        <Table
          head={['방법', '언제', '주의']}
          rows={[
            [<Code key="1">setCount(c =&gt; c + 1)</Code>, '이전 state로 다음 state를 계산할 때', '읽기만 할 때는 못 씀 (값을 화면 밖으로 꺼낼 수 없음)'],
            ['의존성 배열에 값 넣기', 'effect가 그 값에 맞춰 다시 실행돼야 할 때', 'interval·구독이 값이 바뀔 때마다 다시 설정됨'],
            [<><Code>useRef</Code>로 최신 값 보관</>, '렌더와 상관없이 "지금 값"만 읽으면 될 때', 'ref.current 변경은 화면을 다시 그리지 않음'],
            [<Code key="3">useEffectEvent</Code>, 'effect 안에서 최신 props·state를 읽되, 그 값 때문에 effect를 다시 실행하고 싶지 않을 때', 'effect 안에서만 호출, 다른 컴포넌트에 넘기지 않기, 의존성 숨기는 용도로 쓰지 않기'],
          ]}
        />

        <Callout type="tip" title="면접 포인트">
          <p>"커스텀 Hook은 클로저로 상태를 감추는 모듈 패턴과 같다"와 "렌더마다 새 클로저가 생겨서 state는 스냅샷처럼 동작하고, 오래 사는 콜백에서 stale closure가 생긴다"를 같이 말하면 좋아요.</p>
          <p>해결책은 상황별로 고르는 것까지: 다음 값 계산은 함수형 업데이트, 다시 연결이 필요하면 의존성, 최신 값만 읽으려면 ref나 useEffectEvent.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <H3>렌더마다 찍히는 스냅샷</H3>
        <p>+1을 몇 번 누른 뒤 "3초 뒤 알림"을 누르고, 3초 안에 +1을 더 눌러 보세요. 알림 클로저는 <b>누른 순간의 렌더</b> 값을 기억합니다.</p>
        <SnapshotViz />

        <H3>같은 타이머, 다른 결과</H3>
        <p>둘 다 1초마다 +1 하는 <Code>setInterval</Code>이고, 의존성 배열은 둘 다 <Code>[]</Code>입니다. 차이는 <Code>setCount</Code>에 넘기는 값뿐입니다.</p>
        <IntervalViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>1. interval 안에서 state 읽기</H3>
        <CodeCompare
          before={{
            label: '첫 렌더의 count에 갇힘',
            code: `
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1); // 항상 0 + 1
  }, 1000);
  return () => clearInterval(id);
}, []); // 첫 렌더의 클로저만 등록됨`,
            note: 'effect는 한 번만 실행되므로 interval 콜백은 count가 0이던 렌더의 클로저다. 화면은 1에서 멈춘다.',
          }}
          after={{
            label: '함수형 업데이트',
            code: `
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + 1); // React가 최신 값을 넘겨줌
  }, 1000);
  return () => clearInterval(id);
}, []);`,
            note: '클로저가 count를 기억할 필요가 없어진다. React가 대기 중인 최신 state를 인자로 준다.',
          }}
        />

        <H3>2. 비동기 콜백에서 읽기 (state는 스냅샷)</H3>
        <CodeCompare
          before={{
            label: '누른 순간의 값',
            code: `
function send() {
  setTimeout(() => {
    alert(message); // 버튼을 누른 렌더의 message
  }, 3000);
}
// 3초 안에 입력을 바꿔도 알림은 예전 값`,
            note: '보통은 이게 맞는 동작이다. "보내기를 누른 순간의 내용"을 보내야 하니까.',
          }}
          after={{
            label: '정말 "지금 값"이 필요하면 ref',
            code: `
const latest = useRef(message);
latest.current = message; // 렌더마다 최신 값 기록

function send() {
  setTimeout(() => {
    alert(latest.current); // 3초 뒤의 최신 값
  }, 3000);
}`,
            note: 'ref는 렌더마다 같은 객체라서, 오래된 클로저도 같은 ref를 통해 최신 값을 읽는다.',
          }}
        />

        <H3>3. useCallback의 빠진 의존성</H3>
        <CodeCompare
          before={{
            label: '의존성 누락',
            code: `
const handleSave = useCallback(() => {
  api.save(form); // 첫 렌더의 form만 저장됨
}, []);`,
            note: 'useCallback은 클로저를 재사용하는 도구다. 의존성을 빼면 오래된 클로저를 재사용하게 된다.',
          }}
          after={{
            label: '의존성 포함',
            code: `
const handleSave = useCallback(() => {
  api.save(form);
}, [form]); // form이 바뀌면 새 클로저`,
            note: 'eslint-plugin-react-hooks의 exhaustive-deps 규칙이 이런 누락을 잡아 준다.',
          }}
        />

        <H3>4. effect를 다시 실행하지 않고 최신 값 읽기: useEffectEvent</H3>
        <CodeCompare
          before={{
            label: 'theme 때문에 재연결',
            code: `
useEffect(() => {
  const conn = connect(roomId);
  conn.on('connected', () => {
    showNotification('연결됨', theme);
  });
  return () => conn.disconnect();
}, [roomId, theme]); // 테마만 바꿔도 다시 연결`,
            note: 'theme을 읽으려면 의존성에 넣어야 하고, 그러면 테마를 바꿀 때마다 채팅방에 다시 연결된다.',
          }}
          after={{
            label: 'Effect Event로 분리',
            code: `
const onConnected = useEffectEvent(() => {
  showNotification('연결됨', theme); // 항상 최신 theme
});

useEffect(() => {
  const conn = connect(roomId);
  conn.on('connected', onConnected);
  return () => conn.disconnect();
}, [roomId]); // 방이 바뀔 때만 재연결`,
            note: '"연결"은 roomId에 반응하고, "알림 보여 주기"는 이벤트처럼 최신 값만 읽는다. React 공식 문서의 예시와 같은 구조.',
          }}
        />

        <H3>5. 커스텀 Hook = 클로저 모듈 패턴</H3>
        <CodeBlock
          code={`
// JS 모듈 패턴: 바깥 함수의 변수를 숨기고, 다루는 함수만 공개
function createCart() {
  let items = [];
  return {
    add: (item) => { items = [...items, item]; },
    count: () => items.length,
  };
}

// React: 값은 useState에, 다루는 함수는 클로저로
function useCart() {
  const [items, setItems] = useState([]);
  const add = useCallback((item) => setItems((prev) => [...prev, item]), []);
  return { items, count: items.length, add };
}`}
        />
        <List
          items={[
            <><Code>add</Code>는 함수형 업데이트를 써서 <Code>items</Code>를 기억할 필요가 없다. 그래서 의존성이 <Code>[]</Code>여도 안전하고, 자식에게 넘겨도 참조가 바뀌지 않는다.</>,
            <>쓰는 쪽은 <Code>setItems</Code>를 모른다. 정해진 함수로만 상태를 바꿀 수 있다 (은닉).</>,
          ]}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>한 번 클릭에 +3 하기</H3>
        <PlusThree />
        <H3>멈춘 타이머 고치기</H3>
        <FixLab />
      </Section>
    </>
  );
}

// ───────────────── 시각화 1: 스냅샷 ─────────────────
function SnapshotViz() {
  const [count, setCount] = useState(0);
  const latest = useRef(count);
  latest.current = count;
  const renders = useRef(0);
  renders.current += 1;
  const [alerts, setAlerts] = useState([]);

  const schedule = () => {
    const id = Date.now();
    const captured = count; // 이 렌더의 count
    const renderNo = renders.current;
    setAlerts((a) => [...a, { id, captured, renderNo, done: false }]);
    setTimeout(() => {
      setAlerts((a) => a.map((x) => (x.id === id ? { ...x, done: true, latest: latest.current } : x)));
    }, 3000);
  };

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <Stat label="화면의 count" value={count} />
        <button className={ui.btn} onClick={() => setCount(count + 1)}>+1</button>
        <button className={ui.btnPrimary} onClick={schedule}>3초 뒤 알림</button>
        <button className={ui.btn} onClick={() => { setCount(0); setAlerts([]); }}>초기화</button>
      </div>
      <div className="mt-4 space-y-2">
        {alerts.length === 0 && <p className={`text-sm ${ui.muted}`}>아직 예약한 알림이 없어요.</p>}
        {alerts.map((a) => (
          <div key={a.id} className={`${ui.box} flex flex-wrap items-center gap-x-4 gap-y-1 text-sm`}>
            <span className="font-mono text-xs text-zinc-500">렌더 #{a.renderNo}에서 만든 클로저</span>
            {a.done ? (
              <>
                <span>클로저가 본 count: <b className={a.captured === a.latest ? ui.good : ui.warn}>{a.captured}</b></span>
                <span>ref로 읽은 지금 count: <b>{a.latest}</b></span>
                {a.captured !== a.latest && <span className={`text-xs ${ui.warn}`}>그사이 값이 바뀌었지만 클로저는 예전 값을 기억</span>}
              </>
            ) : (
              <span className={ui.muted}>3초 기다리는 중… (지금 +1을 눌러 보세요)</span>
            )}
          </div>
        ))}
      </div>
    </Viz>
  );
}

// ───────────────── 시각화 2: 타이머 ─────────────────
function IntervalViz() {
  const [running, setRunning] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        <button className={ui.btnPrimary} onClick={() => setRunning((r) => !r)}>{running ? '멈추기' : '시작'}</button>
        <button className={ui.btn} onClick={() => { setRunning(false); setKey((k) => k + 1); }}>처음부터</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TimerBox key={`a${key}`} running={running} stale />
        <TimerBox key={`b${key}`} running={running} />
      </div>
    </Viz>
  );
}

function TimerBox({ running, stale }) {
  const [count, setCount] = useState(0);
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (stale) setCount(count + 1); // 이 effect가 만들어진 렌더의 count
      else setCount((c) => c + 1);
      setTicks((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
    // 의도적으로 count를 빼서 stale closure를 재현한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className={ui.box}>
      <p className="font-mono text-xs text-zinc-500">{stale ? 'setCount(count + 1)' : 'setCount(c => c + 1)'}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums">{count}</p>
      <p className={`mt-1 text-xs ${ui.muted}`}>interval 실행 {ticks}번</p>
      {ticks > 1 && (
        <p className={`mt-2 text-xs ${stale ? ui.bad : ui.good}`}>
          {stale ? `${ticks}번 실행됐지만 매번 "0 + 1"을 넣어서 멈춰 있어요` : '매번 최신 값에 +1'}
        </p>
      )}
    </div>
  );
}

// ───────────────── 직접 해보기 1: +3 ─────────────────
function PlusThree() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  return (
    <Demo hint="두 버튼 모두 한 번 클릭에 set 함수를 세 번 부릅니다. 결과가 왜 다를까요?">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={ui.box}>
          <pre className="font-mono text-xs text-zinc-500">{'setA(a + 1);\nsetA(a + 1);\nsetA(a + 1);'}</pre>
          <div className="mt-3 flex items-center gap-3">
            <button className={ui.btn} onClick={() => { setA(a + 1); setA(a + 1); setA(a + 1); }}>+3?</button>
            <span className="text-2xl font-bold tabular-nums">{a}</span>
          </div>
          <p className={`mt-2 text-xs ${ui.muted}`}>이 렌더의 a가 0이면 세 번 모두 setA(1). 그래서 +1만 된다.</p>
        </div>
        <div className={ui.box}>
          <pre className="font-mono text-xs text-zinc-500">{'setB(b => b + 1);\nsetB(b => b + 1);\nsetB(b => b + 1);'}</pre>
          <div className="mt-3 flex items-center gap-3">
            <button className={ui.btn} onClick={() => { setB((x) => x + 1); setB((x) => x + 1); setB((x) => x + 1); }}>+3</button>
            <span className="text-2xl font-bold tabular-nums">{b}</span>
          </div>
          <p className={`mt-2 text-xs ${ui.muted}`}>업데이터 함수는 큐에 쌓였다가 다음 렌더에서 차례로 적용된다. 0→1→2→3.</p>
        </div>
      </div>
      <button className={`${ui.btn} mt-3`} onClick={() => { setA(0); setB(0); }}>초기화</button>
    </Demo>
  );
}

// ───────────────── 직접 해보기 2: 고치기 ─────────────────
const FIXES = {
  stale: {
    label: '그대로 (버그)',
    code: `useEffect(() => {
  const id = setInterval(() => {
    setCount(count + step);
  }, 1000);
  return () => clearInterval(id);
}, []);`,
    note: 'count와 step 모두 첫 렌더 값에 갇힌다. 숫자가 멈추고, step을 바꿔도 반영되지 않는다.',
  },
  updater: {
    label: '함수형 업데이트',
    code: `useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + step);
  }, 1000);
  return () => clearInterval(id);
}, []);`,
    note: 'count 문제는 해결. 하지만 step은 여전히 첫 렌더 값이라 step을 바꿔도 +1만 된다.',
  },
  deps: {
    label: '의존성에 넣기',
    code: `useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + step);
  }, 1000);
  return () => clearInterval(id);
}, [step]);`,
    note: 'step이 바뀌면 effect가 다시 실행돼 새 클로저가 등록된다. 대신 interval이 다시 설정된다 (설정 횟수를 보세요).',
  },
  ref: {
    label: 'useRef',
    code: `const stepRef = useRef(step);
stepRef.current = step;

useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + stepRef.current);
  }, 1000);
  return () => clearInterval(id);
}, []);`,
    note: 'interval은 한 번만 설정되고, 매번 ref에서 최신 step을 읽는다.',
  },
  effectEvent: {
    label: 'useEffectEvent',
    code: `const onTick = useEffectEvent(() => {
  setCount((c) => c + step); // 최신 step
});

useEffect(() => {
  const id = setInterval(() => onTick(), 1000);
  return () => clearInterval(id);
}, []);`,
    note: 'ref 방식과 같은 효과를 React가 공식적으로 제공. "tick"은 이벤트처럼 최신 값을 읽고, effect는 다시 실행되지 않는다.',
  },
};

function FixLab() {
  const [mode, setMode] = useState('stale');
  const [step, setStep] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const Impl = IMPLS[mode];
  return (
    <Demo hint="고치는 방법을 고르고, 실행 중에 step을 바꿔 보세요. 숫자가 멈추는지, step이 반영되는지, interval이 몇 번 다시 설정되는지 비교합니다.">
      <Segmented value={mode} onChange={(v) => { setMode(v); setRunKey((k) => k + 1); }} options={Object.entries(FIXES).map(([value, f]) => ({ value, label: f.label }))} />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100">{FIXES[mode].code}</pre>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            step:
            <Segmented value={step} onChange={setStep} options={[1, 5, 10].map((v) => ({ value: v, label: `+${v}` }))} />
            <button className={ui.btn} onClick={() => setRunKey((k) => k + 1)}>처음부터</button>
          </div>
          <Impl key={runKey} step={step} />
          <p className={`mt-2 text-sm ${mode === 'stale' ? ui.bad : ui.muted}`}>{FIXES[mode].note}</p>
        </div>
      </div>
    </Demo>
  );
}

function Readout({ count, setups }) {
  return (
    <div className="mt-3 flex gap-3">
      <Stat label="count" value={count} />
      <Stat label="interval 설정 횟수" value={setups} />
    </div>
  );
}

function useSetupCounter() {
  const [setups, setSetups] = useState(0);
  return [setups, useCallback(() => setSetups((s) => s + 1), [])];
}

const IMPLS = {
  stale: function Stale({ step }) {
    const [count, setCount] = useState(0);
    const [setups, bump] = useSetupCounter();
    useEffect(() => {
      bump();
      const id = setInterval(() => setCount(count + step), 1000);
      return () => clearInterval(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <Readout count={count} setups={setups} />;
  },
  updater: function Updater({ step }) {
    const [count, setCount] = useState(0);
    const [setups, bump] = useSetupCounter();
    useEffect(() => {
      bump();
      const id = setInterval(() => setCount((c) => c + step), 1000);
      return () => clearInterval(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <Readout count={count} setups={setups} />;
  },
  deps: function Deps({ step }) {
    const [count, setCount] = useState(0);
    const [setups, bump] = useSetupCounter();
    useEffect(() => {
      bump();
      const id = setInterval(() => setCount((c) => c + step), 1000);
      return () => clearInterval(id);
    }, [step, bump]);
    return <Readout count={count} setups={setups} />;
  },
  ref: function RefImpl({ step }) {
    const [count, setCount] = useState(0);
    const [setups, bump] = useSetupCounter();
    const stepRef = useRef(step);
    stepRef.current = step;
    useEffect(() => {
      bump();
      const id = setInterval(() => setCount((c) => c + stepRef.current), 1000);
      return () => clearInterval(id);
    }, [bump]);
    return <Readout count={count} setups={setups} />;
  },
  effectEvent: function EffectEventImpl({ step }) {
    const [count, setCount] = useState(0);
    const [setups, bump] = useSetupCounter();
    const onTick = useEffectEvent(() => setCount((c) => c + step));
    useEffect(() => {
      bump();
      const id = setInterval(() => onTick(), 1000);
      return () => clearInterval(id);
    }, [bump]);
    return <Readout count={count} setups={setups} />;
  },
};
