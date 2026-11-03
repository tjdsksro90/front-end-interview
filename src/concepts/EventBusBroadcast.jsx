import { useEffect, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Toggle, ui,
} from '../components/kit.jsx';

export default function EventBusBroadcast() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Event Bus는 <u>"이벤트를 보내는 쪽"과 "받는 쪽"이 서로를 모른 채 중간 통로(bus)로 메시지를 주고받는 pub/sub 패턴</u>이고,
          BroadcastChannel은 같은 사이트의 <u>다른 탭·창끼리</u> 메시지를 주고받는 브라우저 API입니다.
        </OneLiner>

        <H3>Event Bus (pub/sub)</H3>
        <List
          items={[
            <><Code>on(이벤트, 핸들러)</Code>로 구독, <Code>emit(이벤트, 데이터)</Code>로 발행, <Code>off</Code>로 해제. 라이브러리 <Code>mitt</Code>(200B)가 대표적, <Code>window.dispatchEvent(new CustomEvent())</Code>로도 가능.</>,
            <>props나 Context로 이어지지 않은 먼 컴포넌트, 혹은 <b>React 밖의 코드</b>(axios 인터셉터, 다른 프레임워크로 만든 마이크로 프론트엔드)와 통신할 때 쓴다.</>,
            <>단점: 데이터 흐름이 코드에 안 드러나 추적이 어렵고, <b>언마운트 때 off를 안 하면 메모리 누수·중복 실행</b>. 그래서 React 앱의 일반 상태 공유에는 Context/스토어가 우선이다.</>,
          ]}
        />

        <H3>BroadcastChannel (탭 간 통신)</H3>
        <List
          items={[
            <><Code>new BroadcastChannel('이름')</Code>을 같은 이름으로 연 모든 탭·창·iframe·Worker가 메시지를 받는다. <b>같은 출처(origin)끼리만</b>.</>,
            <>보낸 탭 자신은 메시지를 받지 않는다.</>,
          ]}
        />
        <Table
          head={['방법', '범위', '특징']}
          rows={[
            ['BroadcastChannel', '같은 출처의 모든 탭', '가장 간단. 구조화된 데이터(객체) 그대로 전송'],
            [<><Code>storage</Code> 이벤트</>, '같은 출처의 다른 탭', 'localStorage 값이 바뀌면 다른 탭에 이벤트. 예전 방식, 문자열만'],
            [<Code>window.postMessage</Code>, '특정 창/iframe (다른 출처도 가능)', '팝업, 결제창, 외부 iframe과 통신'],
            ['SharedWorker / Service Worker', '탭들이 공유하는 백그라운드', '연결 하나를 탭들이 공유 (예: 웹소켓 하나로)'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>BroadcastChannel</b>: 한 탭에서 로그아웃하면 <b>모든 탭 로그아웃</b>, 장바구니·알림 수 동기화, 다크모드 동기화</>,
            <><b>BroadcastChannel</b>: 토큰 재발급을 한 탭만 하고 나머지 탭에 새 토큰 전달</>,
            <><b>Event Bus</b>: axios 인터셉터(React 밖)에서 "401 발생" → 로그인 모달 열기, 전역 토스트 알림</>,
            <><b>Event Bus</b>: 마이크로 프론트엔드끼리 느슨하게 통신, 분석(analytics) 이벤트 수집</>,
          ]}
          avoid={[
            '부모-자식, 형제처럼 props·Context로 충분한 관계 — 흐름이 숨겨져 디버깅이 어려워진다',
            '앱 상태 저장소 대용 — 이벤트는 "지나가는 알림"이라 늦게 구독한 쪽은 이전 값을 모른다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>실제로 동작하는 작은 Event Bus입니다. 구독자를 켜고 끄면서 이벤트를 발행해 보세요. 발행하는 쪽은 누가 받는지 모릅니다.</p>
        <BusViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'storage 이벤트로 탭 동기화 (예전 방식)',
            code: `
// 탭 A: 로그아웃
localStorage.setItem('logout', Date.now().toString());
// 같은 값이면 이벤트가 안 나서 매번 다른 값을 넣는 꼼수

// 탭 B
window.addEventListener('storage', (e) => {
  if (e.key === 'logout') location.href = '/login';
});`,
            note: '문자열만 되고, 동기화용 값이 localStorage에 남는다. 목적이 "메시지 전달"인데 저장소를 빌려 쓰는 셈.',
          }}
          after={{
            label: 'BroadcastChannel',
            code: `
const channel = new BroadcastChannel('auth');

// 탭 A: 로그아웃
channel.postMessage({ type: 'LOGOUT' });

// 모든 다른 탭
channel.onmessage = (e) => {
  if (e.data.type === 'LOGOUT') {
    queryClient.clear();
    router.replace('/login');
  }
};

// React에서는 언마운트 때 닫기
useEffect(() => {
  const ch = new BroadcastChannel('auth');
  ch.onmessage = handle;
  return () => ch.close();
}, []);`,
            note: '객체를 그대로 보내고, 저장소를 더럽히지 않는다.',
          }}
        />
        <Callout title="Event Bus 직접 구현 (mitt와 비슷)">
          <CodeBlock
            code={`
function createBus() {
  const handlers = new Map();  // 이벤트 이름 → 핸들러 Set
  return {
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
      return () => handlers.get(type).delete(fn);  // 해제 함수 반환
    },
    emit(type, payload) {
      handlers.get(type)?.forEach((fn) => fn(payload));
    },
  };
}
export const bus = createBus();

// axios 인터셉터 (React 밖)
api.interceptors.response.use(null, (err) => {
  if (err.response?.status === 401) bus.emit('auth:expired');
  return Promise.reject(err);
});

// React 컴포넌트
useEffect(() => bus.on('auth:expired', () => setLoginModalOpen(true)), []);`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <BroadcastDemo />
      </Section>
    </>
  );
}

