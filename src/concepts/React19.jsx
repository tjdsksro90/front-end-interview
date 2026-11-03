import { useActionState, useOptimistic, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, Toggle, ui,
} from '../components/kit.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

export default function React19() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React 19(2024년 12월)의 핵심은 <u>Actions</u>입니다. 폼 제출처럼 "비동기 요청 → 대기 → 결과/에러 → 낙관적 업데이트"를 하던 반복 코드를
          <u>useActionState, useOptimistic, useFormStatus</u>와 <Code>&lt;form action&gt;</Code>이 대신 관리해 줍니다. 그리고 <Code>use()</Code>, ref를 일반 prop으로 받기 같은 문법 정리가 들어왔습니다.
        </OneLiner>

        <H3>새로 생긴 것 한눈에 보기</H3>
        <Table
          head={['기능', '한 줄 설명']}
          rows={[
            ['Actions', <>transition 안에서 async 함수를 쓸 수 있게 됨. 대기 상태·에러·낙관적 업데이트·폼 초기화를 React가 처리한다.</>],
            [<Code>&lt;form action={'{fn}'}&gt;</Code>, <>onSubmit + preventDefault 대신 함수를 바로 넘긴다. 성공하면 비제어 폼 입력값이 자동으로 초기화된다.</>],
            [<Code>useActionState</Code>, '액션의 결과(state)와 대기 중 여부(isPending)를 한 번에 관리. 이전 결과를 다음 호출에 넘겨준다.'],
            [<Code>useFormStatus</Code>, '자식 컴포넌트(제출 버튼 등)에서 부모 form의 제출 중 여부를 props 없이 읽는다.'],
            [<Code>useOptimistic</Code>, '서버 응답 전에 화면을 먼저 바꿔 두고, 실패하면 자동으로 원래 값으로 돌아간다.'],
            [<Code>use(promise | context)</Code>, <>렌더 중에 Promise를 읽는다(Suspense와 함께). 조건문 안에서도 호출 가능한 유일한 Hook. (<Link className={linkCls} to="/react/in-react-optimization/deep/suspense">Suspense 심화</Link>)</>],
            ['ref를 prop으로', <><Code>forwardRef</Code> 없이 함수 컴포넌트가 <Code>ref</Code>를 일반 prop으로 받는다. ref 콜백이 정리(cleanup) 함수를 반환할 수 있다.</>],
            [<><Code>&lt;Context&gt;</Code>를 Provider로</>, <><Code>&lt;ThemeContext.Provider&gt;</Code> 대신 <Code>&lt;ThemeContext&gt;</Code>로 바로 쓴다.</>],
            ['문서 메타데이터', <>컴포넌트 안에 <Code>&lt;title&gt;</Code>, <Code>&lt;meta&gt;</Code>를 쓰면 &lt;head&gt;로 올려 준다. (react-helmet 없이)</>],
            ['Server Components / Server Actions', <>서버에서만 실행되는 컴포넌트와, 클라이언트에서 호출하는 서버 함수(<Code>'use server'</Code>)가 정식 기능이 됨. Next.js App Router가 이것을 쓴다.</>],
            ['삭제된 것', <><Code>ReactDOM.render</Code>, <Code>hydrate</Code>, 문자열 ref, 함수 컴포넌트의 <Code>propTypes</Code>·<Code>defaultProps</Code>, legacy context.</>],
          ]}
        />

        <H3>19.x 이후 추가된 것</H3>
        <Table
          head={['버전', '추가된 것']}
          rows={[
            ['19.1 (2025.03)', 'Owner Stack: 에러가 난 컴포넌트를 "누가 렌더했는지" 경로로 보여줘 디버깅이 쉬워짐'],
            ['19.2 (2025.10)', <><Code>&lt;Activity&gt;</Code>(화면에서 숨겨도 state 유지), <Code>useEffectEvent</Code>(effect 안에서 최신 값을 읽되 의존성에서 빠지는 함수), Chrome DevTools의 React Performance 트랙</>],
            ['Compiler 1.0 (2025.10)', <>자동 메모이제이션. (<Link className={linkCls} to="/react/use-memo-use-callback/deep/react-compiler">React Compiler 심화</Link>)</>],
            ['19.3 (2026.09)', <><Code>&lt;ViewTransition&gt;</Code>으로 화면 전환 애니메이션, Fragment에 ref 연결</>],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>useActionState + form action</b>: 로그인, 댓글 작성처럼 "제출 → 대기 → 성공/에러 메시지"가 있는 폼</>,
            <><b>useOptimistic</b>: 좋아요, 장바구니 담기, 채팅 전송처럼 성공할 확률이 높고 즉각 반응이 중요한 동작</>,
            <><b>useFormStatus</b>: 공통 SubmitButton 컴포넌트가 스스로 "전송 중…"을 표시하게 할 때</>,
            <><b>ref as prop</b>: 새로 만드는 Input·Button 공통 컴포넌트 — forwardRef가 더는 필요 없다</>,
          ]}
          avoid={[
            '검색창처럼 입력할 때마다 반응해야 하는 제어 컴포넌트 — form action은 "제출" 단위',
            '서버 데이터 캐싱·재요청이 필요한 조회 — 그건 여전히 TanStack Query 같은 도구의 영역',
            <>useOptimistic을 실패 확률이 높은 작업(결제)에 쓰기 — 되돌아가는 화면이 오히려 혼란</>,
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"React 18이 동시성 렌더링이라는 엔진을 바꿨다면, 19는 그 위에서 Actions로 비동기 상태 관리(대기·에러·낙관적 업데이트)를 기본 기능으로 만들었다. 그리고 Server Components가 정식이 되면서 Next.js App Router의 기반이 됐다"고 정리하면 됩니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>폼 하나를 제출할 때, 18 방식과 19 방식에서 개발자가 직접 관리해야 하는 것이 어떻게 달라지는지 보세요.</p>
        <ActionsViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>폼 제출 (Actions)</H3>
        <CodeCompare
          before={{
            label: 'React 18',
            code: `
function UpdateName() {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await updateName(name);
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={isPending}>저장</button>
      {error && <p>{error}</p>}
    </form>
  );
}`,
            note: 'pending, error, 입력값 초기화를 전부 state로 직접 관리한다.',
          }}
          after={{
            label: 'React 19',
            code: `
function UpdateName() {
  const [error, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const res = await updateName(formData.get('name'));
      if (res.error) return res.error;   // 반환값이 다음 state
      return null;
    },
    null
  );

  return (
    <form action={submitAction}>
      <input name="name" />
      <button disabled={isPending}>저장</button>
      {error && <p>{error}</p>}
    </form>
  );
}`,
            note: 'isPending은 React가 관리하고, 성공하면 폼 입력이 자동으로 초기화된다.',
          }}
        />

        <H3>낙관적 업데이트</H3>
        <CodeBlock
          code={`
function LikeButton({ likes, onLike }) {
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (cur, delta) => cur + delta);

  async function like() {
    addOptimistic(1);      // 화면은 바로 +1
    await onLike();        // 서버 요청. 실패하면 optimisticLikes가 자동으로 likes로 돌아간다
  }
  return <form action={like}><button>좋아요 {optimisticLikes}</button></form>;
}`}
        />

        <H3>ref를 prop으로</H3>
        <CodeCompare
          before={{
            label: 'React 18',
            code: `
const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});`,
            note: 'ref는 일반 prop이 아니라서 forwardRef로 감싸야 했다.',
          }}
          after={{
            label: 'React 19',
            code: `
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}`,
            note: 'ref도 그냥 prop. forwardRef는 앞으로 deprecated 예정.',
          }}
        />

        <H3>use()와 Context</H3>
        <CodeBlock
          code={`
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise);   // 준비될 때까지 가장 가까운 Suspense fallback
  return comments.map((c) => <p key={c.id}>{c.text}</p>);
}

function Heading({ show }) {
  if (!show) return null;
  const theme = use(ThemeContext);          // useContext와 달리 조건문 뒤에서도 호출 가능
  return <h1 style={{ color: theme.color }}>제목</h1>;
}

<ThemeContext value={dark}>               {/* .Provider 생략 */}
  <App />
</ThemeContext>`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>A. useActionState + useFormStatus</H3>
        <ActionStateDemo />
        <H3>B. useOptimistic</H3>
        <OptimisticDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const MANAGED = [
  ['대기 중 표시 (isPending)', 'useState + try/finally', 'useActionState가 제공'],
  ['에러 메시지', 'useState + catch', '액션의 반환값(state)'],
  ['입력값 상태', 'input마다 useState', 'FormData로 읽기 (비제어)'],
  ['성공 후 입력 초기화', 'setName("") 직접', 'form이 자동으로 reset'],
  ['버튼 비활성화 (자식에서)', 'props로 isPending 전달', 'useFormStatus로 직접 읽기'],
  ['낙관적 업데이트 + 실패 시 되돌리기', 'state 복사·복구 직접', 'useOptimistic이 자동 복구'],
];

function ActionsViz() {
  const [version, setVersion] = useState('18');
  return (
    <Viz>
      <Segmented value={version} onChange={setVersion} options={[{ value: '18', label: 'React 18' }, { value: '19', label: 'React 19' }]} />
      <div className="mt-5 min-w-[460px] space-y-2">
        {MANAGED.map(([what, v18, v19]) => (
          <div
            key={`${what}${version}`}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 ${
              version === '18' ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'border-dashed border-emerald-500'
            } animate-flash`}
          >
            <span className="flex-1 text-sm font-semibold">{what}</span>
            <span className={`text-sm ${version === '18' ? ui.warn : ui.good}`}>{version === '18' ? `개발자: ${v18}` : `React: ${v19}`}</span>
          </div>
        ))}
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>
        {version === '18'
          ? '→ 노란 칸은 전부 개발자가 state와 try/catch로 직접 짜야 하는 부분.'
          : '→ 같은 기능을 React가 Actions로 관리한다. 개발자는 "무엇을 요청하고 무엇을 반환할지"만 쓴다.'}
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function ActionStateDemo() {
  const [fail, setFail] = useState(false);
  const [state, submitAction, isPending] = useActionState(
    async (prev, formData) => {
      const name = String(formData.get('name') ?? '').trim();
      await wait(1200);
      if (fail) return { ...prev, error: '서버 에러: 저장에 실패했어요.' };
      if (!name) return { ...prev, error: '이름을 입력하세요.' };
      return { error: null, saved: [name, ...prev.saved].slice(0, 4) };
    },
    { error: null, saved: [] }
  );

  return (
    <Demo hint="이름을 입력하고 저장해 보세요. 버튼의 '저장 중…'은 useFormStatus가, 아래 isPending은 useActionState가 알려줍니다. 성공하면 입력칸이 자동으로 비워집니다.">
      <Toggle checked={fail} onChange={setFail} label="서버 실패 흉내" />
      <form action={submitAction} className="mt-4 flex flex-wrap items-center gap-2">
        <input name="name" className={ui.input} placeholder="이름" aria-label="이름" />
        <SubmitButton />
        <span className={`text-sm ${ui.muted}`}>isPending: <b className={isPending ? ui.warn : ''}>{String(isPending)}</b></span>
      </form>
      {state.error && <p className={`mt-3 text-sm ${ui.bad}`}>{state.error}</p>}
      <ul className="mt-3 space-y-1">
        {state.saved.map((n, i) => (
          <li key={`${n}${i}`} className="rounded-lg bg-zinc-50 px-3 py-1.5 text-sm dark:bg-zinc-800/60">저장됨: {n}</li>
        ))}
      </ul>
    </Demo>
  );
}

// 부모 form의 상태를 props 없이 읽는다
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className={ui.btnPrimary} disabled={pending}>
      {pending ? '저장 중…' : '저장'}
    </button>
  );
}

function OptimisticDemo() {
  const [likes, setLikes] = useState(10);
  const [fail, setFail] = useState(false);
  const [optimisticLikes, addOptimistic] = useOptimistic(likes, (cur, delta) => cur + delta);
  const [log, setLog] = useState([]);

  async function like() {
    addOptimistic(1);
    await wait(1500);
    if (fail) {
      setLog((l) => [`실패 → ${likes}로 자동 복구`, ...l].slice(0, 4));
      return;
    }
    setLikes((n) => n + 1);
    setLog((l) => ['서버 응답 성공 → 확정', ...l].slice(0, 4));
  }

  return (
    <Demo hint="좋아요를 누르면 숫자가 서버 응답(1.5초) 전에 바로 올라갑니다. '서버 실패 흉내'를 켜고 누르면 1.5초 뒤 원래 숫자로 돌아갑니다.">
      <Toggle checked={fail} onChange={setFail} label="서버 실패 흉내" />
      <form action={like} className="mt-4 flex flex-wrap items-center gap-3">
        <button className={ui.btnPrimary}>좋아요 {optimisticLikes}</button>
        <span className={`text-sm ${ui.muted}`}>
          서버에 저장된 값: <b>{likes}</b> {optimisticLikes !== likes && <b className={ui.warn}>(화면은 먼저 {optimisticLikes})</b>}
        </span>
      </form>
      <ul className={`mt-3 space-y-1 text-sm ${ui.muted}`}>
        {log.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </Demo>
  );
}
