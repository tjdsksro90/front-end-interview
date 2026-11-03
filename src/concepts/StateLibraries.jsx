import { createContext, memo, useContext, useMemo, useState } from 'react';
import { create } from 'zustand';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, RenderBadge, useRenderCount, ui,
} from '../components/kit.jsx';

export default function StateLibraries() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          상태관리 라이브러리의 핵심 차이는 <u>상태가 바뀌었을 때 누가 다시 렌더되느냐</u>입니다.
          Context는 값이 바뀌면 그 Context를 쓰는 컴포넌트가 전부 다시 렌더되고, Redux·Zustand는 selector로 고른 값이 바뀐 컴포넌트만, Recoil·Jotai는 구독한 atom이 바뀐 컴포넌트만 다시 렌더됩니다.
        </OneLiner>

        <Table
          head={['', 'Context API', 'Redux Toolkit', 'Zustand', 'Recoil / Jotai']}
          rows={[
            ['모델', 'Provider가 값을 내려줌', '하나의 store + action/reducer', '하나(또는 여러)의 store + 함수', '작은 atom 여러 개'],
            ['리렌더 범위', '값이 바뀌면 사용하는 모든 컴포넌트', 'useSelector로 고른 값이 바뀐 컴포넌트만', 'selector로 고른 값이 바뀐 컴포넌트만', '구독한 atom이 바뀐 컴포넌트만'],
            ['코드 양', '적음 (내장)', '많음 (slice, store, Provider)', '가장 적음', '적음'],
            ['DevTools·미들웨어', '-', 'Redux DevTools, 시간여행 디버깅', 'devtools, persist, immer 미들웨어', '제한적'],
            ['현재', '내장', '대규모 앱의 표준', '가장 많이 쓰이는 추세', 'Recoil은 2025년 저장소 보관(개발 중단) → Jotai로 이동'],
          ]}
        />

        <H3>알아둘 것</H3>
        <List
          items={[
            <><b>Context는 상태관리 도구라기보다 "값 전달 도구"</b>다. 자주 안 바뀌는 값(테마, 로그인 유저, 언어)에 적합하고, 자주 바뀌는 값을 넣으면 리렌더가 많아진다. 쪼개거나(Context 여러 개) value를 useMemo로 감싸서 줄인다.</>,
            <><b>서버 데이터는 따로</b>: API로 받은 데이터를 Redux/Zustand에 넣어 직접 관리하던 방식은 줄었고, React Query·SWR·RTK Query 같은 서버 상태 도구에 맡긴다. 전역 스토어에는 순수 클라이언트 상태만 남긴다. (<Link className="text-indigo-600 dark:text-indigo-400" to="/react/tanstack-query/deep/react-query-swr">React Query & SWR 심화</Link>)</>,
            <><b>selector는 작게</b>: <Code>{'useStore((s) => s)'}</Code>처럼 전체를 고르면 Context와 같아진다. <Code>{'useStore((s) => s.cart.length)'}</Code>처럼 필요한 값만.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>Context</b>: 테마, 로그인 정보, 언어처럼 드물게 바뀌고 넓게 쓰이는 값 / 컴포넌트 라이브러리 내부</>,
            <><b>Zustand</b>: 중소~대규모 앱의 클라이언트 전역 상태 (장바구니, 모달, 필터) — 보일러플레이트 최소</>,
            <><b>Redux Toolkit</b>: 큰 팀, 엄격한 데이터 흐름 규칙·DevTools 추적이 중요한 앱, 이미 Redux를 쓰는 프로젝트</>,
            <><b>Jotai</b>: 서로 독립적인 작은 상태가 많고, 상태끼리 파생 관계가 복잡할 때</>,
          ]}
          avoid={[
            '한 컴포넌트에서만 쓰는 상태를 전역으로 — useState로 충분',
            'props 1~2단계 전달이 귀찮아서 전역 상태 — 컴포넌트 합성(children)으로 해결되는 경우가 많다',
            '서버 데이터를 전역 스토어에 복사해서 직접 동기화',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>전역 상태 <Code>{'{ user, cart, theme }'}</Code>에서 <b>cart만 바뀌었을 때</b> 어떤 컴포넌트가 다시 렌더되는지 비교합니다.</p>
        <SubscribeViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'Context API',
            code: `
const StoreContext = createContext(null);

function StoreProvider({ children }) {
  const [state, setState] = useState({ user, cart: [], theme: 'light' });
  return (
    <StoreContext.Provider value={{ state, setState }}>
      {children}
    </StoreContext.Provider>
  );
}

function CartBadge() {
  const { state } = useContext(StoreContext);
  return <span>{state.cart.length}</span>;
}
function ThemeButton() {
  const { state } = useContext(StoreContext);  // cart가 바뀌어도 렌더됨
  return <button>{state.theme}</button>;
}`,
            note: 'value 객체가 바뀌면 useContext를 쓴 모든 컴포넌트가 다시 렌더된다. 어떤 필드를 쓰는지는 상관없다.',
          }}
          after={{
            label: 'Zustand',
            code: `
import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  cart: [],
  theme: 'light',
  addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
}));

function CartBadge() {
  const count = useStore((s) => s.cart.length);   // 이 값이 바뀔 때만 렌더
  return <span>{count}</span>;
}
function ThemeButton() {
  const theme = useStore((s) => s.theme);          // cart가 바뀌어도 렌더 안 됨
  return <button>{theme}</button>;
}`,
            note: 'Provider도 필요 없고, selector로 고른 값이 바뀐 컴포넌트만 렌더된다.',
          }}
        />
        <Callout title="Redux Toolkit / Jotai로 쓰면">
          <CodeBlock
            code={`
// Redux Toolkit
const cartSlice = createSlice({
  name: 'cart',
  initialState: [],
  reducers: { add: (state, action) => { state.push(action.payload); } },  // immer로 직접 수정 문법
});
const store = configureStore({ reducer: { cart: cartSlice.reducer } });
// <Provider store={store}> 로 감싸고
const count = useSelector((s) => s.cart.length);
const dispatch = useDispatch();
dispatch(cartSlice.actions.add(item));

// Jotai (Recoil과 비슷한 atom 방식)
const cartAtom = atom([]);
const cartCountAtom = atom((get) => get(cartAtom).length);  // 파생 atom
const count = useAtomValue(cartCountAtom);`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <StoreDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const SUBSCRIBERS = [
  { name: 'Header', uses: 'user' },
  { name: 'CartBadge', uses: 'cart' },
  { name: 'ThemeButton', uses: 'theme' },
  { name: 'CartList', uses: 'cart' },
];

function SubscribeViz() {
  const [lib, setLib] = useState('context');
  const [tick, setTick] = useState(0);
  const rendered = (uses) => tick > 0 && (lib === 'context' || uses === 'cart');

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={lib} onChange={(v) => { setLib(v); setTick(0); }} options={[{ value: 'context', label: 'Context' }, { value: 'zustand', label: 'Zustand / Redux (selector)' }]} />
        <button className={ui.btnPrimary} onClick={() => setTick((t) => t + 1)}>cart에 상품 추가</button>
      </div>
      <div className="mt-5 flex min-w-[480px] flex-col items-center gap-5">
        <div className="rounded-xl border-2 border-indigo-400 px-4 py-2 text-center font-mono text-xs">
          {lib === 'context' ? '<StoreContext.Provider value={{ user, cart, theme }}>' : 'useStore = create(...)  { user, cart, theme }'}
          {tick > 0 && <div className="mt-1 font-sans font-bold text-indigo-600 dark:text-indigo-300">cart 변경 #{tick}</div>}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {SUBSCRIBERS.map((c) => (
            <div key={`${c.name}${tick}${lib}`} className={`min-w-[120px] rounded-xl border-2 px-3 py-2 text-center transition ${rendered(c.uses) ? 'animate-flash border-amber-400 bg-amber-50 dark:bg-amber-500/10' : tick ? 'border-dashed border-emerald-500' : 'border-zinc-200 dark:border-zinc-700'}`}>
              <div className="text-sm font-semibold">{c.name}</div>
              <div className="font-mono text-[11px] text-zinc-400">{lib === 'context' ? `useContext → .${c.uses}` : `useStore(s => s.${c.uses})`}</div>
              {tick > 0 && <div className={`text-[11px] font-bold ${rendered(c.uses) ? ui.warn : ui.good}`}>{rendered(c.uses) ? '렌더' : '건너뜀'}</div>}
            </div>
          ))}
        </div>
      </div>
      <Legend items={[['bg-amber-300', '다시 렌더됨'], ['border-2 border-dashed border-emerald-500', '렌더 안 됨']]} />
      {tick > 0 && (
        <p className={`mt-3 text-sm ${ui.muted}`}>
          → {lib === 'context' ? 'cart만 바뀌었는데 Header, ThemeButton까지 4개 모두 렌더됐다. Context는 "어떤 필드를 쓰는지" 모른다.' : 'cart를 고른 CartBadge, CartList만 렌더됐다. 나머지는 고른 값이 그대로라 건너뛴다.'}
        </p>
      )}
    </Viz>
  );
}

