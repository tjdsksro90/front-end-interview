import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function DebounceThrottle() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          둘 다 짧은 시간에 수십 번 일어나는 이벤트의 실행 횟수를 줄이는 기법입니다.
          <u>Debounce는 입력이 멈춘 뒤 마지막 한 번만</u>, <u>Throttle은 일정 간격마다 최대 한 번씩</u> 실행합니다.
        </OneLiner>

        <Table
          head={['', 'Debounce', 'Throttle']}
          rows={[
            ['비유', '엘리베이터 문: 사람이 계속 타면 계속 기다렸다가, 아무도 안 탈 때 닫힘', '지하철 배차: 사람이 몰려도 5분마다 한 대씩'],
            ['실행 시점', '마지막 이벤트 후 N ms 동안 조용하면 1번', 'N ms마다 최대 1번 (계속 이벤트가 와도 주기적으로 실행)'],
            ['연속 입력 중에는', '한 번도 실행 안 됨', '주기적으로 실행됨'],
            ['대표 용도', '검색어 자동완성, 입력 검증, 창 크기 조절이 끝났을 때', '스크롤 위치 계산, 무한 스크롤 체크, 드래그, mousemove'],
          ]}
        />

        <H3>알아둘 것</H3>
        <List
          items={[
            <><b>leading / trailing</b>: 첫 이벤트에 바로 실행할지(leading), 끝에 실행할지(trailing). 버튼 연타 방지는 leading debounce가 맞다 (첫 클릭만 처리).</>,
            <><b>React에서 함정</b>: 컴포넌트 안에서 <Code>debounce(fn)</Code>를 그냥 만들면 렌더마다 새 debounce가 생겨서 타이머가 공유되지 않는다 → <Code>useMemo</Code>/<Code>useRef</Code>로 한 번만 만들고, 언마운트 때 <Code>cancel</Code>.</>,
            <><b>애니메이션·스크롤 UI</b>는 throttle 대신 <Code>requestAnimationFrame</Code>(프레임마다 1번)이 더 자연스러울 때가 많다.</>,
            <><b>useDeferredValue와 차이</b>: debounce는 정해진 시간만큼 무조건 기다리고 API 호출 횟수를 줄인다. useDeferredValue는 렌더링 우선순위만 낮춘다. (<Link className="text-indigo-600 dark:text-indigo-400" to="/react/in-react-optimization/deep/concurrent-mode">Concurrent 심화</Link>)</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>Debounce</b>: 검색창 자동완성 API 호출 — "ㄹ, 리, 리액, 리액트" 4번 대신 마지막 1번</>,
            <><b>Debounce</b>: 폼 자동 저장, 입력 중 유효성 검사(아이디 중복 확인), resize가 끝난 뒤 레이아웃 계산</>,
            <><b>Throttle</b>: 스크롤 이벤트로 "맨 위로" 버튼 표시, 무한 스크롤 바닥 체크, 진행률 표시</>,
            <><b>Throttle</b>: 드래그·mousemove 좌표 서버 전송, 버튼 연타로 인한 중복 요청 제한</>,
          ]}
          avoid={[
            '이벤트가 원래 드문 경우 (일반 클릭) — 반응만 늦어진다',
            '무한 스크롤 바닥 감지 — throttle보다 IntersectionObserver가 더 정확하고 가볍다',
            '입력값 자체를 debounce하는 것 — input의 value는 즉시 반영하고, API 호출만 debounce',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>아래 상자 위에서 마우스를 움직여 보세요(모바일은 손가락으로 문지르기). 실제 이벤트가 세 줄에 기록됩니다: 원본 이벤트, debounce(300ms), throttle(300ms).</p>
        <EventTimeline />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '그대로 호출',
            code: `
function Search() {
  const [keyword, setKeyword] = useState('');

  const onChange = (e) => {
    setKeyword(e.target.value);
    searchAPI(e.target.value); // 한 글자마다 API 호출
  };
  return <input value={keyword} onChange={onChange} />;
}`,
            note: '"react"를 치면 5번, 한글 "리액트"는 조합 중에도 이벤트가 나서 7~8번 호출된다. 응답 순서가 뒤바뀌면 옛 결과가 보일 수도 있다.',
          }}
          after={{
            label: 'Debounce 적용',
            code: `
function debounce(fn, delay) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);                       // 이전 예약 취소
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

function Search() {
  const [keyword, setKeyword] = useState('');
  // 렌더마다 새로 만들지 않도록 한 번만 생성
  const debouncedSearch = useMemo(() => debounce(searchAPI, 300), []);
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const onChange = (e) => {
    setKeyword(e.target.value);       // 입력창은 즉시
    debouncedSearch(e.target.value);  // API는 멈춘 뒤 1번
  };
  return <input value={keyword} onChange={onChange} />;
}`,
            note: '입력이 300ms 멈췄을 때 마지막 값으로 한 번만 호출한다.',
          }}
        />
        <Callout title="Throttle 구현">
          <CodeBlock
            code={`
function throttle(fn, interval) {
  let last = 0;
  let timer;
  return (...args) => {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining <= 0) {            // 간격이 지났으면 바로 실행
      last = now;
      fn(...args);
    } else {                          // 아니면 남은 시간 뒤 마지막 값으로 한 번 (trailing)
      clearTimeout(timer);
      timer = setTimeout(() => { last = Date.now(); fn(...args); }, remaining);
    }
  };
}

window.addEventListener('scroll', throttle(updateScrollButton, 200));`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <SearchDemo />
      </Section>
    </>
  );
}

