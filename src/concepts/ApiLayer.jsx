import { useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function ApiLayer() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          API 레이어 설계는 <u>API 호출 코드를 컴포넌트에서 떼어내 층으로 나누는 것</u>입니다.
          공통 HTTP 클라이언트(Axios 인스턴스)가 인증·에러·재시도를 한곳에서 처리하고, API 함수가 엔드포인트를 타입과 함께 정의하고, 컴포넌트는 Custom Hook만 호출합니다.
        </OneLiner>

        <Table
          head={['층', '하는 일', '예']}
          rows={[
            ['HTTP 클라이언트', 'baseURL, timeout, 토큰 헤더, 401 처리(토큰 재발급), 에러 형식 통일, 재시도', <Code>shared/api/client.ts</Code>],
            ['API 함수', '엔드포인트 하나 = 함수 하나. 요청/응답 타입 정의', <Code>{'getProduct(id): Promise<Product>'}</Code>],
            ['Custom Hook', 'React Query 등과 연결: 캐시 키, 로딩/에러 상태', <Code>useProduct(id)</Code>],
            ['컴포넌트', '화면만. URL·헤더·토큰을 모름', <Code>{'const { data } = useProduct(id)'}</Code>],
          ]}
        />

        <H3>Retry Policy — 무엇을, 몇 번, 얼마 간격으로</H3>
        <List
          items={[
            <><b>재시도할 것</b>: 네트워크 끊김, 타임아웃, <b>5xx</b>(서버 일시 오류), <b>429</b>(요청 과다 — <Code>Retry-After</Code> 헤더만큼 기다림)</>,
            <><b>재시도하면 안 되는 것</b>: <b>4xx</b>(400 잘못된 요청, 401 인증, 403 권한, 404 없음) — 몇 번을 해도 같은 결과</>,
            <><b>멱등성</b>: GET·PUT·DELETE는 여러 번 보내도 결과가 같아 재시도해도 안전. <b>POST(결제, 주문)는 중복 생성 위험</b> → 재시도하지 않거나 Idempotency-Key로 서버가 중복을 막게 한다.</>,
            <><b>Exponential Backoff + Jitter</b>: 1초 → 2초 → 4초처럼 간격을 2배씩 늘리고, 무작위 값을 섞는다. 서버가 아플 때 모든 클라이언트가 같은 순간 몰려드는 것(thundering herd)을 막는다.</>,
            <>React Query는 기본으로 실패한 쿼리를 3번, 지수 backoff로 재시도한다(<Code>retry</Code>, <Code>retryDelay</Code> 옵션).</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>API가 여러 개인 모든 프로젝트</b> — 토큰·에러 처리를 한곳에서 바꿀 수 있다</>,
            <><b>토큰 만료 처리</b>: 401이면 인터셉터에서 refresh 후 원래 요청 재전송 (여러 요청이 동시에 401이면 refresh는 한 번만)</>,
            '모바일·불안정한 네트워크 환경 사용자가 많을 때: 조회 API에 재시도',
            '백엔드 응답 형식이 제각각일 때: 클라이언트에서 에러를 하나의 형태(AppError)로 통일',
          ]}
          avoid={[
            '결제·주문 같은 POST를 무조건 재시도 — 중복 결제 위험',
            '4xx까지 재시도 — 사용자를 오래 기다리게만 한다',
            '인터셉터에서 화면 이동·모달까지 직접 처리 — UI 의존이 생긴다. 이벤트로 알리고 UI는 React 쪽에서',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>컴포넌트가 상품 정보를 요청했을 때, 요청과 응답이 각 층을 지나가는 순서입니다.</p>
        <LayerViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '컴포넌트에서 직접',
            code: `
function ProductPage({ id }) {
  useEffect(() => {
    axios.get(\`https://api.shop.com/v1/products/\${id}\`, {
      headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` },
    })
      .then((res) => setProduct(res.data.data))
      .catch((err) => {
        if (err.response?.status === 401) location.href = '/login';
        else alert(err.response?.data?.message ?? '오류');
      });
  }, [id]);
}
// 이런 코드가 컴포넌트 수십 곳에 복붙되어 있다`,
            note: 'URL·토큰·에러 처리가 곳곳에 흩어져, 도메인이 바뀌거나 토큰 방식이 바뀌면 전부 고쳐야 한다.',
          }}
          after={{
            label: '층으로 나누기',
            code: `
// shared/api/client.ts — HTTP 클라이언트
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 10_000 });

api.interceptors.request.use((config) => {
  config.headers.Authorization = \`Bearer \${tokenStore.get()}\`;
  return config;
});
api.interceptors.response.use(
  (res) => res.data,                                // 응답 껍데기 벗기기
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await refreshToken();                          // 동시에 여러 개면 한 번만 (Promise 공유)
      return api(error.config);                      // 원래 요청 다시
    }
    throw toAppError(error);                         // { code, message, status } 로 통일
  }
);

// entities/product/api.ts — API 함수
export const getProduct = (id: string) => api.get<Product>(\`/products/\${id}\`);

// entities/product/useProduct.ts — Custom Hook
export const useProduct = (id: string) =>
  useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id),
    retry: (count, err) => err.status >= 500 && count < 3 });

// 컴포넌트
const { data: product } = useProduct(id);`,
            note: '컴포넌트는 Hook만 알고, 정책 변경은 client.ts 한 곳에서 끝난다.',
          }}
        />
        <Callout title="Exponential Backoff + Jitter">
          <CodeBlock
            code={`
async function withRetry(fn, { retries = 3, base = 500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = !err.status || err.status >= 500 || err.status === 429;
      if (!retryable || attempt >= retries) throw err;
      const delay = base * 2 ** attempt;                 // 500, 1000, 2000…
      const jitter = Math.random() * delay * 0.5;        // 동시에 몰리지 않게
      await new Promise((r) => setTimeout(r, delay + jitter));
    }
  }
}`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <RetryDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const LAYERS = [
  { name: '컴포넌트', req: 'useProduct("42") 호출', res: '{ data: product } 받아서 화면에 그림' },
  { name: 'Custom Hook', req: "queryKey ['product','42'] 캐시 확인 → 없으면 queryFn 실행", res: '캐시에 저장, 로딩/에러 상태 관리' },
  { name: 'API 함수', req: 'GET /products/42 (Product 타입)', res: 'Product 타입 데이터 반환' },
  { name: 'HTTP 클라이언트', req: '요청 인터셉터: Authorization 헤더 추가', res: '응답 인터셉터: data만 꺼냄 / 401이면 토큰 재발급 후 재요청 / 에러 형식 통일' },
  { name: '서버', req: '처리', res: '200 { data: {...} }' },
];

function LayerViz() {
  const [step, setStep] = useState(0);
  const total = LAYERS.length * 2 - 1;
  const goingDown = step < LAYERS.length;
  const idx = goingDown ? step : total - step;
  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        <button className={ui.btn} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← 이전</button>
        <button className={ui.btnPrimary} disabled={step === total} onClick={() => setStep((s) => s + 1)}>다음 →</button>
        <span className="self-center text-sm text-zinc-400">{goingDown ? '요청 ↓' : '응답 ↑'} {step + 1}/{total + 1}</span>
      </div>
      <div className="mt-4 space-y-2">
        {LAYERS.map((l, i) => (
          <div key={l.name} className={`grid grid-cols-[110px_1fr] items-center gap-3 rounded-lg p-3 text-sm transition ${i === idx ? 'bg-indigo-50 ring-2 ring-indigo-400 dark:bg-indigo-500/10' : 'bg-zinc-50 dark:bg-zinc-800/60'}`}>
            <span className="font-semibold">{l.name}</span>
            <span className={i === idx ? '' : 'text-zinc-400'}>{i === idx ? (goingDown ? l.req : l.res) : ''}</span>
          </div>
        ))}
      </div>
    </Viz>
  );
}