/* ---------- Event Bus ---------- */

function createBus() {
  const handlers = new Map();
  return {
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
      return () => handlers.get(type).delete(fn);
    },
    emit(type, payload) {
      handlers.get(type)?.forEach((fn) => fn(payload));
    },
  };
}
const demoBus = createBus();

function BusViz() {
  const [subs, setSubs] = useState({ Toast: true, Header: true, Analytics: false });
  const [sent, setSent] = useState(0);
  return (
    <Viz>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1.4fr] md:items-center">
        <div className={ui.box}>
          <div className="text-sm font-semibold">발행자: 장바구니 버튼</div>
          <p className="mt-1 font-mono text-[11px] text-zinc-400">bus.emit('cart:added', {'{ name }'})</p>
          <button className={`${ui.btnPrimary} mt-3`} onClick={() => { setSent((n) => n + 1); demoBus.emit('cart:added', { name: `상품 ${sent + 1}` }); }}>상품 담기 (emit)</button>
        </div>
        <div className="text-center text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          <div className="rounded-full bg-indigo-100 px-3 py-1.5 dark:bg-indigo-500/20">Event Bus</div>
          <div className="mt-1 font-mono text-[11px] text-zinc-400">'cart:added' 구독자 {Object.values(subs).filter(Boolean).length}명</div>
        </div>
        <div className="space-y-2">
          {Object.keys(subs).map((name) => (
            <Subscriber key={name} name={name} on={subs[name]} onToggle={(v) => setSubs((s) => ({ ...s, [name]: v }))} />
          ))}
        </div>
      </div>
    </Viz>
  );
}

function Subscriber({ name, on, onToggle }) {
  const [received, setReceived] = useState([]);
  useEffect(() => {
    if (!on) return;
    return demoBus.on('cart:added', (p) => setReceived((r) => [p.name, ...r].slice(0, 3))); // 반환값 = 해제 함수
  }, [on]);
  const action = { Toast: '토스트 띄우기', Header: '장바구니 숫자 +1', Analytics: '분석 서버로 전송' }[name];
  return (
    <div className={`${ui.box} !py-2 ${on ? '' : 'opacity-50'}`}>
      <div className="flex items-center justify-between gap-2">
        <Toggle checked={on} onChange={onToggle} label={<span className="text-sm">{name} <span className="font-normal text-zinc-400">— {action}</span></span>} />
      </div>
      <div className="mt-1 font-mono text-xs text-zinc-500">{received.length ? `받음: ${received.join(', ')}` : '받은 이벤트 없음'}</div>
    </div>
  );
}

/* ---------- 데모: 실제 BroadcastChannel ---------- */

const supported = typeof BroadcastChannel !== 'undefined';

function BroadcastDemo() {
  const [channel, setChannel] = useState(null);
  const [log, setLog] = useState([]);
  const [loggedIn, setLoggedIn] = useState(true);
  const [text, setText] = useState('');
  const [tabId] = useState(() => Math.random().toString(36).slice(2, 6).toUpperCase());

  useEffect(() => {
    if (!supported) return;
    const ch = new BroadcastChannel('front-study-demo');
    ch.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'LOGOUT') setLoggedIn(false);
      if (m.type === 'LOGIN') setLoggedIn(true);
      setLog((l) => [`← 탭 ${m.from}: ${m.type === 'CHAT' ? m.text : m.type}`, ...l].slice(0, 8));
    };
    setChannel(ch);
    return () => ch.close();
  }, []);

  const send = (msg) => {
    channel.postMessage({ ...msg, from: tabId });
    setLog((l) => [`→ 보냄: ${msg.type === 'CHAT' ? msg.text : msg.type}`, ...l].slice(0, 8));
  };

  if (!supported) return <Demo><p className="text-sm">이 브라우저는 BroadcastChannel을 지원하지 않아요.</p></Demo>;

  return (
    <Demo hint="이 페이지를 새 탭으로 하나 더 열고(아래 버튼), 두 탭을 나란히 놓은 뒤 한쪽에서 로그아웃하거나 메시지를 보내 보세요. 다른 탭이 즉시 받습니다.">
      <div className="flex flex-wrap items-center gap-3">
        <a className={ui.btn} href={location.href} target="_blank" rel="noopener noreferrer">이 페이지 새 탭으로 열기</a>
        <span className="rounded-lg bg-zinc-100 px-3 py-1.5 font-mono text-xs dark:bg-zinc-800">이 탭 ID: {tabId}</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className={`${ui.box} flex items-center justify-between gap-2`}>
            <span className="text-sm">로그인 상태: <b className={loggedIn ? ui.good : ui.bad}>{loggedIn ? '로그인됨' : '로그아웃됨'}</b></span>
            {loggedIn ? (
              <button className={ui.btnPrimary} onClick={() => { setLoggedIn(false); send({ type: 'LOGOUT' }); }}>모든 탭 로그아웃</button>
            ) : (
              <button className={ui.btn} onClick={() => { setLoggedIn(true); send({ type: 'LOGIN' }); }}>다시 로그인</button>
            )}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text) { send({ type: 'CHAT', text }); setText(''); } }}>
            <input className={`${ui.input} flex-1`} placeholder="다른 탭에 보낼 메시지" value={text} onChange={(e) => setText(e.target.value)} />
            <button className={ui.btn}>보내기</button>
          </form>
        </div>
        <div className="min-h-32 space-y-0.5 rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
          <div className="mb-1 text-zinc-400">채널 'front-study-demo' 로그</div>
          {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <span className="text-zinc-400">아직 없음</span>}
        </div>
      </div>
    </Demo>
  );
}