/* ---------- 데모: 실제 Context vs 실제 Zustand ---------- */

function StoreDemo() {
  const [lib, setLib] = useState('context');
  return (
    <Demo hint="같은 화면을 Context와 Zustand로 각각 만들었습니다. '장바구니 담기'를 눌러 각 컴포넌트의 렌더 횟수를 비교하세요. (자식들은 모두 memo로 감싸서 부모 때문에 렌더되는 경우는 뺐습니다)">
      <Segmented value={lib} onChange={setLib} options={[{ value: 'context', label: 'Context API' }, { value: 'zustand', label: 'Zustand' }]} />
      <div className="mt-4">{lib === 'context' ? <ContextApp /> : <ZustandApp />}</div>
    </Demo>
  );
}

function Panel({ name, value, children }) {
  const renders = useRenderCount();
  return (
    <div className={`${ui.box} flex items-center justify-between gap-2`}>
      <div>
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{value}</div>
      </div>
      <div className="flex items-center gap-2">{children}<RenderBadge count={renders} /></div>
    </div>
  );
}

// --- Context 버전 ---
const StoreContext = createContext(null);

function ContextApp() {
  const [state, setState] = useState({ user: '김리액트', cart: [], theme: 'light' });
  const value = useMemo(() => ({
    state,
    addToCart: () => setState((s) => ({ ...s, cart: [...s.cart, `상품${s.cart.length + 1}`] })),
    toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' })),
  }), [state]);
  return (
    <StoreContext.Provider value={value}>
      <Grid header={<CtxHeader />} badge={<CtxCartBadge />} theme={<CtxTheme />} add={<CtxAdd />} />
    </StoreContext.Provider>
  );
}
const CtxHeader = memo(function CtxHeader() {
  const { state } = useContext(StoreContext);
  return <Panel name="Header" value={`user: ${state.user}`} />;
});
const CtxCartBadge = memo(function CtxCartBadge() {
  const { state } = useContext(StoreContext);
  return <Panel name="CartBadge" value={`cart: ${state.cart.length}개`} />;
});
const CtxTheme = memo(function CtxTheme() {
  const { state, toggleTheme } = useContext(StoreContext);
  return <Panel name="ThemeButton" value={`theme: ${state.theme}`}><button className={ui.btn} onClick={toggleTheme}>테마</button></Panel>;
});
const CtxAdd = memo(function CtxAdd() {
  const { addToCart } = useContext(StoreContext);
  return <Panel name="AddButton" value="addToCart만 사용"><button className={ui.btnPrimary} onClick={addToCart}>장바구니 담기</button></Panel>;
});

