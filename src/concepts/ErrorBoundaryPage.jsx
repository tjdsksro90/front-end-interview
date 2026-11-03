import { Component, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, ui,
} from '../components/kit.jsx';

export default function ErrorBoundaryPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Error Boundary는 <u>자식 컴포넌트를 렌더링하다 에러가 나면 그걸 잡아서, 앱 전체 대신 그 영역만 대체 UI(fallback)로 바꿔주는 컴포넌트</u>입니다.
          React는 렌더 중 에러가 잡히지 않으면 트리 전체를 지워버리기 때문에(하얀 화면), 경계를 둬서 피해 범위를 줄입니다.
        </OneLiner>

        <H3>잡는 것 / 못 잡는 것</H3>
        <Table
          head={['상황', '잡히나?', '대신 어떻게']}
          rows={[
            ['자식의 렌더링 중 에러 (undefined.map 등)', '잡힘', '-'],
            ['자식의 생명주기·useEffect 안 에러', '잡힘', '-'],
            ['이벤트 핸들러 (onClick 안의 에러)', <b className={ui.bad}>못 잡음</b>, 'try/catch, 또는 state에 에러를 넣고 렌더 중에 throw (react-error-boundary의 showBoundary)'],
            ['비동기 코드 (setTimeout, Promise, fetch)', <b className={ui.bad}>못 잡음</b>, '위와 같음. React Query는 throwOnError: true로 경계에 전달'],
            ['서버 렌더링(SSR) 중 에러', '못 잡음', '서버 쪽 처리 (Next.js error.tsx는 클라이언트 경계)'],
            ['Error Boundary 자기 자신의 에러', '못 잡음', '더 바깥 경계가 잡음'],
          ]}
        />

        <H3>알아둘 것</H3>
        <List
          items={[
            <>아직 <b>클래스 컴포넌트로만</b> 만들 수 있다: <Code>static getDerivedStateFromError</Code>(fallback 보여줄 state 변경) + <Code>componentDidCatch</Code>(로그 전송). 실무에선 <Code>react-error-boundary</Code> 라이브러리를 많이 쓴다.</>,
            <><b>배치 단위</b>: 앱 전체 하나만 두면 위젯 하나의 에러로 전체가 에러 화면이 된다. 라우트·위젯 단위로 나눠 둔다.</>,
            <><b>복구</b>: fallback에 "다시 시도" 버튼(<Code>resetErrorBoundary</Code>), 또는 <Code>resetKeys</Code>(예: 페이지 id가 바뀌면 자동 초기화).</>,
            <><b>Suspense와 짝</b>: Suspense는 로딩, Error Boundary는 에러를 담당한다. 보통 <Code>{'<ErrorBoundary><Suspense>…'}</Code>로 같이 감싼다. Next.js App Router에선 <Code>error.tsx</Code>가 자동으로 경계가 된다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>앱 최상단</b>: 최소한 "문제가 발생했어요 + 새로고침" 화면과 에러 로그 전송(Sentry)</>,
            <><b>독립적인 위젯·라우트마다</b>: 추천 상품 영역이 깨져도 결제 버튼은 살아 있게</>,
            '외부 데이터 형식이 불안정한 영역 (서드파티 위젯, 사용자가 만든 콘텐츠 렌더러)',
            'React Query/Suspense로 데이터를 받는 영역 — 로딩은 Suspense, 실패는 Error Boundary',
          ]}
          avoid={[
            '폼 검증 에러, 404 같은 "예상된" 실패 — 일반 상태로 화면에 보여주면 된다',
            '이벤트 핸들러 에러를 경계가 잡아줄 거라 기대 — 못 잡는다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>Error Boundary를 어디에 두느냐에 따라, 위젯 하나에서 난 에러가 화면에 얼마나 번지는지 비교합니다.</p>
        <PlacementViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '경계 없음',
            code: `
function App() {
  return (
    <>
      <Header />
      <Recommendations />   {/* 여기서 data.items.map 에러 */}
      <CheckoutButton />
    </>
  );
}
// → React가 트리 전체를 언마운트 → 하얀 화면
// → 결제 버튼까지 사라짐`,
            note: '추천 영역 하나 때문에 페이지 전체가 사라진다. 사용자는 새로고침 외에 할 수 있는 게 없다.',
          }}
          after={{
            label: 'Error Boundary',
            code: `
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };                       // 다음 렌더에서 fallback
  }
  componentDidCatch(error, info) {
    Sentry.captureException(error, { extra: info });  // 로그 전송
  }
  render() {
    if (this.state.error) return this.props.fallback(() => this.setState({ error: null }));
    return this.props.children;
  }
}

<ErrorBoundary fallback={(retry) => <p>추천을 못 불러왔어요 <button onClick={retry}>다시</button></p>}>
  <Recommendations />
</ErrorBoundary>

// react-error-boundary 라이브러리
<ErrorBoundary FallbackComponent={Fallback} resetKeys={[productId]} onError={log}>`,
            note: '추천 영역만 대체 UI로 바뀌고 헤더와 결제 버튼은 그대로 동작한다.',
          }}
        />
        <Callout title="이벤트·비동기 에러를 경계로 보내기">
          <CodeBlock
            code={`
// react-error-boundary
const { showBoundary } = useErrorBoundary();
const onClick = async () => {
  try { await save(); } catch (e) { showBoundary(e); }  // 가장 가까운 경계로 전달
};

// 직접 구현: state에 넣고 렌더 중에 throw
const [error, setError] = useState(null);
if (error) throw error;`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <BoundaryDemo />
      </Section>
    </>
  );
}

/* ---------- 실제 Error Boundary ---------- */

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    this.props.onCatch?.(error);
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }));
    }
    return this.props.children;
  }
}

