import { useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, ui,
} from '../components/kit.jsx';

export default function MapSet() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          <b>Map</b>은 <u>"이 키의 값은 뭐지?"</u>에 답하는 <b>짝(key → value) 저장소</b>, <b>Set</b>은{' '}
          <u>"이 값이 들어 있나?"</u>에 답하는 <b>중복 없는 값 모음</b>입니다. 고를 때는 "내가 나중에 무엇을 물어볼 것인가"를 먼저 떠올리면 됩니다.
        </OneLiner>

        <H3>나중에 던질 질문으로 고르기</H3>
        <Table
          head={['나중에 이렇게 물어본다면', '고를 것', '예']}
          rows={[
            ['"이 값 들어 있어?" / "중복 없이 모아 줘"', <b key="s">Set</b>, '선택된 아이디, 방문한 페이지, 태그 목록 중복 제거'],
            ['"이 키에 연결된 값은?"', <b key="m">Map</b>, '아이디 → 사용자, 단어 → 개수, DOM 요소 → 상태'],
            ['"3번째 거 줘" / "정렬해서 보여 줘"', <b key="a">Array</b>, '화면에 그릴 목록, 같은 값이 여러 번 나와도 되는 기록'],
            ['"이 사용자의 name은?" (모양이 정해진 데이터)', <b key="o">Object</b>, 'API 응답, 설정값, JSON으로 주고받는 데이터'],
          ]}
        />

        <H3>Map과 Set의 공통점</H3>
        <List
          items={[
            <>넣은 순서대로 순회한다 (<Code>for...of</Code>, <Code>forEach</Code>).</>,
            <>개수는 <Code>size</Code> 속성으로 바로 안다.</>,
            <>객체·함수·숫자 등 <b>아무 값이나</b> 키(Set은 값)로 쓸 수 있다.</>,
            <>같은지 비교는 <Code>===</Code>와 거의 같다(SameValueZero). <Code>NaN</Code>끼리는 같다고 보고, <b>객체는 참조로</b> 비교한다.</>,
            <>둘 다 <Code>JSON.stringify</Code>하면 <Code>{'{}'}</Code>가 된다.</>,
          ]}
        />

        <Table
          head={['', 'Map', 'Set']}
          rows={[
            ['저장', <Code key="1">map.set(key, value)</Code>, <Code key="2">set.add(value)</Code>],
            ['꺼내기', <Code key="3">map.get(key)</Code>, '꺼내는 메서드 없음 (있는지 확인·순회만)'],
            ['같은 것을 또 넣으면', '값을 덮어씀', '아무 일도 없음'],
            ['순회 결과', <Code key="4">[key, value]</Code>, <Code key="5">value</Code>],
            ['비슷한 것', 'Object (키가 문자열일 때)', 'Array (중복·순서가 필요할 때)'],
          ]}
        />

        <Callout type="tip" title="면접 포인트">
          <p>"Map은 Object와, Set은 Array와 비교해서 설명"하면 이해한 티가 납니다. Map은 객체를 키로 쓸 수 있고 size·순회가 쉽다, Set은 has가 includes보다 빠르고 중복이 자동으로 없다.</p>
          <p>그리고 "JSON으로 바로 안 바뀐다", "React state로 쓸 땐 새로 만들어야 한다"는 실무 주의점까지 말하면 좋아요.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <H3>같은 데이터를 Array · Set · Map에 넣어 보기</H3>
        <p>과일을 눌러서 세 자료구조에 동시에 넣어 보세요. 같은 과일을 또 넣었을 때 각각 어떻게 다른지 보세요.</p>
        <PutViz />

        <H3>객체를 키로 쓰면: Object vs Map</H3>
        <p>내용이 다른 두 사용자 객체를 키로 정보를 저장합니다.</p>
        <ObjectKeyViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>"들어 있나?" 확인을 반복할 때</H3>
        <CodeCompare
          before={{
            label: 'Array.includes',
            code: `
const selected = [3, 8, 15];

items.map((item) => (
  // 항목마다 배열을 앞에서부터 훑는다
  <Row checked={selected.includes(item.id)} />
));

// 빼기도 번거롭다
setSelected(selected.filter((id) => id !== 8));`,
            note: '선택된 개수가 많아질수록 확인이 느려진다. 실수로 같은 id가 두 번 들어갈 수도 있다.',
          }}
          after={{
            label: 'Set.has',
            code: `
const selected = new Set([3, 8, 15]);

items.map((item) => (
  <Row checked={selected.has(item.id)} />
));

const next = new Set(selected);
next.delete(8);          // 새 Set을 만들어 바꾼다
setSelected(next);`,
            note: '확인이 빠르고, 중복이 생길 수 없다. React에서는 원본 대신 새 Set을 만들어 넣는다.',
          }}
        />

        <H3>개수 세기</H3>
        <CodeCompare
          before={{
            label: 'Object로 세기',
            code: `
const count = {};
for (const word of words) {
  count[word] = (count[word] ?? 0) + 1;
}
// words에 'constructor'가 있으면?
// count.constructor는 처음부터 함수라서 결과가 이상해진다
Object.keys(count).length; // 개수`,
            note: '키가 문자열로만 저장되고, 프로토타입의 기본 키와 부딪힐 수 있다.',
          }}
          after={{
            label: 'Map으로 세기',
            code: `
const count = new Map();
for (const word of words) {
  count.set(word, (count.get(word) ?? 0) + 1);
}
count.size;                        // 개수
[...count].sort((a, b) => b[1] - a[1]); // 많이 나온 순`,
            note: '빈 상태로 시작해서 충돌이 없고, size와 순회가 바로 된다.',
          }}
        />

        <H3>아이디로 찾기를 반복할 때</H3>
        <CodeCompare
          before={{
            label: '매번 find',
            code: `
orders.map((order) => {
  const user = users.find((u) => u.id === order.userId);
  return { ...order, userName: user?.name };
});
// 주문 1,000개 × 사용자 1,000명 = 최대 100만 번 비교`,
            note: '찾을 때마다 배열을 처음부터 훑는다.',
          }}
          after={{
            label: 'Map으로 한 번 색인',
            code: `
const userById = new Map(users.map((u) => [u.id, u]));

orders.map((order) => ({
  ...order,
  userName: userById.get(order.userId)?.name,
}));`,
            note: 'Map을 한 번 만들어 두면 이후 찾기는 get 한 번.',
          }}
        />

        <H3>JSON으로 보낼 때</H3>
        <CodeBlock
          code={`
const map = new Map([['apple', 3], ['banana', 0]]);
const set = new Set(['a', 'b']);

JSON.stringify(map);                    // '{}'  ← 내용이 사라진다!
JSON.stringify(Object.fromEntries(map)); // '{"apple":3,"banana":0}'
JSON.stringify([...set]);               // '["a","b"]'

// 받아서 다시 만들기
new Map(Object.entries(JSON.parse(text)));
new Set(JSON.parse(text));`}
        />

        <H3>WeakMap · WeakSet은 언제?</H3>
        <CodeBlock
          code={`
// DOM 요소에 정보를 붙이되, 요소가 사라지면 정보도 같이 사라지게
const tooltipState = new WeakMap();
tooltipState.set(buttonEl, { open: false });

// 순환 참조 검사: 이미 본 객체인지
function deepClone(obj, seen = new WeakSet()) {
  if (seen.has(obj)) throw new Error('순환 참조');
  seen.add(obj);
  // ...
}`}
        />
        <List
          items={[
            <>키(값)로 <b>객체만</b> 받는다. 그 객체를 다른 곳에서 더 이상 안 쓰면 같이 메모리에서 정리된다.</>,
            <>대신 순회·<Code>size</Code>가 없다. "전체 목록"이 필요하면 일반 Map·Set을 쓴다.</>,
          ]}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>상황별로 골라 보기</H3>
        <Quiz />
        <H3>속도 비교: includes vs has</H3>
        <SpeedTest />
      </Section>
    </>
  );
}

