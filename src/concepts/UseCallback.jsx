import { memo, useCallback, useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, CodeBlock, CodeCompare,
  Demo, Viz, Toggle, Segmented, RenderBadge, useRenderCount, ui,
} from '../components/kit.jsx';

export default function UseCallback() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          useCallback은 함수를 메모이제이션해서 <u>의존성이 바뀌지 않으면 같은 함수 참조</u>를 돌려주는 Hook입니다.
          주로 React.memo로 감싼 자식에게 콜백을 넘길 때, 매 렌더마다 새 함수가 만들어져 memo가 깨지는 걸 막으려고 씁니다.
        </OneLiner>

        <H3>왜 필요한가?</H3>
        <List
          items={[
            <>컴포넌트가 렌더될 때마다 안에서 선언한 함수는 <b>새로 만들어진다</b>. 하는 일은 같아도 메모리 주소(참조)가 다르다.</>,
            <>JS에서 <Code>(() =&gt; {'{}'}) === (() =&gt; {'{}'})</Code>는 <b>false</b>. 그래서 memo된 자식은 "props가 바뀌었다"고 보고 리렌더한다.</>,
            <><Code>useCallback(fn, [deps])</Code>는 deps가 같으면 <b>지난번 함수를 그대로</b> 돌려준다 → 참조가 같으니 memo가 제대로 동작.</>,
            <><Code>useCallback(fn, deps)</Code>는 <Code>useMemo(() =&gt; fn, deps)</Code>와 같다. "함수 전용 useMemo"라고 기억하면 된다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>memo로 감싼 자식</b>에게 이벤트 핸들러를 props로 넘길 때 (예: 긴 목록의 각 아이템에 onDelete 전달)</>,
            <>함수가 <b>useEffect의 의존성 배열</b>에 들어갈 때 — 안 쓰면 매 렌더마다 effect가 다시 실행된다 (무한 요청 버그의 단골 원인)</>,
            <>커스텀 Hook에서 함수를 반환할 때 — 쓰는 쪽이 의존성에 넣어도 안전하도록</>,
          ]}
          avoid={[
            <>자식이 <b>memo가 아닐 때</b> — 어차피 부모 따라 리렌더되므로 useCallback은 의미가 없다</>,
            '일반 DOM 요소(<button onClick>)에 넘길 때 — DOM은 리렌더 비용이 거의 없다',
            '의존성이 매 렌더마다 바뀌는 함수 — 결국 매번 새로 만들어진다',
          ]}
        />
        <Callout type="warn" title="⚠️ useCallback만으로는 아무 일도 일어나지 않는다">
          <p>useCallback은 "참조를 고정"할 뿐, 렌더를 막는 건 자식의 <b>React.memo</b>입니다. 둘은 세트로 써야 효과가 있어요. 이 점을 면접에서 짚으면 이해도가 드러납니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>부모가 렌더될 때마다 <Code>handleClick</Code>의 참조가 어떻게 되는지, 그리고 memo된 자식이 어떻게 판단하는지 봅니다. (실제 함수에 번호를 붙여 추적)</p>
        <IdentityViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            code: `
function TodoApp() {
  const [todos, setTodos] = useState(initial);
  const [text, setText] = useState('');

  // 렌더마다 새 함수 → 모든 TodoItem의 props가 "바뀜"
  const handleDelete = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} onDelete={handleDelete} />
      ))}
    </>
  );
}

const TodoItem = memo(function TodoItem({ todo, onDelete }) { ... });`,
            note: '입력창에 한 글자 칠 때마다 TodoItem 전부가 리렌더된다. memo를 붙였는데도!',
          }}
          after={{
            code: `
function TodoApp() {
  const [todos, setTodos] = useState(initial);
  const [text, setText] = useState('');

  // 의존성이 없으니 처음 만든 함수를 계속 재사용
  const handleDelete = useCallback((id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} onDelete={handleDelete} />
      ))}
    </>
  );
}

const TodoItem = memo(function TodoItem({ todo, onDelete }) { ... });`,
            note: 'handleDelete 참조가 고정되어 입력 중에는 TodoItem이 렌더되지 않는다. setTodos(prev => ...) 함수형 업데이트로 todos 의존성도 없앴다.',
          }}
        />

        <Callout title="또 다른 사용처: useEffect 의존성">
          <CodeBlock
            code={`
// ❌ fetchUser가 렌더마다 새로 생겨서 effect가 매번 실행 → 요청 폭주
const fetchUser = () => api.get(\`/users/\${id}\`);
useEffect(() => { fetchUser(); }, [fetchUser]);

// ✅ id가 바뀔 때만 함수가 바뀌고, effect도 그때만 실행
const fetchUser = useCallback(() => api.get(\`/users/\${id}\`), [id]);
useEffect(() => { fetchUser(); }, [fetchUser]);`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <CallbackDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

// 실제 함수 객체마다 번호를 붙인다 (같은 함수면 같은 번호)
const fnIds = new WeakMap();
let nextFnId = 1;
const fnId = (fn) => {
  if (!fnIds.has(fn)) fnIds.set(fn, nextFnId++);
  return fnIds.get(fn);
};

function IdentityViz() {
  const [useCb, setUseCb] = useState(false);
  return (
    <Viz>
      <div className="mb-4">
        <Toggle checked={useCb} onChange={setUseCb} label="useCallback으로 감싸기" />
      </div>
      <IdentityInner key={String(useCb)} useCb={useCb} />
    </Viz>
  );
}

function IdentityInner({ useCb }) {
  const [, setTick] = useState(0);
  const history = useRef([]);
  const prev = useRef(null);

  const plain = () => console.log('click');
  const cached = useCallback(() => console.log('click'), []);
  const handleClick = useCb ? cached : plain;

  // 렌더 중에 기록 (데모용)
  const same = prev.current !== null && prev.current === handleClick;
  const n = (history.current[0]?.n ?? 0) + 1;
  history.current = [{ n, id: fnId(handleClick), same, first: prev.current === null }, ...history.current].slice(0, 6);
  prev.current = handleClick;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button className={ui.btnPrimary} onClick={() => setTick((t) => t + 1)}>부모 리렌더</button>
        <code className="font-mono text-xs text-zinc-400">
          {useCb ? 'const handleClick = useCallback(() => {...}, [])' : 'const handleClick = () => {...}'}
        </code>
      </div>
      <div className="mt-4 space-y-2">
        {history.current.map((h) => (
          <div key={h.n} className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs dark:bg-zinc-800/60">
            <span className="text-zinc-400">렌더 #{h.n}</span>
            <span>handleClick = <b className="text-indigo-600 dark:text-indigo-300">함수#{h.id}</b></span>
            {h.first ? (
              <span className="text-zinc-400">(첫 렌더)</span>
            ) : h.same ? (
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">이전과 === 같음 → memo(Child) 건너뜀</span>
            ) : (
              <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">이전과 다름 → memo(Child) 리렌더</span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- 데모 ---------- */

const INITIAL = ['리액트 공부', '면접 준비', '운동하기', '장보기', '블로그 쓰기'].map((title, i) => ({ id: i + 1, title, done: false }));

function CallbackDemo() {
  const [mode, setMode] = useState('plain');
  return (
    <Demo hint="모든 TodoItem은 memo로 감싸져 있습니다. 입력창에 글자를 쳐보고 각 아이템의 렌더 횟수를 비교하세요.">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[{ value: 'plain', label: 'useCallback 없음' }, { value: 'cb', label: 'useCallback 사용' }]}
      />
      <div className="mt-4">{mode === 'plain' ? <TodoPlain /> : <TodoWithCallback />}</div>
    </Demo>
  );
}

function TodoPlain() {
  const [todos, setTodos] = useState(INITIAL);
  const [text, setText] = useState('');
  const handleToggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  return <TodoView {...{ todos, text, setText, handleToggle }} />;
}

function TodoWithCallback() {
  const [todos, setTodos] = useState(INITIAL);
  const [text, setText] = useState('');
  const handleToggle = useCallback(
    (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
    []
  );
  return <TodoView {...{ todos, text, setText, handleToggle }} />;
}

function TodoView({ todos, text, setText, handleToggle }) {
  return (
    <div className="space-y-3">
      <input className={`${ui.input} w-full`} placeholder="여기에 타이핑 (부모 state 변경)" value={text} onChange={(e) => setText(e.target.value)} />
      <ul className="space-y-1.5">
        {todos.map((t) => <TodoItem key={t.id} todo={t} onToggle={handleToggle} />)}
      </ul>
    </div>
  );
}

const TodoItem = memo(function TodoItem({ todo, onToggle }) {
  const renders = useRenderCount();
  return (
    <li className={`${ui.box} flex items-center justify-between gap-2 !py-2`}>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
        <span className={todo.done ? 'text-zinc-400 line-through' : ''}>{todo.title}</span>
      </label>
      <RenderBadge count={renders} />
    </li>
  );
});