/* ---------- 데모: 재시도 정책 시뮬레이터 ---------- */

const POLICIES = {
  none: { label: '재시도 없음', delays: [] },
  fixed: { label: '1초 간격 3번', delays: [1000, 1000, 1000] },
  backoff: { label: '지수 backoff + jitter 3번', delays: [500, 1000, 2000] },
};
const STATUSES = [{ value: 503, label: '503 (서버 일시 오류)' }, { value: 404, label: '404 (없음)' }];

function RetryDemo() {
  const [policy, setPolicy] = useState('backoff');
  const [failRate, setFailRate] = useState(70);
  const [errorStatus, setErrorStatus] = useState(503);
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const runId = useRef(0);

  const run = async () => {
    const id = ++runId.current;
    setRunning(true);
    setLog([]);
    setSummary(null);
    const t0 = performance.now();
    const at = () => `${((performance.now() - t0) / 1000).toFixed(1)}s`;
    const add = (line) => id === runId.current && setLog((l) => [...l, line]);
    const delays = POLICIES[policy].delays;

    for (let attempt = 0; ; attempt++) {
      add(`${at()}  시도 #${attempt + 1}  GET /products/42`);
      await new Promise((r) => setTimeout(r, 300)); // 응답 시간
      const ok = Math.random() * 100 >= failRate;
      if (ok) {
        add(`${at()}  ← 200 OK`);
        setSummary({ ok: true, attempts: attempt + 1, time: at() });
        break;
      }
      add(`${at()}  ← ${errorStatus} ${errorStatus === 503 ? 'Service Unavailable' : 'Not Found'}`);
      const retryable = errorStatus >= 500;
      if (!retryable) add('         4xx는 다시 해도 같은 결과 → 재시도하지 않음');
      if (!retryable || attempt >= delays.length) {
        setSummary({ ok: false, attempts: attempt + 1, time: at() });
        break;
      }
      const base = delays[attempt];
      const wait = policy === 'backoff' ? Math.round(base + Math.random() * base * 0.5) : base;
      add(`         ${wait}ms 기다렸다가 재시도${policy === 'backoff' ? ' (2배씩 증가 + 무작위)' : ''}`);
      await new Promise((r) => setTimeout(r, wait));
    }
    if (id === runId.current) setRunning(false);
  };

  return (
    <Demo hint="서버 실패율과 에러 종류를 정하고 '요청 보내기'를 여러 번 눌러 보세요. 재시도 정책에 따라 결국 성공하는 비율과 걸리는 시간이 달라집니다.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={policy} onChange={setPolicy} options={Object.entries(POLICIES).map(([value, p]) => ({ value, label: p.label }))} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          서버 실패율
          <input type="range" min={0} max={100} step={10} value={failRate} onChange={(e) => setFailRate(Number(e.target.value))} className="w-32 accent-indigo-600" />
          <span className="w-10 font-mono">{failRate}%</span>
        </label>
        <Segmented value={errorStatus} onChange={setErrorStatus} options={STATUSES} />
        <button className={ui.btnPrimary} onClick={run} disabled={running}>{running ? '요청 중…' : '요청 보내기'}</button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="결과" value={summary ? (summary.ok ? '성공' : '실패') : '-'} tone={summary ? (summary.ok ? 'good' : 'bad') : undefined} />
        <Stat label="시도 횟수" value={summary ? `${summary.attempts}회` : '-'} />
        <Stat label="걸린 시간" value={summary?.time ?? '-'} />
      </div>
      <pre className="mt-3 min-h-24 overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-800">{log.length ? log.join('\n') : '아직 요청 없음'}</pre>
    </Demo>
  );
}