// ───────────────── 시각화: 넣어 보기 ─────────────────
const FRUITS = ['사과', '바나나', '포도', '딸기'];

function PutViz() {
  const [log, setLog] = useState([]);
  const [last, setLast] = useState(null);

  const arr = log;
  const set = new Set(log);
  const map = new Map();
  for (const f of log) map.set(f, (map.get(f) ?? 0) + 1);

  const put = (f) => {
    setLast({ fruit: f, existed: log.includes(f) });
    setLog([...log, f]);
  };

  return (
    <Viz>
      <div className="flex flex-wrap gap-2">
        {FRUITS.map((f) => (
          <button key={f} className={ui.btn} onClick={() => put(f)}>{f} 넣기</button>
        ))}
        <button className={ui.btn} onClick={() => { setLog([]); setLast(null); }} disabled={!log.length}>비우기</button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Column title="Array" code="arr.push(f)" size={arr.length} note={last ? (last.existed ? '같은 값이 또 들어감' : '끝에 추가') : ''}>
          {arr.map((f, i) => <Chip key={i} hot={i === arr.length - 1}>{i}: {f}</Chip>)}
        </Column>
        <Column title="Set" code="set.add(f)" size={set.size} note={last ? (last.existed ? '이미 있어서 무시' : '새 값 추가') : ''} warn={last?.existed}>
          {[...set].map((f) => <Chip key={f} hot={last?.fruit === f}>{f}</Chip>)}
        </Column>
        <Column title="Map" code="map.set(f, (map.get(f) ?? 0) + 1)" size={map.size} note={last ? (last.existed ? '같은 키의 값을 덮어씀' : '새 키 추가') : ''}>
          {[...map].map(([f, n]) => <Chip key={f} hot={last?.fruit === f}>{f} → {n}</Chip>)}
        </Column>
      </div>

      <p className={`mt-3 text-sm ${ui.muted}`}>
        {log.length === 0
          ? '과일을 눌러 보세요.'
          : <>Array는 <b>기록</b>을, Set은 <b>종류</b>를, Map은 <b>종류별 개수</b>를 남겼습니다. 나중에 무엇을 물어볼지에 따라 고르면 됩니다.</>}
      </p>
    </Viz>
  );
}

