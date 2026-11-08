import { useEffect, useId, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Section, H3, List, Code, OneLiner, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Toggle, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function HydrationMismatch() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Hydration은 서버가 만든 HTML을 버리지 않고, 브라우저에서 컴포넌트를 <u>한 번 더 실행해 같은 결과인지 비교한 뒤</u> 이벤트만 붙이는 과정입니다.
          이때 서버와 브라우저의 렌더 결과가 다르면 불일치(mismatch)가 나고, React는 서버 HTML을 버리고 클라이언트에서 다시 그립니다.
        </OneLiner>

        <H3>Hydration은 "다시 그리기"가 아니라 "맞춰보기"</H3>
        <List
          items={[
            <>서버(SSR·SSG)는 컴포넌트를 실행해 HTML 문자열을 만들어 보낸다. 브라우저는 JS가 오기 전에 이 HTML을 먼저 보여준다 (보이지만 아직 클릭은 안 됨).</>,
            <>JS가 도착하면 <Code>hydrateRoot(container, &lt;App /&gt;)</Code>가 같은 컴포넌트를 <b>브라우저에서 다시 실행</b>한다.</>,
            <>React는 새로 만든 DOM을 붙이는 대신, 이미 있는 DOM 노드를 순서대로 따라가며 "내가 그릴 결과와 같은가?"를 확인하고, 같으면 그 노드를 그대로 쓰고 이벤트 핸들러만 연결한다.</>,
            <>그래서 hydration의 전제는 <b>서버의 첫 렌더 결과 = 브라우저의 첫 렌더 결과</b>다. React 문서도 불일치를 "버그처럼 고쳐야 한다"고 말한다.</>,
          ]}
        />

        <H3>불일치가 나면 어떻게 되나</H3>
        <List
          items={[
            <>텍스트나 구조가 다르면 React 19는 <Code>Hydration failed because the server rendered HTML didn't match the client</Code> 에러를 내고, 그 트리를 <b>클라이언트에서 처음부터 다시 그린다</b>. 서버 HTML이 버려지니 화면이 깜빡이고, SSR로 얻은 성능 이점이 사라진다.</>,
            <>속성(attribute)만 다르면 개발 모드에서 경고만 나오고, <b>DOM의 값을 고쳐준다는 보장이 없다</b>. 서버 값이 그대로 남아 있을 수 있다.</>,
            <>앱은 대부분 "동작은 하기" 때문에 놓치기 쉽다. 최악의 경우 이벤트 핸들러가 엉뚱한 요소에 붙을 수 있다.</>,
            <>프로덕션 빌드에서는 에러 내용이 줄어든 형태(에러 번호 + 링크)로만 나온다. 원인은 개발 모드 콘솔의 diff에서 확인한다.</>,
          ]}
        />

        <H3>불일치가 발생하는 이유</H3>
        <p>핵심은 하나입니다. <b>렌더 중에 서버와 브라우저에서 다른 값을 읽었다.</b> 구체적으로는 이런 경우입니다.</p>
        <Table
          head={['원인', '예시', '왜 달라지나']}
          rows={[
            ['시간에 따라 바뀌는 값', <><Code>new Date()</Code>, <Code>Date.now()</Code></>, '서버가 렌더한 시각과 브라우저가 hydrate하는 시각이 다르다'],
            ['실행할 때마다 바뀌는 값', <><Code>Math.random()</Code>, <Code>crypto.randomUUID()</Code></>, '서버와 브라우저에서 각각 새로 뽑는다'],
            ['시간대·언어 설정', <><Code>toLocaleString()</Code>, <Code>Intl.DateTimeFormat</Code></>, '서버는 보통 UTC·영어, 사용자는 KST·한국어'],
            ['브라우저 전용 값으로 분기', <><Code>typeof window</Code>, <Code>localStorage</Code>, <Code>matchMedia</Code></>, '서버에는 window가 없어서 다른 쪽 분기를 렌더한다'],
            ['잘못된 HTML 중첩', <><Code>&lt;p&gt;</Code> 안의 <Code>&lt;div&gt;</Code>, <Code>&lt;a&gt;</Code> 안의 <Code>&lt;a&gt;</Code></>, '브라우저 HTML 파서가 구조를 고쳐버려서 React가 기대한 DOM과 달라진다'],
            ['HTML을 건드리는 외부 요인', '브라우저 확장 프로그램, iOS 전화번호 자동 링크, CDN의 HTML 압축', 'React가 실행되기 전에 누군가 DOM을 바꿨다'],
            ['서버와 클라이언트 데이터 차이', '서버 렌더 후 바뀐 API 응답, 잘못 설정된 CSS-in-JS', '같은 컴포넌트에 다른 데이터가 들어갔다'],
          ]}
        />
        <Callout type="warn" title="잘못된 HTML 중첩이 가장 헷갈린다">
          <p>코드에는 <Code>&lt;p&gt;&lt;div&gt;…&lt;/div&gt;&lt;/p&gt;</Code>라고 썼고 서버도 그대로 보냈는데, 브라우저 HTML 파서는 <Code>&lt;p&gt;</Code> 안에 <Code>&lt;div&gt;</Code>를 허용하지 않아 <Code>&lt;p&gt;&lt;/p&gt;&lt;div&gt;…&lt;/div&gt;&lt;p&gt;&lt;/p&gt;</Code>로 바꿔버립니다. 서버와 클라이언트의 렌더 결과는 같아도, <b>그 사이 브라우저가 DOM을 바꿔서</b> 불일치가 납니다. 아래 4단계에서 실제로 확인할 수 있습니다.</p>
        </Callout>

        <H3>고치는 방법</H3>
        <Table
          head={['방법', '언제', '주의']}
          rows={[
            [<>첫 렌더는 서버와 같게, 바뀌는 값은 <Code>useEffect</Code>에서</>, '시간, 랜덤, localStorage, window 크기 등 브라우저에서만 알 수 있는 값', '렌더가 한 번 더 일어나고, 잠깐 기본값이 보인다'],
            [<><Code>useId</Code></>, '접근성용 id(label-input 연결, aria-*)', '서버와 클라이언트의 컴포넌트 트리가 같아야 한다. 리스트 key로 쓰지 않는다'],
            ['서버에서 값을 정해 props로 넘기기', '랜덤 추천, 기준 시각처럼 서버에서 정해도 되는 값', '두 쪽이 같은 값을 쓰므로 가장 깔끔하다'],
            [<><Code>suppressHydrationWarning</Code></>, '타임스탬프처럼 정말 같게 만들 수 없는 텍스트', '그 요소 한 단계만 적용, 텍스트를 고쳐주지 않는다. 비상구로만'],
            [<>Next.js <Code>dynamic(..., {'{ ssr: false }'})</Code></>, '서버에서 아예 그릴 수 없는 컴포넌트 (지도, 차트, 브라우저 전용 라이브러리)', '그 부분은 SSR 이점이 없다'],
            ['HTML 중첩 고치기', <><Code>&lt;p&gt;</Code> 안에는 <Code>&lt;span&gt;</Code> 같은 인라인 요소만</>, '개발 모드 콘솔이 중첩 오류를 알려준다'],
            [<><Code>&lt;meta name="format-detection" …&gt;</Code></>, 'iOS가 전화번호·주소를 링크로 바꾸는 문제', <><Code>content="telephone=no, date=no, email=no, address=no"</Code></>],
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>서버 HTML이 화면에 나오고 나서 hydration이 어떻게 진행되는지, 일치할 때와 불일치할 때를 단계별로 봅니다.</p>
        <FlowViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>1. 시간·랜덤 값: 첫 렌더는 서버와 같게</H3>
        <CodeCompare
          before={{
            code: `
function Clock() {
  // 서버 렌더 시각과 hydrate 시각이 다르다
  return <p>지금 {new Date().toLocaleTimeString()}</p>;
}`,
            note: '서버는 10:00:01, 브라우저는 10:00:03으로 렌더 → 텍스트 불일치 → 클라이언트에서 다시 그림.',
          }}
          after={{
            code: `
function Clock() {
  const [now, setNow] = useState(null); // 서버와 첫 렌더: null

  useEffect(() => {
    setNow(new Date()); // hydration이 끝난 뒤 브라우저에서만 실행
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return <p>지금 {now ? now.toLocaleTimeString() : '--:--:--'}</p>;
}`,
            note: 'useEffect는 서버에서 실행되지 않고, 브라우저에서도 hydration 뒤에 실행된다. 그래서 첫 렌더 결과가 양쪽에서 같다.',
          }}
        />

        <H3>2. 브라우저 전용 값으로 분기하지 않기</H3>
        <CodeCompare
          before={{
            code: `
function Greeting() {
  // 서버: window 없음 → '로그인'
  // 브라우저: '홍길동님'
  const name =
    typeof window !== 'undefined' ? localStorage.getItem('name') : null;

  return <p>{name ? name + '님' : '로그인'}</p>;
}`,
            note: '렌더 중에 typeof window로 분기하면 서버와 브라우저가 다른 쪽을 그린다.',
          }}
          after={{
            code: `
function Greeting() {
  const [name, setName] = useState(null);

  useEffect(() => {
    setName(localStorage.getItem('name'));
  }, []);

  return <p>{name ? name + '님' : '로그인'}</p>;
}

// 서버에서 아예 그릴 수 없는 컴포넌트라면 (Next.js)
const Map = dynamic(() => import('./Map'), { ssr: false });`,
            note: '로그인 정보처럼 서버도 알 수 있는 값이라면 쿠키로 서버에서 읽어 처음부터 같은 값을 렌더하는 것이 가장 좋다.',
          }}
        />

        <H3>3. id는 useId로</H3>
        <CodeCompare
          before={{
            code: `
function EmailField() {
  const id = 'email-' + Math.random().toString(36).slice(2);
  return (
    <>
      <label htmlFor={id}>이메일</label>
      <input id={id} />
    </>
  );
}`,
            note: '서버와 브라우저가 서로 다른 id를 만든다. 속성 불일치는 DOM이 고쳐진다는 보장도 없다.',
          }}
          after={{
            code: `
function EmailField() {
  const id = useId(); // 컴포넌트 트리 위치로 만들어서 양쪽이 같다
  return (
    <>
      <label htmlFor={id}>이메일</label>
      <input id={id} />
    </>
  );
}`,
            note: '전역 카운터(id++)도 안 된다. 클라이언트가 hydrate하는 순서가 서버가 HTML을 만든 순서와 다를 수 있기 때문.',
          }}
        />

        <H3>4. HTML 중첩 규칙 지키기</H3>
        <CodeCompare
          before={{
            code: `
function Notice() {
  return (
    <p>
      공지사항
      <div className="badge">NEW</div>
    </p>
  );
}`,
            note: '<p> 안에는 블록 요소가 올 수 없다. 브라우저가 <p></p><div>NEW</div><p></p>로 바꿔버린다.',
          }}
          after={{
            code: `
function Notice() {
  return (
    <p>
      공지사항
      <span className="badge">NEW</span>
    </p>
  );
}`,
            note: '인라인 요소(span)로 바꾸거나 바깥을 <div>로 바꾼다. <a> 안의 <a>, <button> 안의 <button>, <table> 바로 아래 <tr>도 같은 문제.',
          }}
        />

        <Callout title="suppressHydrationWarning은 비상구">
          <CodeBlock
            code={`
// 정말 같게 만들 수 없는 텍스트 한 곳에만
<time suppressHydrationWarning>{new Date().toLocaleString()}</time>

// next-themes처럼 <html>의 class를 스크립트가 먼저 바꾸는 경우
<html lang="ko" suppressHydrationWarning>`}
          />
          <p>그 요소 <b>한 단계만</b> 경고를 끄고, 다른 텍스트를 <b>고쳐주지도 않습니다</b>. 자식 요소의 불일치는 그대로 에러가 납니다.</p>
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <HydrationLab />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const FLOW = [
  { who: '서버', title: '컴포넌트 실행 → HTML 문자열', body: 'renderToString / 스트리밍으로 HTML을 만들어 보낸다.' },
  { who: '브라우저', title: 'HTML 파싱 → 화면 표시', body: '내용은 보이지만 이벤트 핸들러가 없어 아직 클릭해도 반응이 없다.' },
  { who: '브라우저', title: 'JS 다운로드 → hydrateRoot', body: '같은 컴포넌트를 브라우저에서 다시 실행한다.' },
  { who: '브라우저', title: '기존 DOM과 한 노드씩 비교', body: '태그, 텍스트, 순서를 확인한다.' },
];

const TREE = {
  ok: [
    ['<div>', '<div>'],
    ['<h1>상품 목록</h1>', '<h1>상품 목록</h1>'],
    ['<p>재고 3개</p>', '<p>재고 3개</p>'],
    ['<button>담기</button>', '<button>담기</button>'],
  ],
  bad: [
    ['<div>', '<div>'],
    ['<h1>상품 목록</h1>', '<h1>상품 목록</h1>'],
    ['<p>10:00:01 기준</p>', '<p>10:00:03 기준</p>'],
    ['<button>담기</button>', '<button>담기</button>'],
  ],
};

function FlowViz() {
  const [kind, setKind] = useState('ok');
  const [step, setStep] = useState(0);
  const last = FLOW.length;
  const rows = TREE[kind];
  const badRow = rows.findIndex(([s, c]) => s !== c);
  const change = (k) => { setKind(k); setStep(0); };

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={kind}
          onChange={change}
          options={[{ value: 'ok', label: '서버와 브라우저 결과가 같을 때' }, { value: 'bad', label: '렌더 중에 시각을 읽었을 때' }]}
        />
        <button className={ui.btn} onClick={() => setStep(0)} disabled={step === 0}>처음부터</button>
        <button className={ui.btnPrimary} onClick={() => setStep((s) => Math.min(s + 1, last))} disabled={step === last}>다음 단계</button>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-5">
        {[...FLOW, { who: '결과', title: kind === 'ok' ? 'DOM 재사용 + 이벤트 연결' : '에러 → 클라이언트에서 다시 그림', body: kind === 'ok' ? '서버 HTML을 그대로 쓰고 클릭이 가능해진다.' : '서버 HTML을 버리고 새로 그린다. 화면이 깜빡이고 렌더 비용이 두 배.' }].map((f, i) => {
          const active = i <= step;
          const result = i === last;
          const tone = result && active ? (kind === 'ok' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-rose-400 bg-rose-50 dark:bg-rose-500/10') : active ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'border-zinc-200 opacity-40 dark:border-zinc-800';
          return (
            <li key={i} className={`rounded-xl border p-3 text-sm transition ${tone}`}>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{i + 1}. {f.who}</p>
              <p className="mt-1 font-semibold">{f.title}</p>
              <p className={`mt-1 text-xs ${ui.muted}`}>{f.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid gap-2 font-mono text-xs">
        <div className="grid grid-cols-[1fr_1fr_5rem] gap-2 px-3 font-sans font-semibold text-zinc-500 dark:text-zinc-400">
          <span>서버 HTML (이미 화면에 있음)</span><span>브라우저에서 다시 렌더한 결과</span><span>비교</span>
        </div>
        {rows.map(([s, c], i) => {
          const checked = step >= 3 && (kind === 'ok' || i <= badRow);
          const same = s === c;
          return (
            <div key={i} className="grid grid-cols-[1fr_1fr_5rem] items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
              <span>{s}</span>
              <span className={step >= 2 ? '' : 'opacity-30'}>{step >= 2 ? c : '(아직 실행 전)'}</span>
              <span>
                {checked ? (
                  same ? <b className={ui.good}>같음</b> : <b className={ui.bad}>다름</b>
                ) : <span className="text-zinc-400">-</span>}
              </span>
            </div>
          );
        })}
      </div>
      {kind === 'bad' && step >= 3 && (
        <p className={`mt-3 text-sm ${ui.bad}`}>세 번째 노드에서 텍스트가 달라 비교가 멈춘다. React는 이 트리를 서버 HTML 대신 클라이언트 렌더 결과로 바꾼다.</p>
      )}
    </Viz>
  );
}

/* ---------- 직접 해보기: 브라우저 안에서 실제 SSR → hydrate ---------- */

// 데모에서는 renderToString이 도는 동안만 "서버"로 취급한다 (브라우저라서 진짜 window가 있기 때문)
let SERVER_PASS = false;
const isServer = () => SERVER_PASS;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function useClientValue(get, fallback) {
  const [v, setV] = useState(fallback);
  useEffect(() => setV(get()), []); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

const SCENARIOS = {
  time: {
    label: '현재 시각',
    desc: '렌더 중에 new Date()로 시각을 읽는다. 서버 렌더와 hydrate 사이에 1.2초를 기다린다 (HTML·JS 다운로드 시간).',
    fixLabel: '해결: useEffect에서 시각 넣기',
    App: ({ fix }) => {
      const later = useClientValue(() => new Date().toLocaleTimeString('ko-KR'), '--:--:--');
      const now = fix ? later : new Date().toLocaleTimeString('ko-KR');
      return <p>마지막 업데이트 <b>{now}</b></p>;
    },
  },
  random: {
    label: 'Math.random',
    desc: '렌더 중에 Math.random()으로 6개 중 오늘의 추천 상품을 고른다. 가끔 우연히 같은 값이 나오면 에러가 안 난다 — 그래서 "가끔만 나는 버그"가 되기 쉽다. 여러 번 실행해 보세요.',
    fixLabel: '해결: 서버에서 고른 값을 props로 받기',
    App: ({ fix, seed }) => {
      const items = ['키보드', '마우스', '모니터', '스피커', '웹캠', '헤드셋'];
      const pick = fix ? seed : Math.floor(Math.random() * items.length);
      return <p>오늘의 추천 <b>{items[pick]}</b></p>;
    },
  },
  window: {
    label: 'typeof window',
    desc: '렌더 중에 typeof window !== "undefined"일 때만 localStorage의 이름을 읽는다. (데모는 서버 렌더 동안 window가 없는 것처럼 흉내)',
    fixLabel: '해결: useEffect에서 localStorage 읽기',
    App: ({ fix }) => {
      const later = useClientValue(() => '홍길동', null);
      const name = fix ? later : isServer() ? null : '홍길동';
      return <p>{name ? <b>{name}님, 반가워요</b> : <b>로그인</b>}</p>;
    },
  },
  locale: {
    label: '시간대',
    desc: '같은 날짜를 Intl.DateTimeFormat으로 표시한다. 서버는 UTC, 브라우저는 사용자 시간대(한국이면 KST).',
    fixLabel: '해결: 시간대를 명시하기',
    App: ({ fix }) => {
      const date = new Date('2026-11-08T23:30:00Z');
      const timeZone = fix ? 'Asia/Seoul' : isServer() ? 'UTC' : undefined;
      const text = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
      return <p>이벤트 시작 <b>{text}</b></p>;
    },
  },
  nesting: {
    label: '<p> 안의 <div>',
    desc: '서버와 브라우저 렌더 결과는 같다. 하지만 브라우저 HTML 파서가 <p> 안의 <div>를 밖으로 빼버린다.',
    fixLabel: '해결: <div>를 <span>으로',
    App: ({ fix }) => (
      <p>
        공지사항 {fix ? <span className="badge">NEW</span> : <div className="badge">NEW</div>}
      </p>
    ),
  },
  extension: {
    label: '확장 프로그램',
    desc: 'HTML이 들어온 뒤 React가 실행되기 전에, 확장 프로그램이 요소를 하나 끼워 넣는다. (서버·클라이언트 코드에는 문제가 없다)',
    fixLabel: '확장 프로그램이 속성만 바꿀 때',
    App: () => (
      <ul>
        <li>장바구니 <b>3개</b></li>
      </ul>
    ),
    tamper: (el, fix) => {
      const li = el.querySelector('li');
      if (!li) return;
      if (fix) li.setAttribute('data-ext-translated', 'true');
      else li.insertAdjacentHTML('beforebegin', '<li data-ext="">확장 프로그램이 넣은 항목</li>');
    },
  },
};

function Done({ onDone }) {
  useEffect(() => { onDone(); }, [onDone]);
  return null;
}

function HydrationLab() {
  const [key, setKey] = useState('time');
  const [fix, setFix] = useState(false);
  const [running, setRunning] = useState(false);
  const [res, setRes] = useState(null);
  const stage = useRef(null);
  const root = useRef(null);
  const sc = SCENARIOS[key];

  useEffect(() => () => root.current?.unmount(), []);

  const run = async () => {
    setRunning(true);
    setRes(null);
    root.current?.unmount();
    root.current = null;
    const el = stage.current;
    el.innerHTML = '';
    const seed = 2;
    const App = sc.App;

    // 1. 서버 렌더 (HTML 문자열)
    SERVER_PASS = true;
    let html;
    try {
      html = renderToString(<App fix={fix} seed={seed} />);
    } finally {
      SERVER_PASS = false;
    }

    // 2. 브라우저가 HTML을 받아 파싱
    el.innerHTML = html;
    sc.tamper?.(el, fix);
    const parsed = el.innerHTML;
    const firstNode = el.firstChild;

    await wait(key === 'time' ? 1200 : 300);

    // 3. hydrate
    const errors = [];
    const warnings = [];
    const origError = console.error;
    console.error = (...args) => {
      const msg = args.map(String).join(' ');
      if (/hydrat|did not match|didn't match|cannot be a descendant|cannot contain a nested/i.test(msg)) warnings.push(msg);
      origError(...args);
    };
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    try {
      root.current = hydrateRoot(el, <><App fix={fix} seed={seed} /><Done onDone={resolve} /></>, {
        onRecoverableError: (error) => errors.push(error?.message ?? String(error)),
      });
      await Promise.race([done, wait(1500)]);
      await wait(80);
    } finally {
      console.error = origError;
    }

    setRes({
      html,
      parsed,
      final: el.innerHTML,
      reused: el.firstChild === firstNode,
      errors,
      warnings,
    });
    setRunning(false);
  };

  const ok = res && res.errors.length === 0;

  return (
    <Demo hint="이 페이지 안에서 진짜로 react-dom/server의 renderToString으로 HTML을 만들고, 그 HTML 위에 hydrateRoot를 실행합니다. 원인을 고른 뒤 실행해 보고, 해결 방법을 켜서 다시 실행해 보세요.">
      <div className="space-y-3">
        <Segmented
          value={key}
          onChange={(k) => { setKey(k); setRes(null); }}
          options={Object.entries(SCENARIOS).map(([value, s]) => ({ value, label: s.label }))}
        />
        <p className={`text-sm ${ui.muted}`}>{sc.desc}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={fix} onChange={(v) => { setFix(v); setRes(null); }} label={sc.fixLabel} />
          <button className={ui.btnPrimary} onClick={run} disabled={running}>
            {running ? '실행 중...' : '서버 렌더 → hydrate 실행'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className={ui.box}>
          <p className="mb-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">실제 화면 (hydrate 대상 컨테이너)</p>
          <div ref={stage} className="min-h-12 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/60 [&_.badge]:ml-1 [&_.badge]:inline-block [&_.badge]:rounded [&_.badge]:bg-rose-500 [&_.badge]:px-1.5 [&_.badge]:text-xs [&_.badge]:font-bold [&_.badge]:text-white [&_[data-ext]]:text-amber-600 [&_ul]:list-disc [&_ul]:pl-5" />
        </div>
        <div className="grid grid-cols-3 gap-2 self-start text-center">
          <Stat label="hydration 에러" value={res ? res.errors.length : '-'} tone={res ? (ok ? 'good' : 'bad') : undefined} />
          <Stat label="서버 DOM 재사용" value={res ? (res.reused ? '예' : '아니오') : '-'} tone={res ? (res.reused ? 'good' : 'bad') : undefined} />
          <Stat label="개발 모드 경고" value={res ? res.warnings.length : '-'} tone={res && res.warnings.length ? 'warn' : undefined} />
        </div>
      </div>

      {res && (
        <div className="mt-4 space-y-3">
          <p className={`text-sm font-semibold ${ok ? ui.good : ui.bad}`}>
            {ok
              ? res.warnings.length
                ? '에러 없이 hydration이 끝났지만 개발 모드 경고가 있습니다. 속성 차이는 고쳐진다는 보장이 없습니다.'
                : '서버 HTML을 그대로 재사용하고 이벤트만 연결했습니다.'
              : '불일치가 나서 React가 서버 HTML을 버리고 클라이언트에서 다시 그렸습니다.'}
          </p>
          <HtmlRow label="1. 서버가 보낸 HTML (renderToString)" html={res.html} />
          <HtmlRow label="2. 브라우저가 파싱한 DOM (hydrate 직전)" html={res.parsed} diff={res.parsed !== res.html} />
          <HtmlRow label="3. hydrate가 끝난 뒤 DOM" html={res.final} diff={res.final !== res.parsed} />
          {res.errors.map((e, i) => (
            <pre key={i} className="overflow-x-auto rounded-lg bg-rose-50 p-3 font-mono text-xs whitespace-pre-wrap text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              onRecoverableError: {e.slice(0, 400)}
            </pre>
          ))}
          {res.warnings.slice(0, 2).map((w, i) => (
            <pre key={i} className="overflow-x-auto rounded-lg bg-amber-50 p-3 font-mono text-xs whitespace-pre-wrap text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              console.error: {w.slice(0, 400)}
            </pre>
          ))}
        </div>
      )}
      <IdCheck />
    </Demo>
  );
}

function HtmlRow({ label, html, diff }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
        {label}
        {diff && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">바로 위 단계와 다름</span>}
      </p>
      <pre className="overflow-x-auto rounded-lg bg-[#1e1f24] p-3 font-mono text-xs whitespace-pre-wrap text-zinc-200 dark:bg-zinc-900">{html || '(비어 있음)'}</pre>
    </div>
  );
}

function IdCheck() {
  const id = useId();
  return (
    <p className={`mt-4 text-xs ${ui.muted}`}>
      참고: 이 데모 컴포넌트의 <Code>useId()</Code> 값은 <Code>{id}</Code>입니다. 트리 위치로 만들기 때문에 서버에서 렌더해도 같은 값이 나옵니다.
    </p>
  );
}