/* ---------- 시각화 ---------- */

function PlacementViz() {
  const [placement, setPlacement] = useState('none');
  const [broken, setBroken] = useState(false);
  const widgets = ['Header', 'Recommendations', 'CheckoutButton'];
  const state = (w) => {
    if (!broken) return 'ok';
    if (placement === 'none') return 'gone';
    if (placement === 'root') return 'root';
    return w === 'Recommendations' ? 'fallback' : 'ok';
  };
  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={placement} onChange={(v) => { setPlacement(v); setBroken(false); }} options={[{ value: 'none', label: '경계 없음' }, { value: 'root', label: '앱 최상단에 하나' }, { value: 'widget', label: '위젯마다' }]} />
        <button className={ui.btnPrimary} onClick={() => setBroken(true)} disabled={broken}>Recommendations에서 에러 발생</button>
        <button className={ui.btn} onClick={() => setBroken(false)}>초기화</button>
      </div>
      <div className="mt-4 min-h-40 rounded-xl border-2 border-zinc-300 p-3 dark:border-zinc-700">
        {broken && placement === 'none' && <div className="grid h-36 place-items-center text-sm text-zinc-400">(하얀 화면 — 전부 언마운트됨)</div>}
        {broken && placement === 'root' && <div className="grid h-36 place-items-center rounded-lg bg-rose-50 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">문제가 발생했어요. 새로고침 해주세요. (앱 전체가 fallback)</div>}
        {(!broken || placement === 'widget') && (
          <div className="space-y-2">
            {widgets.map((w) => (
              <div key={w} className={`rounded-lg p-3 text-sm ${state(w) === 'fallback' ? 'border-2 border-dashed border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-zinc-50 dark:bg-zinc-800/60'} ${placement === 'widget' ? 'ring-1 ring-indigo-300 dark:ring-indigo-500/40' : ''}`}>
                {state(w) === 'fallback' ? `${w}: 불러오지 못했어요 [다시 시도]` : `${w} 정상`}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>
        → {placement === 'none' ? '경계가 없으면 에러 하나로 앱 전체가 사라집니다.' : placement === 'root' ? '최상단 경계만 있으면 하얀 화면은 막지만, 결제 버튼까지 함께 사라집니다.' : '위젯마다 경계가 있으면 에러 난 영역만 바뀌고 나머지는 계속 쓸 수 있습니다.'}
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

function BoundaryDemo() {
  const [caught, setCaught] = useState([]);
  const onCatch = (e) => setCaught((c) => [`componentDidCatch: ${e.message}`, ...c].slice(0, 4));
  const fallback = (error, reset) => (
    <div className="rounded-lg border-2 border-dashed border-rose-400 bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
      <div className="font-semibold">이 영역만 fallback으로 바뀜</div>
      <div className="mt-1 font-mono text-xs">{error.message}</div>
      <button className={`${ui.btn} mt-2`} onClick={reset}>다시 시도 (reset)</button>
    </div>
  );

  return (
    <Demo hint="각 위젯은 자기 Error Boundary로 감싸져 있습니다. 렌더 에러는 잡히지만, 이벤트 핸들러 에러는 경계를 그냥 통과하는 것을 확인해 보세요. (개발 모드에선 잡힌 에러도 콘솔에 빨간 로그가 찍히는 게 정상입니다)">
      <div className="grid gap-3 md:grid-cols-3">
        <ErrorBoundary fallback={fallback} onCatch={onCatch}><RenderBug /></ErrorBoundary>
        <ErrorBoundary fallback={fallback} onCatch={onCatch}><HandlerBug /></ErrorBoundary>
        <ErrorBoundary fallback={fallback} onCatch={onCatch}><ShowBoundaryBug /></ErrorBoundary>
      </div>
      <pre className="mt-3 min-h-16 rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">{caught.length ? caught.join('\n') : '경계가 잡은 에러 로그 (Sentry로 보낼 자리)'}</pre>
    </Demo>
  );
}

function Widget({ title, desc, children }) {
  return (
    <div className={ui.box}>
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{desc}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RenderBug() {
  const [items, setItems] = useState(['상품 A', '상품 B']);
  return (
    <Widget title="1. 렌더 중 에러" desc="응답이 null로 와서 items.map이 터지는 상황">
      <ul className="mb-2 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul>
      <button className={ui.btnPrimary} onClick={() => setItems(null)}>잘못된 응답 받기</button>
    </Widget>
  );
}

function HandlerBug() {
  const [msg, setMsg] = useState('');
  const onClick = () => {
    try {
      null.price.toFixed();
    } catch (e) {
      setMsg(`경계는 못 잡음 → try/catch로 직접 처리: ${e.message}`);
    }
  };
  return (
    <Widget title="2. 이벤트 핸들러 에러" desc="onClick 안의 에러는 렌더 중이 아니라서 경계가 못 잡는다">
      <button className={ui.btnPrimary} onClick={onClick}>버튼 클릭 에러</button>
      {msg && <p className={`mt-2 text-xs ${ui.warn}`}>{msg}</p>}
    </Widget>
  );
}

function ShowBoundaryBug() {
  const [error, setError] = useState(null);
  if (error) throw error; // state에 넣은 에러를 렌더 중에 던져서 경계로 보냄
  const onClick = async () => {
    try {
      await new Promise((_, reject) => setTimeout(() => reject(new Error('결제 API 500 에러')), 400));
    } catch (e) {
      setError(e);
    }
  };
  return (
    <Widget title="3. 비동기 에러를 경계로" desc="catch한 에러를 state에 넣고 렌더 중에 throw (showBoundary 원리)">
      <button className={ui.btnPrimary} onClick={onClick}>API 실패시키기</button>
    </Widget>
  );
}
