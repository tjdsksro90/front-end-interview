import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, Toggle, ui,
} from '../components/kit.jsx';

export default function ReactQuerySwr() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React Query와 SWR은 서버에서 받은 데이터를 <u>키(queryKey) 단위로 캐시하고, 캐시가 오래되면(stale) 일단 캐시를 보여준 뒤 뒤에서 새로 받아와 바꿔치기</u>하는 라이브러리입니다.
          이 "오래된 걸 먼저 보여주고 다시 검증한다"는 전략이 Stale-While-Revalidate입니다.
        </OneLiner>

        <H3>먼저: 서버 상태 vs 클라이언트 상태</H3>
        <List
          items={[
            <><b>클라이언트 상태</b>: 모달 열림, 입력값, 다크모드 — 내 브라우저에만 있고 내가 주인. (useState, Zustand)</>,
            <><b>서버 상태</b>: 유저 정보, 상품 목록 — 진짜 주인은 서버고, 나는 <b>복사본</b>을 갖고 있을 뿐이라 언제든 낡을 수 있다.</>,
            <>서버 상태엔 캐싱, 중복 요청 제거, 다시 받아오기, 로딩/에러 관리가 필요하다 → 이걸 useEffect + useState로 다 짜면 코드가 커지고 버그가 생긴다. React Query/SWR이 이걸 대신한다.</>,
          ]}
        />

        <H3>핵심 용어</H3>
        <Table
          head={['용어', '뜻']}
          rows={[
            [<Code>queryKey</Code>, <>캐시의 이름표. <Code>['user', 1]</Code>과 <Code>['user', 2]</Code>는 서로 다른 캐시. 키가 바뀌면 자동으로 새로 요청</>],
            ['fresh / stale', '받은 지 얼마 안 돼 믿을 만한 상태(fresh) / 다시 확인이 필요한 상태(stale)'],
            [<Code>staleTime</Code>, <>fresh로 취급하는 시간. <b>기본값 0</b> → 받자마자 stale. 그동안은 다시 요청하지 않는다</>],
            [<Code>gcTime</Code>, '아무 컴포넌트도 안 쓰는 캐시를 메모리에 남겨두는 시간 (기본 5분, v4까진 cacheTime)'],
            ['자동 refetch', 'stale일 때 ① 컴포넌트 마운트 ② 창에 다시 포커스 ③ 네트워크 재연결 시 뒤에서 다시 받아온다'],
            ['invalidate', <>데이터를 바꾼 뒤(mutation) <Code>invalidateQueries</Code>로 "이 캐시 낡았어" 표시 → 다시 받아오게</>],
            ['중복 제거', '같은 키를 여러 컴포넌트가 동시에 요청해도 네트워크 요청은 한 번'],
          ]}
        />

        <H3>Stale-While-Revalidate란?</H3>
        <List
          items={[
            <>원래는 HTTP 캐시 헤더 <Code>Cache-Control: max-age=60, stale-while-revalidate=300</Code>에서 온 개념. "60초 동안은 그냥 쓰고, 그 뒤 300초 동안은 낡은 걸 일단 주면서 뒤에서 새로 받아라".</>,
            <>사용자는 <b>로딩 스피너 없이 바로</b> 화면을 보고(캐시), 잠시 뒤 최신 데이터로 조용히 바뀐다. 체감 속도가 빨라진다.</>,
            <>SWR이라는 라이브러리 이름 자체가 이 전략의 약자다.</>,
          ]}
        />

        <Table
          head={['', 'React Query (TanStack)', 'SWR', 'RTK Query']}
          rows={[
            ['만든 곳', 'TanStack', 'Vercel', 'Redux 팀'],
            ['특징', '기능 많음: mutation, 무한 스크롤, devtools, 세밀한 캐시 제어', '가볍고 API 단순', 'Redux Toolkit에 포함, API를 한곳에 선언'],
            ['기본 staleTime', '0 (받자마자 stale)', '항상 revalidate (dedupingInterval 2초)', 'keepUnusedDataFor 60초'],
            ['언제', '대부분의 React 앱', 'Next.js, 단순 조회 위주', '이미 Redux를 쓰는 프로젝트'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>서버 데이터를 여러 화면에서 같이 쓸 때</b>: 유저 정보, 장바구니 개수 — 한 번 받으면 캐시 공유</>,
            <><b>목록 ↔ 상세를 왔다 갔다</b> 하는 화면: 돌아왔을 때 스피너 없이 바로 보여주기</>,
            '데이터가 자주 바뀌어 최신 상태를 유지해야 할 때: 포커스 시 자동 갱신, 주기적 polling',
            '수정 후 관련 목록을 갱신해야 할 때 (mutation + invalidate), 낙관적 업데이트',
          ]}
          avoid={[
            '클라이언트 상태 (모달, 폼 입력, 테마) — useState나 Zustand가 맞다',
            '한 번 받고 끝인 데이터가 한두 개뿐인 아주 작은 앱',
            'Next.js 서버 컴포넌트에서 받는 데이터 — 서버에서 fetch 캐시를 쓰고, 클라이언트 상호작용이 필요할 때만 함께 쓴다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>staleTime이 10초일 때, 같은 데이터를 쓰는 화면에 여러 번 들어오면 캐시와 화면이 어떻게 바뀌는지 단계별로 봅니다.</p>
        <SwrViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'useEffect로 직접',
            code: `
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;               // 경쟁 상태 방지
    setIsLoading(true);
    fetchUser(userId)
      .then((u) => !ignore && setUser(u))
      .catch((e) => !ignore && setError(e))
      .finally(() => !ignore && setIsLoading(false));
    return () => { ignore = true; };
  }, [userId]);
  // 캐시 없음: 다시 들어올 때마다 스피너
  // 다른 컴포넌트도 user가 필요하면 또 요청
}`,
            note: '로딩/에러/경쟁 상태를 매번 직접 관리하고, 캐시·중복 제거·자동 갱신은 없다.',
          }}
          after={{
            label: 'React Query',
            code: `
function Profile({ userId }) {
  const { data: user, isLoading, error, isFetching } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 10_000,              // 10초간은 다시 안 받음
  });
}

// 수정 후 관련 캐시 갱신
const queryClient = useQueryClient();
const { mutate } = useMutation({
  mutationFn: updateUser,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
});

// SWR이라면
const { data, isLoading, isValidating } = useSWR(['user', userId], fetchUser);`,
            note: '같은 키는 캐시를 공유하고, 다시 들어오면 캐시를 바로 보여준 뒤 뒤에서 갱신한다.',
          }}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <QueryDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const SWR_STEPS = [
  { t: '0초', title: '첫 방문', cache: 'empty', screen: 'loading', fetch: true, desc: '캐시가 비어 있으니 스피너를 보여주고 요청한다.' },
  { t: '1초', title: '응답 도착', cache: 'fresh', screen: 'v1', fetch: false, desc: '데이터 v1을 캐시에 저장하고 화면에 보여준다. 지금부터 10초간 fresh.' },
  { t: '5초', title: '다른 화면 갔다가 복귀', cache: 'fresh', screen: 'v1', fetch: false, desc: 'fresh라서 요청 없이 캐시를 그대로 보여준다. (네트워크 0회)' },
  { t: '15초', title: '다시 복귀 (stale)', cache: 'stale', screen: 'v1', fetch: true, desc: '10초가 지나 stale. 캐시 v1을 즉시 보여주면서(스피너 없음) 뒤에서 다시 요청한다. ← Stale-While-Revalidate' },
  { t: '16초', title: '새 응답 도착', cache: 'fresh', screen: 'v2', fetch: false, desc: '서버에서 바뀐 v2가 오면 조용히 교체. 사용자는 기다린 적이 없다.' },
];

function SwrViz() {
  const [i, setI] = useState(0);
  const s = SWR_STEPS[i];
  const cacheStyle = {
    empty: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800',
    fresh: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    stale: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  }[s.cache];

  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        {SWR_STEPS.map((st, n) => (
          <button key={n} className={n === i ? ui.btnPrimary : ui.btn} onClick={() => setI(n)}>{st.t} · {st.title}</button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl p-4 ring-1 ring-zinc-200 dark:ring-zinc-700">
          <div className="text-xs text-zinc-400">화면</div>
          <div className="mt-2 grid h-16 place-items-center rounded-lg bg-zinc-50 text-sm font-semibold dark:bg-zinc-800/60">
            {s.screen === 'loading' ? <span className="flex items-center gap-2 text-zinc-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-500" />로딩 중</span> : `유저 데이터 ${s.screen}`}
          </div>
        </div>
        <div className="rounded-xl p-4 ring-1 ring-zinc-200 dark:ring-zinc-700">
          <div className="text-xs text-zinc-400">캐시 ['user', 1]</div>
          <div className={`mt-2 grid h-16 place-items-center rounded-lg text-sm font-bold ${cacheStyle}`}>
            {s.cache === 'empty' ? '비어 있음' : `${s.screen} · ${s.cache}`}
          </div>
        </div>
        <div className="rounded-xl p-4 ring-1 ring-zinc-200 dark:ring-zinc-700">
          <div className="text-xs text-zinc-400">네트워크</div>
          <div className={`mt-2 grid h-16 place-items-center rounded-lg text-sm font-semibold ${s.fetch ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : 'bg-zinc-50 text-zinc-400 dark:bg-zinc-800/60'}`}>
            {s.fetch ? 'GET /users/1 요청 중' : '요청 없음'}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/60"><b>{s.t} · {s.title}</b> — {s.desc}</div>
    </Viz>
  );
}

/* ---------- 데모: 실제 TanStack Query + 가짜 서버 ---------- */

// 가짜 서버. 요청마다 로그를 남기고, '서버 데이터 수정' 시 버전이 올라간다.
function createServer() {
  const db = { 1: { name: '김리액트', likes: 10, version: 1 }, 2: { name: '박타입', likes: 3, version: 1 } };
  let log = [];
  const listeners = new Set();
  const emit = () => listeners.forEach((l) => l());
  const t0 = performance.now();
  const stamp = () => `${((performance.now() - t0) / 1000).toFixed(1)}s`;
  return {
    subscribe: (l) => (listeners.add(l), () => listeners.delete(l)),
    getLog: () => log,
    async getUser(id) {
      log = [`${stamp()} GET /users/${id}`, ...log].slice(0, 8);
      emit();
      await new Promise((r) => setTimeout(r, 700));
      return { ...db[id] };
    },
    async like(id) {
      log = [`${stamp()} POST /users/${id}/like`, ...log].slice(0, 8);
      emit();
      await new Promise((r) => setTimeout(r, 400));
      db[id] = { ...db[id], likes: db[id].likes + 1, version: db[id].version + 1 };
    },
  };
}

function QueryDemo() {
  // 데모마다 독립된 QueryClient (창 포커스 시 refetch 기본 동작 그대로)
  const [client] = useState(() => new QueryClient());
  const [server] = useState(createServer);
  return (
    <QueryClientProvider client={client}>
      <ServerContext.Provider value={server}>
        <QueryPlayground />
      </ServerContext.Provider>
    </QueryClientProvider>
  );
}

const STALE_OPTIONS = [
  { value: 0, label: 'staleTime 0 (기본)' },
  { value: 10000, label: '10초' },
  { value: Infinity, label: '무한' },
];

function QueryPlayground() {
  const server = useServer();
  const [staleTime, setStaleTime] = useState(0);
  const [userId, setUserId] = useState(1);
  const [mounted, setMounted] = useState(true);
  const [twice, setTwice] = useState(false);
  const log = useSyncExternalStore(server.subscribe, server.getLog);
  const queryClient = useQueryClient();

  const like = useMutation({
    mutationFn: () => server.like(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
  });

  return (
    <Demo hint="실제 TanStack Query가 가짜 서버(응답 0.7초)에 요청합니다. 화면을 숨겼다 다시 보이기, 유저 바꾸기, 다른 탭 갔다가 돌아오기를 하면서 '서버 요청 로그'와 캐시 상태를 비교해 보세요.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={staleTime} onChange={(v) => { setStaleTime(v); queryClient.clear(); }} options={STALE_OPTIONS} />
        <Segmented value={userId} onChange={setUserId} options={[{ value: 1, label: "['user', 1]" }, { value: 2, label: "['user', 2]" }]} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className={ui.btn} onClick={() => setMounted((m) => !m)}>{mounted ? '화면 숨기기 (언마운트)' : '화면 다시 보이기 (마운트)'}</button>
        <button className={ui.btn} onClick={() => like.mutate()} disabled={like.isPending}>{like.isPending ? '저장 중…' : '좋아요 (서버 수정 + invalidate)'}</button>
        <Toggle checked={twice} onChange={setTwice} label={<span className="text-sm font-normal">같은 키를 쓰는 컴포넌트 2개</span>} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          {mounted ? (
            <>
              <UserCard userId={userId} staleTime={staleTime} label="ProfileCard" />
              {twice && <UserCard userId={userId} staleTime={staleTime} label="HeaderAvatar (같은 키)" />}
            </>
          ) : (
            <div className={`grid h-28 place-items-center rounded-xl border border-dashed border-zinc-300 text-sm dark:border-zinc-700 ${ui.muted}`}>컴포넌트가 없음 (캐시는 gcTime 동안 남아 있음)</div>
          )}
        </div>
        <div className="space-y-3">
          <CacheTable />
          <div>
            <div className="mb-1 text-xs font-semibold text-zinc-500">서버 요청 로그 (실제로 네트워크를 탄 것만)</div>
            <div className="min-h-20 space-y-0.5 rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
              {log.length ? log.map((l, i) => <div key={i}>{l}</div>) : <span className="text-zinc-400">아직 없음</span>}
            </div>
          </div>
        </div>
      </div>
    </Demo>
  );
}

function UserCard({ userId, staleTime, label }) {
  const server = useServer();
  const { data, isLoading, isFetching, isStale } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => server.getUser(userId),
    staleTime,
  });
  return (
    <div className={ui.box}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <span className="flex gap-1.5 text-[11px] font-bold">
          {isLoading && <Badge tone="sky">isLoading</Badge>}
          {isFetching && !isLoading && <Badge tone="sky">isFetching (뒤에서 갱신)</Badge>}
          {data && <Badge tone={isStale ? 'amber' : 'emerald'}>{isStale ? 'stale' : 'fresh'}</Badge>}
        </span>
      </div>
      <div className="mt-2 text-sm">
        {isLoading ? (
          <span className="text-zinc-400">로딩 스피너 (캐시 없음)</span>
        ) : (
          <span>{data.name} · 좋아요 {data.likes} · <span className="text-zinc-400">서버 v{data.version}</span></span>
        )}
      </div>
    </div>
  );
}

function Badge({ tone, children }) {
  const cls = {
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  }[tone];
  return <span className={`rounded px-1.5 py-0.5 ${cls}`}>{children}</span>;
}

// 가짜 서버 인스턴스를 데모 안의 컴포넌트들이 같이 쓴다
const ServerContext = createContext(null);
const useServer = () => useContext(ServerContext);

function CacheTable() {
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryCache();
  const [, force] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    const unsub = cache.subscribe(() => force((n) => n + 1));
    timer.current = setInterval(() => force((n) => n + 1), 1000); // stale 전환은 이벤트 없이 시간으로 바뀌므로 1초마다 다시 그림
    return () => { unsub(); clearInterval(timer.current); };
  }, [cache]);

  const queries = cache.getAll();
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-zinc-500">QueryCache 안의 내용</div>
      <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-700">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800"><tr><th className="px-3 py-1.5">queryKey</th><th className="px-3 py-1.5">상태</th><th className="px-3 py-1.5">받은 지</th><th className="px-3 py-1.5">구독</th></tr></thead>
          <tbody>
            {queries.length === 0 && <tr><td className="px-3 py-2 text-zinc-400" colSpan={4}>비어 있음</td></tr>}
            {queries.map((q) => (
              <tr key={q.queryHash} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-1.5">{q.queryHash}</td>
                <td className="px-3 py-1.5">{q.state.fetchStatus === 'fetching' ? 'fetching' : q.state.data ? (q.isStale() ? 'stale' : 'fresh') : '-'}</td>
                <td className="px-3 py-1.5">{q.state.dataUpdatedAt ? `${Math.round((Date.now() - q.state.dataUpdatedAt) / 1000)}초` : '-'}</td>
                <td className="px-3 py-1.5">{q.getObserversCount()}개</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