function Column({ title, code, size, note, warn, children }) {
  return (
    <div className={`${ui.box} min-w-0`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <span className="font-mono text-xs text-zinc-500">size {size}</span>
      </div>
      <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">{code}</p>
      <div className="mt-3 flex min-h-[2.5rem] flex-wrap gap-1.5">{children}</div>
      {note && <p className={`mt-2 text-xs ${warn ? ui.warn : ui.good}`}>{note}</p>}
    </div>
  );
}

function Chip({ hot, children }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs ${hot ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'}`}>
      {children}
    </span>
  );
}

// ───────────────── 시각화: 객체 키 ─────────────────
const OBJ_STEPS = [
  { code: "const kim = { name: '김' };\nconst lee = { name: '이' };", obj: [], map: [], desc: '두 사용자 객체를 만든다.' },
  { code: "store[kim] = '관리자';", obj: [['"[object Object]"', '관리자']], map: [['kim', '관리자']], desc: 'Object는 키를 문자열로 바꾼다. 객체는 "[object Object]"가 된다.' },
  { code: "store[lee] = '손님';", obj: [['"[object Object]"', '손님']], map: [['kim', '관리자'], ['lee', '손님']], desc: 'lee도 똑같이 "[object Object]"가 되어 kim의 값을 덮어썼다. Map은 객체 자체로 구분한다.' },
  { code: 'store[kim]  /  store.get(kim)', obj: [['"[object Object]"', '손님']], map: [['kim', '관리자'], ['lee', '손님']], desc: "Object에서 kim을 찾으면 '손님'이 나온다(틀림). Map은 '관리자'(맞음).", result: ['손님 (틀림)', '관리자 (맞음)'] },
];

function ObjectKeyViz() {
  const [i, setI] = useState(0);
  const s = OBJ_STEPS[i];
  return (
    <Viz>
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-100">{s.code}</pre>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[
          ['Object  (store = {})', s.obj, s.result?.[0], true],
          ['Map  (store = new Map())', s.map, s.result?.[1], false],
        ].map(([title, rows, result, bad]) => (
          <div key={title} className={`${ui.box} min-w-0`}>
            <p className="font-mono text-sm font-semibold">{title}</p>
            <div className="mt-2 space-y-1">
              {rows.length === 0 && <p className={`text-xs ${ui.muted}`}>비어 있음</p>}
              {rows.map(([k, v]) => (
                <p key={k} className="font-mono text-xs">{k} → {v}</p>
              ))}
            </div>
            {result && <p className={`mt-2 text-sm font-semibold ${bad ? ui.bad : ui.good}`}>결과: {result}</p>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm">{s.desc}</p>
      <div className="mt-3 flex gap-2">
        <button className={ui.btn} disabled={i === 0} onClick={() => setI(i - 1)}>이전</button>
        <button className={ui.btnPrimary} disabled={i === OBJ_STEPS.length - 1} onClick={() => setI(i + 1)}>다음 줄 실행</button>
      </div>
    </Viz>
  );
}

// ───────────────── 직접 해보기: 퀴즈 ─────────────────
const CHOICES = ['Map', 'Set', 'Array', 'Object'];
const QUIZ = [
  { q: '게시글에 붙은 태그 배열에서 중복을 없애고 싶다.', a: 'Set', why: '[...new Set(tags)] 한 줄. 값 하나씩, 중복 없음.' },
  { q: '목록에서 체크박스로 선택한 항목의 id들을 관리하고, 각 행마다 체크 여부를 확인한다.', a: 'Set', why: '행마다 has(id)로 빠르게 확인하고, add/delete로 토글한다. 중복이 생길 일도 없다.' },
  { q: '채팅 메시지에서 단어별로 몇 번 나왔는지 센다.', a: 'Map', why: '단어 → 개수 짝. 사용자가 입력한 단어가 "constructor" 같은 기본 키와 부딪히지 않는다.' },
  { q: '주문 목록을 그릴 때 userId로 사용자 이름을 계속 찾아야 한다.', a: 'Map', why: '사용자 배열을 한 번 Map(id → user)으로 만들어 두면 매번 find하지 않아도 된다.' },
  { q: '서버에 보낼 회원가입 데이터 { name, email, age }를 만든다.', a: 'Object', why: '키가 정해진 모양의 데이터이고 JSON으로 바로 보내야 한다. Map은 JSON.stringify하면 {}가 된다.' },
  { q: '최근 검색어를 검색한 순서대로 10개까지 보여 준다. (같은 검색어를 또 하면 맨 앞으로)', a: 'Array', why: '보여 줄 순서와 인덱스가 중요하다. 넣을 때 기존 것을 filter로 빼고 맨 앞에 넣는다. (Set으로 중복을 먼저 걸러도 결국 순서 조작은 배열이 편하다)' },
  { q: '각 DOM 요소별로 툴팁 열림 상태를 저장하고, 요소가 사라지면 정보도 사라지게 하고 싶다.', a: 'Map', why: '객체(DOM 요소)를 키로 쓰는 건 Map이 할 수 있다. 메모리까지 신경 쓰면 WeakMap이 정답에 더 가깝다.' },
  { q: '그래프 탐색(BFS)에서 이미 방문한 노드인지 확인한다.', a: 'Set', why: '"이미 봤나?"만 확인하면 되므로 Set의 has/add.' },
];

function Quiz() {
  const [answers, setAnswers] = useState({});
  const score = QUIZ.filter((item, i) => answers[i] === item.a).length;
  const done = Object.keys(answers).length;

  return (
    <Demo hint="각 상황에서 가장 알맞은 자료구조를 골라 보세요. 고르면 바로 이유가 나옵니다.">
      <ol className="space-y-4">
        {QUIZ.map((item, i) => {
          const picked = answers[i];
          const right = picked === item.a;
          return (
            <li key={i} className={`${ui.box} min-w-0`}>
              <p className="text-sm font-semibold">{i + 1}. {item.q}</p>
              <div className="mt-2">
                <Segmented
                  value={picked}
                  onChange={(v) => setAnswers({ ...answers, [i]: v })}
                  options={CHOICES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              {picked && (
                <p className={`mt-2 text-sm ${right ? ui.good : ui.bad}`}>
                  {right ? '정답! ' : `아쉬워요. 정답은 ${item.a}. `}
                  <span className="text-zinc-600 dark:text-zinc-300">{item.why}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center gap-3">
        <p className="text-sm font-semibold">{done} / {QUIZ.length} 풀었고, {score}개 맞혔어요.</p>
        {done > 0 && <button className={ui.btn} onClick={() => setAnswers({})}>다시 풀기</button>}
      </div>
    </Demo>
  );
}

// ───────────────── 직접 해보기: 속도 ─────────────────
function SpeedTest() {
  const [n, setN] = useState(50000);
  const [result, setResult] = useState(null);

  const run = () => {
    const arr = Array.from({ length: n }, (_, i) => i);
    const set = new Set(arr);
    const lookups = 2000;
    // 끝쪽 값을 찾아야 includes가 배열을 거의 다 훑는다
    const targets = Array.from({ length: lookups }, (_, i) => n - 1 - (i % 100));

    let hit = 0;
    let t = performance.now();
    for (const x of targets) if (arr.includes(x)) hit++;
    const includesMs = performance.now() - t;

    t = performance.now();
    for (const x of targets) if (set.has(x)) hit++;
    const hasMs = performance.now() - t;

    setResult({ n, lookups, includesMs, hasMs, hit });
  };

  return (
    <Demo hint="요소 개수를 정하고 실행해 보세요. 배열 끝쪽 값 2,000개를 찾는 시간을 비교합니다. (실행 중 잠깐 멈출 수 있어요)">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Segmented
          value={n}
          onChange={setN}
          options={[1000, 10000, 50000, 200000].map((v) => ({ value: v, label: v.toLocaleString() + '개' }))}
        />
        <button className={ui.btnPrimary} onClick={run}>실행</button>
      </div>
      {result && (
        <div className="mt-4 space-y-2">
          {[
            ['arr.includes(x)', result.includesMs],
            ['set.has(x)', result.hasMs],
          ].map(([label, ms]) => {
            const max = Math.max(result.includesMs, result.hasMs, 0.01);
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-32 flex-none font-mono text-xs">{label}</span>
                <div className="h-4 min-w-0 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-4 rounded bg-indigo-500" style={{ width: `${Math.max((ms / max) * 100, 1)}%` }} />
                </div>
                <span className="w-20 flex-none text-right font-mono text-xs">{ms.toFixed(2)}ms</span>
              </div>
            );
          })}
          <p className={`text-xs ${ui.muted}`}>
            {result.n.toLocaleString()}개 중에서 {result.lookups.toLocaleString()}번 찾기. Set을 만드는 데도 시간이 들기 때문에, 한두 번만 찾는다면 배열로도 충분합니다. <b>같은 목록에서 여러 번 찾을 때</b> Set이 이깁니다.
          </p>
        </div>
      )}
    </Demo>
  );
}
