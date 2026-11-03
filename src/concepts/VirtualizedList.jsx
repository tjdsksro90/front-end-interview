import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { List } from 'react-window';
import {
  Section, H3, List as Bullets, Code, OneLiner, WhenToUse, Callout, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Segmented, Stat, Table, ui,
} from '../components/kit.jsx';

export default function VirtualizedList() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          가상화(Virtualization, Windowing)는 긴 목록에서 <u>현재 화면에 보이는 행만 실제 DOM으로 렌더</u>하는 기법입니다.
          10,000개 목록이라도 DOM에는 20~30개만 존재하고, 스크롤에 맞춰 보여줄 행을 바꿔 끼우기 때문에 렌더링·메모리 비용이 목록 길이와 거의 무관해집니다.
        </OneLiner>

        <H3>왜 필요한가?</H3>
        <Bullets
          items={[
            <>DOM 노드는 비싸다. 행 1만 개 × 노드 10개 = <b>10만 개 DOM</b> → 첫 렌더가 느리고, 스타일 계산·레이아웃·메모리 모두 부담.</>,
            <>사용자가 실제로 보는 건 화면 높이만큼(대략 10~20행)뿐이다. 나머지는 그려도 안 보인다.</>,
            <>React.memo나 useMemo로는 해결이 안 된다 — 문제는 "다시 그리는 것"이 아니라 <b>처음부터 너무 많이 그리는 것</b>이기 때문.</>,
          ]}
        />

        <H3>동작 원리 (직접 구현할 수 있을 정도로)</H3>
        <Bullets
          items={[
            <>① 바깥 컨테이너: 고정 높이 + <Code>overflow: auto</Code> (스크롤 창)</>,
            <>② 안쪽 spacer: 높이를 <Code>전체 개수 × 행 높이</Code>로 잡아서 <b>스크롤바가 전체 목록인 것처럼</b> 보이게 한다.</>,
            <>③ 스크롤할 때마다 <Code>startIndex = floor(scrollTop / 행 높이)</Code>, <Code>endIndex = start + 화면에 들어가는 개수</Code>를 계산.</>,
            <>④ 그 범위만 렌더하고 <Code>position: absolute; top: index × 행 높이</Code>로 제자리에 배치.</>,
            <>⑤ 위아래로 몇 개씩 여유분(<b>overscan</b>)을 더 그려서 빠르게 스크롤할 때 빈 공간이 보이지 않게 한다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <>수백~수천 개 이상 행이 <b>한 번에 렌더</b>되는 목록/테이블: 거래 내역, 로그 뷰어, 관리자 데이터 테이블, 채팅 메시지</>,
            <><b>무한 스크롤</b>로 데이터가 계속 쌓이는 피드 — 쌓일수록 느려지는 문제를 막는다</>,
            '셀렉트 박스 옵션이 매우 많을 때 (국가, 주소, 상품 목록)',
            '스크롤이 버벅이고 Performance 탭에서 Layout/Recalculate Style 시간이 클 때',
          ]}
          avoid={[
            '수십 개 정도의 짧은 목록 — 복잡도만 늘어난다',
            '페이지네이션으로 한 번에 20개씩만 보여줘도 되는 경우',
            'Ctrl+F 브라우저 검색, SEO가 중요한 목록 — 화면 밖 행이 DOM에 없어서 검색/크롤링이 안 된다',
            '행 높이가 제각각이고 측정이 어려운 경우 (가능은 하지만 구현 난이도 ↑)',
          ]}
        />
        <Callout type="tip" title="실무에서는 라이브러리를 쓴다">
          <p><b>@tanstack/react-virtual</b>(Headless, 가변 높이 지원), <b>react-window</b>(가볍고 단순), <b>react-virtuoso</b>(가변 높이·채팅에 강함). 면접에서는 위 원리(spacer + scrollTop으로 범위 계산 + absolute 배치 + overscan)를 설명할 수 있으면 충분합니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>스크롤 위치를 움직여 보세요. 전체 40행 중 <b>DOM에 실제로 존재하는 행</b>만 색이 칠해집니다.</p>
        <WindowViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            code: `
function LogList({ logs }) { // logs.length === 10000
  return (
    <div style={{ height: 400, overflow: 'auto' }}>
      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
    </div>
  );
}`,
            note: '10,000개 행을 전부 DOM으로 만든다. 첫 렌더가 수백 ms 걸리고 스크롤·필터링이 버벅인다.',
          }}
          after={{
            code: `
const ROW = 40, HEIGHT = 400, OVERSCAN = 5;

function LogList({ logs }) {
  const [scrollTop, setScrollTop] = useState(0);

  const start = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
  const end = Math.min(
    logs.length,
    Math.ceil((scrollTop + HEIGHT) / ROW) + OVERSCAN
  );

  return (
    <div
      style={{ height: HEIGHT, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* 전체 높이만큼의 spacer → 스크롤바는 1만 개짜리처럼 */}
      <div style={{ height: logs.length * ROW, position: 'relative' }}>
        {logs.slice(start, end).map((log, i) => (
          <div
            key={log.id}
            style={{ position: 'absolute', top: (start + i) * ROW, height: ROW, width: '100%' }}
          >
            <LogRow log={log} />
          </div>
        ))}
      </div>
    </div>
  );
}`,
            note: 'DOM에는 화면에 보이는 10개 + overscan 10개 ≈ 20개만 존재. 목록이 10만 개여도 비용이 같다.',
          }}
        />
        <H3>직접 구현 vs react-window</H3>
        <p>위 원리를 매번 직접 짜는 대신, 실무에서는 보통 <b>react-window</b>를 씁니다. 같은 목록을 react-window(v2)로 쓰면 이렇게 짧아집니다.</p>
        <CodeCompare
          before={{
            label: '직접 구현',
            code: `
const [scrollTop, setScrollTop] = useState(0);
const start = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
const end = Math.min(logs.length, Math.ceil((scrollTop + HEIGHT) / ROW) + OVERSCAN);

<div style={{ height: HEIGHT, overflow: 'auto' }}
     onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
  <div style={{ height: logs.length * ROW, position: 'relative' }}>
    {logs.slice(start, end).map((log, i) => (
      <div key={log.id}
           style={{ position: 'absolute', top: (start + i) * ROW, width: '100%' }}>
        <LogRow log={log} />
      </div>
    ))}
  </div>
</div>`,
            note: '원리를 이해하기엔 좋지만 가변 높이, 리사이즈, 스크롤 이동(scrollToRow), 접근성 등을 직접 처리해야 한다.',
          }}
          after={{
            label: 'react-window 사용',
            code: `
import { List } from 'react-window';

// 행 컴포넌트: index와 위치 style을 받는다 (style은 꼭 적용!)
function Row({ index, style, logs }) {
  return <div style={style}><LogRow log={logs[index]} /></div>;
}

<List
  rowComponent={Row}
  rowCount={logs.length}
  rowHeight={40}
  rowProps={{ logs }}     // Row에 추가로 넘길 props
  overscanCount={5}
  style={{ height: 400 }}
/>`,
            note: 'spacer, 범위 계산, absolute 배치를 라이브러리가 해준다. 아래 데모의 세 번째 탭이 실제 react-window로 동작한다.',
          }}
        />
        <Table
          head={['', '직접 구현', 'react-window', '@tanstack/react-virtual']}
          rows={[
            ['형태', '스크롤 state + slice', '<List> 컴포넌트', 'useVirtualizer Hook (Headless)'],
            ['마크업 자유도', '완전 자유', '행 컴포넌트만 작성', '완전 자유 (직접 그림)'],
            ['가변 높이', '직접 측정 필요', '함수 / useDynamicRowHeight', '측정 내장 (measureElement)'],
            ['크기', '0KB', '작음 (~6KB gzip)', '작음 (~5KB gzip)'],
            ['언제', '원리 학습, 아주 단순한 목록', '고정 높이 목록·그리드를 빠르게', '테이블·커스텀 UI·가변 높이'],
          ]}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <VirtualDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const VIZ_TOTAL = 40;