// --- Zustand 버전 ---
const useDemoStore = create((set) => ({
  user: '김리액트',
  cart: [],
  theme: 'light',
  addToCart: () => set((s) => ({ cart: [...s.cart, `상품${s.cart.length + 1}`] })),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
}));

function ZustandApp() {
  return <Grid header={<ZHeader />} badge={<ZCartBadge />} theme={<ZTheme />} add={<ZAdd />} />;
}
const ZHeader = memo(function ZHeader() {
  const user = useDemoStore((s) => s.user);
  return <Panel name="Header" value={`user: ${user}`} />;
});
const ZCartBadge = memo(function ZCartBadge() {
  const count = useDemoStore((s) => s.cart.length);
  return <Panel name="CartBadge" value={`cart: ${count}개`} />;
});
const ZTheme = memo(function ZTheme() {
  const theme = useDemoStore((s) => s.theme);
  const toggleTheme = useDemoStore((s) => s.toggleTheme);
  return <Panel name="ThemeButton" value={`theme: ${theme}`}><button className={ui.btn} onClick={toggleTheme}>테마</button></Panel>;
});
const ZAdd = memo(function ZAdd() {
  const addToCart = useDemoStore((s) => s.addToCart); // 함수는 안 바뀌므로 렌더 안 됨
  return <Panel name="AddButton" value="addToCart만 사용"><button className={ui.btnPrimary} onClick={addToCart}>장바구니 담기</button></Panel>;
});

function Grid({ header, badge, theme, add }) {
  return <div className="grid gap-2 sm:grid-cols-2">{header}{badge}{theme}{add}</div>;
}