/* ---------- 공통 구현 ---------- */

function debounce(fn, delay) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

function throttle(fn, interval) {
  let last = 0;
  let timer;
  const throttled = (...args) => {
    const now = Date.now();
    const remaining = interval - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => { last = Date.now(); fn(...args); }, remaining);
    }
  };
  throttled.cancel = () => clearTimeout(timer);
  return throttled;
}

/* ---------- 시각화: 실제 이벤트 타임라인 ---------- */

const WINDOW_MS = 4000;
const ROWS = [
  { key: 'raw', label: '원본 이벤트', color: 'bg-zinc-400' },
  { key: 'debounce', label: 'debounce 300ms', color: 'bg-indigo-500' },
  { key: 'throttle', label: 'throttle 300ms', color: 'bg-emerald-500' },
];

function EventTimeline() {
  const [events, setEvents] = useState({ raw: [], debounce: [], throttle: [] });
  const [now, setNow] = useState(() => Date.now());
  const counts = useRef({ raw: 0, debounce: 0, throttle: 0 });

  const handlers = useMemo(() => {
    const push = (key) => () => {
      counts.current[key] += 1;
      setEvents((e) => ({ ...e, [key]: [...e[key].filter((t) => Date.now() - t < WINDOW_MS), Date.now()] }));
    };
    return { raw: push('raw'), debounce: debounce(push('debounce'), 300), throttle: throttle(push('throttle'), 300) };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => { clearInterval(id); handlers.debounce.cancel(); handlers.throttle.cancel(); };
  }, [handlers]);

  const onMove = () => {
    handlers.raw();
    handlers.debounce();
    handlers.throttle();
  };

  return (
    <Viz>
      <div
        onPointerMove={onMove}
        className="grid h-24 touch-none place-items-center rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 text-sm text-indigo-600 select-none dark:border-indigo-500/40 dark:bg-indigo-500/5 dark:text-indigo-300"
      >
        여기서 마우스를 움직여 보세요
      </div>
      <div className="mt-4 min-w-[460px] space-y-2">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs font-semibold">{r.label}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
              {events[r.key].map((t, i) => {
                const x = 100 - ((now - t) / WINDOW_MS) * 100;
                return x < 0 ? null : <span key={`${t}-${i}`} className={`absolute top-1 bottom-1 w-1 rounded-sm ${r.color}`} style={{ left: `${x}%` }} />;
              })}
            </div>
            <span className="w-14 text-right font-mono text-xs tabular-nums">{counts.current[r.key]}회</span>
          </div>
        ))}
        <div className="flex justify-between pl-[8.75rem] font-mono text-[10px] text-zinc-400"><span>4초 전</span><span>지금</span></div>
      </div>
      <Legend items={ROWS.map((r) => [r.color, r.label])} />
      <p className={`mt-3 text-sm ${ui.muted}`}>
        → 계속 움직이는 동안 debounce 줄은 비어 있다가 멈추면 한 번 찍히고, throttle 줄은 움직이는 동안 0.3초마다 꾸준히 찍힙니다.
      </p>
    </Viz>
  );
}

/* ---------- 데모: 검색 API 호출 횟수 ---------- */

function SearchDemo() {
  const [mode, setMode] = useState('none');
  return (
    <Demo hint="검색창에 '리액트 쿼리'처럼 빠르게 입력해 보세요. 모드에 따라 API 호출 횟수와 마지막으로 검색된 키워드가 달라집니다.">
      <Segmented value={mode} onChange={setMode} options={[{ value: 'none', label: '그대로' }, { value: 'debounce', label: 'debounce 300ms' }, { value: 'throttle', label: 'throttle 300ms' }]} />
      <SearchBox key={mode} mode={mode} />
    </Demo>
  );
}

function SearchBox({ mode }) {
  const [keyword, setKeyword] = useState('');
  const [calls, setCalls] = useState([]);
  const [changes, setChanges] = useState(0);
  const call = useMemo(() => {
    const api = (q) => setCalls((c) => [{ q, at: new Date().toLocaleTimeString('ko-KR', { hour12: false }) }, ...c]);
    if (mode === 'debounce') return debounce(api, 300);
    if (mode === 'throttle') return throttle(api, 300);
    return api;
  }, [mode]);
  useEffect(() => () => call.cancel?.(), [call]);

  return (
    <div className="mt-4 space-y-3">
      <input className={`${ui.input} w-full`} placeholder="검색어 입력" value={keyword} onChange={(e) => { setKeyword(e.target.value); setChanges((n) => n + 1); call(e.target.value); }} />
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="API 호출 횟수" value={`${calls.length}회`} tone={calls.length > 5 ? 'bad' : 'good'} />
        <Stat label="입력(onChange) 이벤트" value={`${changes}회`} />
      </div>
      <div className="max-h-40 space-y-0.5 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
        {calls.length ? calls.map((c, i) => <div key={i}>{c.at}  GET /search?q={c.q || '(빈 값)'}</div>) : <span className="text-zinc-400">아직 호출 없음</span>}
      </div>
    </div>
  );
}