const VIZ_VISIBLE = 8;
const VIZ_OVERSCAN = 2;

function WindowViz() {
  const [top, setTop] = useState(0);
  const start = Math.max(0, top - VIZ_OVERSCAN);
  const end = Math.min(VIZ_TOTAL, top + VIZ_VISIBLE + VIZ_OVERSCAN);

  return (
    <Viz>
      <label className="flex flex-wrap items-center gap-3 text-sm">
        스크롤 위치
        <input type="range" min={0} max={VIZ_TOTAL - VIZ_VISIBLE} value={top} onChange={(e) => setTop(Number(e.target.value))} className="w-60 accent-indigo-600" />
        <span className="font-mono text-xs text-zinc-400">scrollTop = {top} × 40px = {top * 40}px</span>
      </label>
      <div className="mt-4 grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
        {Array.from({ length: VIZ_TOTAL }, (_, i) => {
          const visible = i >= top && i < top + VIZ_VISIBLE;
          const inDom = i >= start && i < end;
          return (
            <div
              key={i}
              className={`grid h-9 place-items-center rounded font-mono text-[10px] transition ${
                visible
                  ? 'bg-indigo-500 text-white'
                  : inDom
                    ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-500/30 dark:text-indigo-200'
                    : 'bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600'
              }`}
            >
              {i}
            </div>
          );
        })}
      </div>
      <Legend
        items={[
          ['bg-indigo-500', `화면에 보이는 행 (${VIZ_VISIBLE}개)`],
          ['bg-indigo-200 dark:bg-indigo-500/30', `overscan 여유분 (위아래 ${VIZ_OVERSCAN}개)`],
          ['bg-zinc-100 dark:bg-zinc-800', 'DOM에 없음 (빈 공간은 spacer 높이가 대신함)'],
        ]}
      />
      <p className="mt-3 font-mono text-xs">
        start = max(0, {top} - {VIZ_OVERSCAN}) = <b>{start}</b>, end = min({VIZ_TOTAL}, {top} + {VIZ_VISIBLE} + {VIZ_OVERSCAN}) = <b>{end}</b> → DOM 행 <b>{end - start}개</b> / 전체 {VIZ_TOTAL}개
      </p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const MESSAGES = ['사용자 로그인', '결제 요청 처리', 'API 응답 지연', '캐시 갱신', '이미지 업로드', '세션 만료', '주문 생성'];
const makeLogs = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    level: LEVELS[[0, 0, 3, 1, 0, 0, 2, 0][i % 8]],
    message: `${MESSAGES[i % MESSAGES.length]} #${i}`,
    time: `12:${String(Math.floor(i / 60) % 60).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
  }));

const ROW = 40;
const HEIGHT = 360;
const OVERSCAN = 5;

function VirtualDemo() {
  const [mode, setMode] = useState('off');
  const [count, setCount] = useState(10000);
  const [logs, setLogs] = useState(() => makeLogs(10000));
  const [renderMs, setRenderMs] = useState(null);
  const clickedAt = useRef(performance.now());

  const change = (nextMode, nextCount = count) => {
    clickedAt.current = performance.now();
    setRenderMs(null);
    setMode(nextMode);
    if (nextCount !== count) { setCount(nextCount); setLogs(makeLogs(nextCount)); }
  };
  const onMounted = () => setRenderMs(Math.round(performance.now() - clickedAt.current));

  return (
    <Demo hint="모드를 바꾸면 목록을 새로 렌더하고 걸린 시간을 잽니다. 개수를 늘려가며 비교하고, 직접 스크롤도 해보세요.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={mode} onChange={(v) => change(v)} options={[{ value: 'off', label: '전부 렌더' }, { value: 'on', label: '가상화 (직접 구현)' }, { value: 'lib', label: 'react-window' }]} />
        <select className={ui.input} value={count} onChange={(e) => change(mode, Number(e.target.value))}>
          <option value={1000}>1,000개</option>
          <option value={10000}>10,000개</option>
          <option value={30000}>30,000개</option>
        </select>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="목록 렌더에 걸린 시간 (모드/개수 변경 시)" value={renderMs == null ? '측정 중…' : `${renderMs}ms`} tone={renderMs == null ? undefined : renderMs > 100 ? 'bad' : 'good'} />
        <Stat label="전체 데이터" value={`${count.toLocaleString()}개`} />
      </div>
      <div className="mt-3">
        {mode === 'off' && <PlainList key={`off${count}`} logs={logs} onMounted={onMounted} />}
        {mode === 'on' && <VirtualList key={`on${count}`} logs={logs} onMounted={onMounted} />}
        {mode === 'lib' && <WindowList key={`lib${count}`} logs={logs} onMounted={onMounted} />}
      </div>
    </Demo>
  );
}

function useOnMount(cb) {
  // 커밋 직후(그리기 직전) 한 번 호출 → 렌더 + DOM 생성 시간 측정
  useLayoutEffect(() => { cb(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function PlainList({ logs, onMounted }) {
  useOnMount(onMounted);
  return (
    <>
      <DomInfo inDom={logs.length} total={logs.length} />
      <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800" style={{ height: HEIGHT }}>
        {logs.map((log) => <LogRow key={log.id} log={log} />)}
      </div>
    </>
  );
}

function VirtualList({ logs, onMounted }) {
  useOnMount(onMounted);
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
  const end = Math.min(logs.length, Math.ceil((scrollTop + HEIGHT) / ROW) + OVERSCAN);

  return (
    <>
      <DomInfo inDom={end - start} total={logs.length} range={`#${start} ~ #${end - 1}`} />
      <div
        className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
        style={{ height: HEIGHT }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: logs.length * ROW, position: 'relative' }}>
          {logs.slice(start, end).map((log, i) => (
            <div key={log.id} style={{ position: 'absolute', top: (start + i) * ROW, left: 0, right: 0 }}>
              <LogRow log={log} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function WindowRow({ index, style, ariaAttributes, logs }) {
  return (
    <div style={style} {...ariaAttributes}>
      <LogRow log={logs[index]} />
    </div>
  );
}

// react-window의 List. 실제로 DOM에 그린 범위는 onRowsRendered의 두 번째 인자(overscan 포함)로 받는다.
function WindowList({ logs, onMounted }) {
  useOnMount(onMounted);
  const [range, setRange] = useState({ startIndex: 0, stopIndex: 0 });
  // 콜백이 렌더마다 바뀌면 react-window가 다시 호출해서 무한 렌더가 된다 → 고정 + 범위가 같으면 state 유지
  const onRowsRendered = useCallback(
    (_, all) => setRange((r) => (r.startIndex === all.startIndex && r.stopIndex === all.stopIndex ? r : all)),
    []
  );
  return (
    <>
      <DomInfo inDom={range.stopIndex - range.startIndex + 1} total={logs.length} range={`#${range.startIndex} ~ #${range.stopIndex}`} />
      <List
        className="rounded-xl border border-zinc-200 dark:border-zinc-800"
        rowComponent={WindowRow}
        rowCount={logs.length}
        rowHeight={ROW}
        rowProps={{ logs }}
        overscanCount={OVERSCAN}
        onRowsRendered={onRowsRendered}
        style={{ height: HEIGHT }}
      />
    </>
  );
}

function DomInfo({ inDom, total, range }) {
  return (
    <p className="mb-2 text-sm">
      DOM에 있는 행: <b className={inDom > 100 ? ui.bad : ui.good}>{inDom.toLocaleString()}개</b>
      <span className="text-zinc-400"> / {total.toLocaleString()}개 {range && `(${range})`}</span>
    </p>
  );
}

const LEVEL_STYLE = {
  INFO: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  WARN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  ERROR: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  DEBUG: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

function LogRow({ log }) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 px-3 text-sm dark:border-zinc-800/70" style={{ height: ROW }}>
      <span className="w-14 font-mono text-xs text-zinc-400 tabular-nums">#{log.id}</span>
      <span className={`w-14 rounded px-1.5 text-center text-[11px] font-bold ${LEVEL_STYLE[log.level]}`}>{log.level}</span>
      <span className="flex-1 truncate">{log.message}</span>
      <span className="hidden font-mono text-xs text-zinc-400 sm:inline">{log.time}</span>
    </div>
  );
}
