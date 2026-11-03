import { Suspense, use, useEffect, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, CodeCompare,
  Demo, Viz, Segmented, ui,
} from '../components/kit.jsx';

export default function SuspensePage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Suspense는 자식 컴포넌트가 아직 렌더할 준비가 안 됐을 때(코드나 데이터를 기다리는 중) 대신 <u>fallback UI를 보여주는 경계</u>입니다.
          로딩 상태를 각 컴포넌트가 직접 관리하지 않고, 선언적으로 "이 영역이 준비될 때까지 이걸 보여줘"라고 작성할 수 있습니다.
        </OneLiner>

        <H3>동작 원리</H3>
        <List
          items={[
            <>자식이 렌더 중에 "아직 준비 안 됐다"고 알리면(= <b>suspend</b>, 내부적으로 Promise를 던짐) React는 그 렌더를 멈춘다.</>,
            <>트리를 위로 올라가며 <b>가장 가까운 <Code>&lt;Suspense&gt;</Code></b>를 찾아 그 영역 전체를 <Code>fallback</Code>으로 바꿔 보여준다.</>,
            <>Promise가 끝나면 React가 자식을 <b>다시 렌더</b>해서 실제 UI로 교체한다.</>,
            <>suspend를 일으키는 것들: <Code>React.lazy</Code> 컴포넌트, React 19의 <Code>use(promise)</Code>, TanStack Query의 <Code>useSuspenseQuery</Code>, Next.js 서버 컴포넌트의 async 데이터 등. <b>useEffect 안에서 fetch하는 건 Suspense가 감지하지 못한다.</b></>,
          ]}
        />

        <H3>경계(boundary)를 어디에 두느냐가 핵심</H3>
        <List
          items={[
            <><b>하나로 크게 감싸면</b>: 안의 모든 것이 준비될 때까지 fallback 하나만 보인다 → 화면이 한꺼번에 "짠" 하고 나타남</>,
            <><b>영역별로 나눠 감싸면</b>: 준비된 영역부터 먼저 보여준다 → 느린 API 하나가 전체를 붙잡지 않음</>,
            <>Suspense는 <b>중첩</b>할 수 있고, 에러는 처리하지 않으므로 <b>ErrorBoundary와 함께</b> 쓰는 게 일반적이다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>React.lazy</b>로 코드 스플리팅할 때 — 반드시 필요 (없으면 에러)</>,
            <>Suspense를 지원하는 데이터 라이브러리(TanStack Query, SWR, Relay)나 Next.js App Router로 <b>데이터 로딩 상태를 선언적으로</b> 관리하고 싶을 때</>,
            <>여러 컴포넌트의 로딩을 <b>하나의 스켈레톤으로 묶고</b> 싶을 때 (깜빡이는 스피너 여러 개 방지)</>,
            <>SSR 스트리밍 — 준비된 HTML부터 먼저 보내기 (Next.js의 loading.tsx가 바로 Suspense)</>,
          ]}
          avoid={[
            'useEffect + useState로 직접 fetch하는 컴포넌트 — Suspense가 알아채지 못한다',
            '이미 보이는 화면을 업데이트할 때 fallback으로 갈아엎는 것 — 이럴 땐 useTransition으로 기존 화면 유지 (Concurrent 페이지 참고)',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>Suspense 안의 컴포넌트가 데이터를 기다릴 때 일어나는 일을 단계별로 봅니다.</p>
        <FlowViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'Suspense 없이 (useEffect + isLoading)',
            code: `
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <Spinner />;
  return <h1>{user.name}</h1>;
}
// Posts, Comments... 컴포넌트마다 똑같은 로딩 코드 반복`,
            note: '컴포넌트마다 로딩 state와 분기가 섞여 있고, 스피너가 여기저기 따로 깜빡인다.',
          }}
          after={{
            label: 'Suspense 사용',
            code: `
function Profile({ userId }) {
  // 데이터가 올 때까지 suspend → 바깥 Suspense가 fallback 표시
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  return <h1>{user.name}</h1>; // 여기선 항상 데이터가 있다
}

function Page() {
  return (
    <ErrorBoundary fallback={<ErrorView />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile userId={1} />
      </Suspense>
    </ErrorBoundary>
  );
}`,
            note: '컴포넌트는 "데이터가 있다"고 가정하고 UI만 그린다. 로딩/에러는 바깥 경계가 담당.',
          }}
        />
        <Callout title="React 19에서는 use()로 직접 Promise를 읽을 수 있어요">
          <p><Code>const user = use(userPromise);</Code> — 아래 데모가 이 방식으로 만들어져 있습니다. 단, Promise는 렌더 중에 새로 만들지 말고 바깥(이벤트 핸들러, 라이브러리 캐시)에서 만들어 넘겨야 합니다.</p>
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <SuspenseDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const STEPS = [
  { title: '렌더 시작', desc: 'React가 <Profile />을 렌더하기 시작한다.', profile: 'rendering', boundary: 'idle' },
  { title: 'suspend!', desc: 'Profile이 use(promise)를 호출했는데 데이터가 아직 없다 → 렌더를 멈추고 "기다려 줘"라고 알린다.', profile: 'suspended', boundary: 'idle' },
  { title: 'fallback 표시', desc: '가장 가까운 Suspense가 받아서, 그 영역에 fallback(스켈레톤)을 보여준다.', profile: 'suspended', boundary: 'fallback' },
  { title: '데이터 도착', desc: 'Promise가 resolve 되면 React가 Profile을 다시 렌더한다.', profile: 'rendering', boundary: 'fallback' },
  { title: '실제 UI 표시', desc: '이번엔 데이터가 있으니 렌더가 끝까지 진행되고 fallback이 실제 UI로 교체된다.', profile: 'done', boundary: 'done' },
];

function FlowViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const s = STEPS[step];

  useEffect(() => {
    if (!playing) return;
    if (step === STEPS.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setStep((n) => n + 1), 1400);
    return () => clearTimeout(id);
  }, [playing, step]);

  const profileStyle = {
    rendering: 'border-amber-400 bg-amber-50 dark:bg-amber-500/10',
    suspended: 'border-rose-400 bg-rose-50 dark:bg-rose-500/10',
    done: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  }[s.profile];

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-2">
        <button className={ui.btnPrimary} onClick={() => { setStep(0); setPlaying(true); }}>자동 재생</button>
        <button className={ui.btn} disabled={step === 0} onClick={() => { setPlaying(false); setStep((n) => n - 1); }}>← 이전</button>
        <button className={ui.btn} disabled={step === STEPS.length - 1} onClick={() => { setPlaying(false); setStep((n) => n + 1); }}>다음 →</button>
        <span className="ml-auto text-sm text-zinc-400">{step + 1} / {STEPS.length}</span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border-2 border-dashed border-indigo-400 p-4">
          <div className="font-mono text-xs text-indigo-600 dark:text-indigo-300">&lt;Suspense fallback={'{<Skeleton />}'}&gt;</div>
          <div className={`mt-3 rounded-lg border-2 px-4 py-3 text-center transition ${profileStyle}`}>
            <div className="font-mono text-sm font-semibold">&lt;Profile /&gt;</div>
            <div className="mt-1 text-xs">
              {s.profile === 'rendering' && '렌더 중…'}
              {s.profile === 'suspended' && 'suspend (Promise 대기)'}
              {s.profile === 'done' && '렌더 완료'}
            </div>
          </div>
          <div className="mt-3 font-mono text-xs text-indigo-600 dark:text-indigo-300">&lt;/Suspense&gt;</div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-xs text-zinc-400">사용자가 보는 화면</div>
          <div className="mt-3 h-24">
            {s.boundary === 'idle' && <div className="grid h-full place-items-center text-sm text-zinc-400">(아직 아무것도 커밋되지 않음)</div>}
            {s.boundary === 'fallback' && (
              <div className="flex h-full animate-pulse items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" /><div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" /></div>
              </div>
            )}
            {s.boundary === 'done' && (
              <div className="flex h-full items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-500 text-xl font-bold text-white">김</div>
                <div><div className="font-semibold">김리액트</div><div className="text-sm text-zinc-400">Frontend Developer</div></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/60">
        <b>{step + 1}. {s.title}</b> — {s.desc}
      </div>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const fakeFetch = (data, ms) => new Promise((resolve) => setTimeout(() => resolve(data), ms));
const USER = { name: '김리액트', role: 'Frontend Developer' };
const POSTS = ['React.memo 정리', 'Suspense 경계 설계하기', '가상 스크롤 직접 구현', 'useTransition 써보기'];

function SuspenseDemo() {
  const [mode, setMode] = useState('separate');
  const [run, setRun] = useState(null);

  const start = () =>
    setRun({
      id: Date.now(),
      startedAt: performance.now(),
      user: fakeFetch(USER, 1000),
      posts: fakeFetch(POSTS, 2500),
    });

  return (
    <Demo hint="프로필 API는 1초, 게시글 API는 2.5초 걸립니다. 경계 배치를 바꿔가며 '불러오기'를 눌러 화면이 나타나는 순서를 비교하세요.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={mode}
          onChange={(v) => { setMode(v); setRun(null); }}
          options={[
            { value: 'single', label: 'Suspense 하나로 감싸기' },
            { value: 'separate', label: '영역별 Suspense' },
            { value: 'effect', label: 'Suspense 없이 (useEffect)' },
          ]}
        />
        <button className={ui.btnPrimary} onClick={start}>불러오기</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {!run && <div className={`col-span-full grid h-40 place-items-center text-sm ${ui.muted}`}>'불러오기'를 눌러주세요</div>}
        {run && mode === 'single' && (
          <Suspense key={run.id} fallback={<div className="col-span-full"><CardSkeleton label="전체 fallback (둘 다 준비될 때까지)" tall /></div>}>
            <ProfileCard promise={run.user} startedAt={run.startedAt} />
            <PostsCard promise={run.posts} startedAt={run.startedAt} />
          </Suspense>
        )}
        {run && mode === 'separate' && (
          <>
            <Suspense key={`u${run.id}`} fallback={<CardSkeleton label="프로필 fallback" />}>
              <ProfileCard promise={run.user} startedAt={run.startedAt} />
            </Suspense>
            <Suspense key={`p${run.id}`} fallback={<CardSkeleton label="게시글 fallback" />}>
              <PostsCard promise={run.posts} startedAt={run.startedAt} />
            </Suspense>
          </>
        )}
        {run && mode === 'effect' && (
          <>
            <EffectCard key={`u${run.id}`} promise={run.user} startedAt={run.startedAt} render={(u) => <ProfileBody user={u} />} title="프로필" />
            <EffectCard key={`p${run.id}`} promise={run.posts} startedAt={run.startedAt} render={(p) => <PostsBody posts={p} />} title="게시글" />
          </>
        )}
      </div>
    </Demo>
  );
}

function Shown({ startedAt }) {
  const [ms] = useState(() => Math.round(performance.now() - startedAt));
  return <span className={`text-xs font-bold ${ui.good}`}>{(ms / 1000).toFixed(1)}초에 표시됨</span>;
}

function CardShell({ title, startedAt, children }) {
  return (
    <div className={`${ui.box} min-h-40`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <Shown startedAt={startedAt} />
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ProfileBody({ user }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-500 text-lg font-bold text-white">김</div>
      <div><div className="font-semibold">{user.name}</div><div className="text-sm text-zinc-400">{user.role}</div></div>
    </div>
  );
}

function PostsBody({ posts }) {
  return <ul className="list-disc space-y-1 pl-5 text-sm">{posts.map((p) => <li key={p}>{p}</li>)}</ul>;
}

function ProfileCard({ promise, startedAt }) {
  const user = use(promise); // 준비 안 됐으면 여기서 suspend
  return <CardShell title="프로필" startedAt={startedAt}><ProfileBody user={user} /></CardShell>;
}

function PostsCard({ promise, startedAt }) {
  const posts = use(promise);
  return <CardShell title="게시글" startedAt={startedAt}><PostsBody posts={posts} /></CardShell>;
}

// Suspense 없이: 각 컴포넌트가 직접 로딩 state를 관리
function EffectCard({ promise, startedAt, render, title }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    promise.then((d) => alive && setData(d));
    return () => { alive = false; };
  }, [promise]);

  if (!data) {
    return (
      <div className={`${ui.box} grid min-h-40 place-items-center`}>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500" />
          {title} isLoading…
        </div>
      </div>
    );
  }
  return <CardShell title={title} startedAt={startedAt}>{render(data)}</CardShell>;
}

function CardSkeleton({ label, tall }) {
  return (
    <div className={`animate-pulse rounded-xl border border-dashed border-indigo-300 p-4 dark:border-indigo-500/40 ${tall ? 'min-h-40' : 'min-h-40'}`}>
      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">{label}</div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-3/5 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
