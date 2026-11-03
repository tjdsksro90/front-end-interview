import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Legend, Toggle, RenderBadge, useRenderCount, Stat, ui,
} from '../components/kit.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

export default function ReactCompiler() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React Compiler는 <u>빌드 시점에 컴포넌트 코드를 분석해서 useMemo·useCallback·React.memo가 하던 메모이제이션을 자동으로 넣어주는 도구</u>입니다.
          개발자는 평범하게 코드를 쓰고, 컴파일러가 "이 값은 이 입력이 같으면 재사용해도 된다"를 판단해 캐시 코드로 바꿔 줍니다.
        </OneLiner>

        <H3>왜 나왔나?</H3>
        <List
          items={[
            <>React는 부모가 렌더되면 자식도 다시 렌더하고, 렌더할 때마다 함수 안의 객체·함수를 새로 만든다. 그래서 지금까지는 <Code>memo</Code>, <Code>useMemo</Code>, <Code>useCallback</Code>을 <b>사람이 직접</b> 골라서 넣어야 했다. (<Link className={linkCls} to="/react/use-memo-use-callback/deep/memo-usememo">React.memo & useMemo 심화</Link>)</>,
            <>문제는 ① 어디에 넣어야 하는지 판단이 어렵고 ② 의존성 배열을 틀리기 쉽고 ③ 코드가 지저분해진다는 것.</>,
            <>컴파일러는 이 판단을 <b>기계가 대신</b> 한다. 사람이 놓친 곳까지, 그리고 사람이 Hook으로는 못 하는 곳(조건문 뒤, early return 뒤)까지 메모이제이션한다.</>,
          ]}
        />

        <H3>어떻게 동작하나?</H3>
        <List
          items={[
            <><b>Babel 플러그인</b>(<Code>babel-plugin-react-compiler</Code>)이다. 런타임 라이브러리가 아니라 <b>빌드할 때 코드를 바꿔 주는</b> 것.</>,
            <>컴포넌트마다 작은 캐시 배열(<Code>const $ = _c(7)</Code>)을 만들고, 값마다 "입력이 이전과 같은지" 비교해서 같으면 캐시된 값을 쓴다.</>,
            <>JSX도 캐시한다. 자식 JSX가 이전과 같은 객체면 React가 그 자식의 렌더를 건너뛴다 → <b>memo로 감싸지 않아도 자식 리렌더가 줄어든다.</b></>,
            <>React의 규칙(렌더는 순수해야 함, props·state를 직접 바꾸지 않음, Hook 규칙)을 지킨 코드만 최적화한다. 규칙을 어긴 컴포넌트는 <b>건너뛰고 원래대로 둔다</b>(에러를 내지 않음).</>,
          ]}
        />

        <Table
          head={['', '직접 메모이제이션', 'React Compiler']}
          rows={[
            ['누가 넣나', '개발자가 판단해서', '빌드 도구가 자동으로'],
            ['단위', '값·함수·컴포넌트 단위로 골라서', '컴포넌트 안의 값·JSX 하나하나 세밀하게'],
            ['조건문 뒤', '못 씀 (Hook은 최상단에서만)', '가능'],
            ['의존성 배열', '직접 작성, 틀리면 버그', '컴파일러가 분석'],
            ['적용 범위', '넣은 곳만', '규칙을 지킨 모든 컴포넌트·Hook'],
          ]}
        />

        <H3>버전과 도입 현황</H3>
        <List
          items={[
            <>2025년 10월 <b>1.0 정식 출시</b>. React 19에는 런타임(<Code>react/compiler-runtime</Code>)이 내장돼 있고, React 17·18은 <Code>react-compiler-runtime</Code> 패키지를 추가하면 쓸 수 있다.</>,
            <>Next.js 16부터 <Code>reactCompiler: true</Code> 옵션이 정식 지원. Vite는 <Code>@vitejs/plugin-react</Code>의 babel 옵션에 플러그인을 넣는다.</>,
            <>eslint-plugin-react-hooks의 recommended 규칙에 컴파일러가 최적화 못 하는 코드를 알려주는 규칙들이 포함돼 있다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>새 프로젝트</b> — 처음부터 켜 두면 memo·useMemo·useCallback을 거의 안 써도 된다</>,
            '렌더 성능 문제가 여기저기 흩어져 있어서 손으로 하나씩 메모이제이션하기 힘든 프로젝트',
            '팀원마다 메모이제이션 기준이 달라 코드가 들쭉날쭉할 때 — 기준을 도구로 통일',
          ]}
          avoid={[
            '규칙을 많이 어긴 오래된 코드에 한 번에 전체 적용 — 디렉터리 단위나 "use memo" 지시어로 점진적으로',
            <>이미 있는 useMemo·useCallback을 급하게 지우기 — 컴파일러와 같이 써도 문제없다. 특히 <b>useEffect 의존성</b>으로 쓰이는 값은 동작이 바뀔 수 있으니 테스트 후에</>,
            '"컴파일러가 있으니 렌더 비용은 신경 안 써도 된다" — 무거운 계산 자체가 빨라지는 건 아니고, 다시 하지 않게 해줄 뿐',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"React Compiler는 빌드 타임에 자동 메모이제이션을 해주는 도구라서, 새 코드에서는 useMemo·useCallback을 직접 쓸 일이 크게 줄었다. 다만 React 규칙을 지킨 코드만 최적화하고, effect 의존성처럼 값의 참조를 정확히 제어해야 하는 곳은 여전히 useMemo를 탈출구(escape hatch)로 쓴다."</p>
          <p>"그래서 memo 원리를 몰라도 되는 게 아니라, 컴파일러가 왜 이 컴포넌트를 건너뛰었는지 이해하려면 원리를 알아야 한다"까지 말하면 좋습니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>컴파일러가 만든 코드는 컴포넌트마다 <b>캐시 칸($ 배열)</b>을 두고, 칸마다 "무엇이 바뀌면 다시 계산하는지"를 기억합니다. 어떤 값이 바뀌었을 때 어느 칸이 다시 계산되는지 눌러 보세요.</p>
        <CacheViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '컴파일러 없이 (직접 메모이제이션)',
            code: `
const List = memo(function List({ items, onSelect }) { /* ... */ });

function ProductList({ products, keyword }) {
  const visible = useMemo(
    () => products.filter((p) => p.name.includes(keyword)),
    [products, keyword]
  );
  const onSelect = useCallback((id) => {
    console.log(id);
  }, []);

  return <List items={visible} onSelect={onSelect} />;
}`,
            note: '어디에 memo·useMemo·useCallback을 넣을지, 의존성 배열에 무엇을 넣을지 사람이 판단해야 한다.',
          }}
          after={{
            label: '컴파일러 사용 (그냥 작성)',
            code: `
function List({ items, onSelect }) { /* ... */ }

function ProductList({ products, keyword }) {
  const visible = products.filter((p) => p.name.includes(keyword));
  const onSelect = (id) => console.log(id);

  return <List items={visible} onSelect={onSelect} />;
}`,
            note: '평범한 코드. 빌드할 때 컴파일러가 왼쪽과 같은(더 세밀한) 메모이제이션을 넣어 준다.',
          }}
        />

        <H3>실제로 컴파일된 결과</H3>
        <p>오른쪽 코드를 <Code>babel-plugin-react-compiler</Code> 1.0으로 실제 컴파일한 결과입니다.</p>
        <CodeBlock
          title="컴파일 결과 (babel-plugin-react-compiler 1.0)"
          code={`
import { c as _c } from "react/compiler-runtime";
function ProductList(t0) {
  const $ = _c(7);                         // 이 컴포넌트용 캐시 칸 7개
  const { products, keyword } = t0;
  let t1;
  if ($[0] !== keyword || $[1] !== products) {   // useMemo([products, keyword])와 같은 역할
    let t2;
    if ($[3] !== keyword) {                       // filter에 넘기는 화살표 함수도 따로 캐시
      t2 = (p) => p.name.includes(keyword);
      $[3] = keyword;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    t1 = products.filter(t2);
    $[0] = keyword;
    $[1] = products;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const visible = t1;
  const onSelect = _temp;                  // 바깥 값을 안 쓰는 함수는 컴포넌트 밖으로 꺼냄 (useCallback 불필요)
  let t2;
  if ($[5] !== visible) {                  // JSX도 캐시 → 같은 객체면 List 렌더를 건너뜀 (memo 불필요)
    t2 = <List items={visible} onSelect={onSelect} />;
    $[5] = visible;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}
function _temp(id) {
  return console.log(id);
}`}
        />

        <H3>설정</H3>
        <CodeBlock
          title="next.config.ts (Next.js 16+)"
          code={`
const nextConfig = {
  reactCompiler: true,
};
export default nextConfig;`}
        />
        <CodeBlock
          title="vite.config.js (이 사이트의 설정)"
          code={`
react({
  babel: {
    // 'annotation': "use memo"를 적은 함수만 컴파일 (점진 도입용). 빼면 전체 적용
    plugins: [['babel-plugin-react-compiler', { compilationMode: 'annotation' }]],
  },
}),`}
        />

        <Callout type="warn" title="컴파일러가 건너뛰는 코드 (규칙 위반)">
          <CodeBlock
            code={`
function Profile({ user }) {
  user.name = user.name.trim();   // props를 직접 수정 → 규칙 위반, 이 컴포넌트는 최적화 안 됨
  const t = Date.now();            // 렌더마다 결과가 다른 값 → 순수하지 않음
  return <p>{user.name}</p>;
}

function Legacy() {
  "use no memo";                   // 문제가 있으면 이 컴포넌트만 컴파일에서 제외
  // ...
}`}
          />
          <p>eslint-plugin-react-hooks를 켜 두면 이런 코드를 편집기에서 바로 알려줍니다.</p>
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <CompilerDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const SLOTS = [
  { slot: '$[0..2]', what: 'visible = products.filter(...)', deps: ['products', 'keyword'] },
  { slot: '$[3..4]', what: '(p) => p.name.includes(keyword)', deps: ['keyword'] },
  { slot: '$[5..6]', what: '<List items={visible} />', deps: ['visible'] },
];

function CacheViz() {
  const [changed, setChanged] = useState(null);

  // visible은 products나 keyword가 바뀌면 같이 바뀐다
  const dirty = (deps) =>
    changed && (deps.includes(changed) || (deps.includes('visible') && ['products', 'keyword'].includes(changed)));

  return (
    <Viz>
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ['keyword', 'keyword 변경'],
          ['products', 'products 변경'],
          ['other', '부모의 관련 없는 state 변경'],
        ].map(([key, label]) => (
          <button key={key} className={changed === key ? ui.btnPrimary : ui.btn} onClick={() => setChanged(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="min-w-[460px] space-y-2">
        {SLOTS.map((s) => {
          const status = !changed ? 'idle' : dirty(s.deps) ? 'miss' : 'hit';
          return (
            <div
              key={`${s.slot}${changed}`}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 ${
                status === 'miss'
                  ? 'animate-flash border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                  : status === 'hit'
                    ? 'border-dashed border-emerald-500'
                    : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              <span className="w-20 flex-none font-mono text-xs text-zinc-400">{s.slot}</span>
              <span className="flex-1 font-mono text-sm">{s.what}</span>
              <span className="font-mono text-xs text-zinc-400">deps: {s.deps.join(', ')}</span>
              {status === 'miss' && <span className={`text-xs font-bold ${ui.warn}`}>다시 계산</span>}
              {status === 'hit' && <span className={`text-xs font-bold ${ui.good}`}>캐시 사용</span>}
            </div>
          );
        })}
      </div>
      <Legend items={[['bg-amber-300', '입력이 바뀌어 다시 계산'], ['border-2 border-dashed border-emerald-500', '입력이 같아 캐시 사용']]} />
      {changed && (
        <p className={`mt-3 text-sm ${ui.muted}`}>
          {changed === 'keyword' && '→ keyword를 쓰는 칸은 전부 다시 계산되고, visible이 바뀌었으니 JSX도 새로 만든다 → List가 렌더된다.'}
          {changed === 'products' && '→ filter 결과는 다시 계산하지만, keyword만 쓰는 화살표 함수는 캐시를 그대로 쓴다. 사람이 useMemo로는 잘 안 나누는 단위까지 나뉜다.'}
          {changed === 'other' && '→ 모든 칸이 캐시를 쓴다. JSX도 이전과 같은 객체라서 React는 List 렌더를 건너뛴다. memo로 감싸지 않았는데도.'}
        </p>
      )}
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const PRODUCTS = ['React 입문', 'React 심화', 'Vue 입문', 'Next.js 실전', 'TypeScript 핸드북', 'Node.js 서버'];

function CompilerDemo() {
  const [on, setOn] = useState(true);
  return (
    <Demo hint="두 패널 모두 똑같은 코드이고, 오른쪽만 함수 첫 줄에 &quot;use memo&quot;가 있어 이 사이트의 빌드에서 실제로 React Compiler를 거쳤습니다. '관련 없는 state 변경'을 눌러 자식 렌더 횟수를 비교해 보세요.">
      <Callout title="자식 컴포넌트(ProductRows)는 양쪽 다 memo로 감싸지 않았어요">
        <p>
          왼쪽은 부모가 렌더될 때마다 자식도 렌더됩니다. 오른쪽은 컴파일러가 자식 JSX를 캐시해서, props와 관련 없는 변경이면 자식 렌더를 건너뜁니다.
          검색어를 바꾸면 양쪽 다 자식이 렌더되는 게 정상입니다.
        </p>
      </Callout>
      <div className="mt-4 mb-4">
        <Toggle checked={on} onChange={setOn} label="오른쪽 패널 보이기" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PlainParent />
        {on && <CompiledParent />}
      </div>
    </Demo>
  );
}

// 컴파일러를 거치지 않는 부모
function PlainParent() {
  const [keyword, setKeyword] = useState('');
  const [other, setOther] = useState(0);
  const visible = PRODUCTS.filter((p) => p.toLowerCase().includes(keyword.toLowerCase()));
  return (
    <ParentView title="컴파일러 없음" code="function Parent() { ... }" keyword={keyword} setKeyword={setKeyword} other={other} setOther={setOther}>
      <ProductRows items={visible} />
    </ParentView>
  );
}

// 같은 코드에 "use memo"만 추가 → vite.config.js의 React Compiler(annotation 모드)가 이 함수만 컴파일한다
function CompiledParent() {
  'use memo';
  const [keyword, setKeyword] = useState('');
  const [other, setOther] = useState(0);
  const visible = PRODUCTS.filter((p) => p.toLowerCase().includes(keyword.toLowerCase()));
  return (
    <ParentView title="React Compiler 적용" code={'function Parent() { "use memo"; ... }'} keyword={keyword} setKeyword={setKeyword} other={other} setOther={setOther}>
      <ProductRows items={visible} />
    </ParentView>
  );
}

function ParentView({ title, code, keyword, setKeyword, other, setOther, children }) {
  const renders = useRenderCount();
  return (
    <div className={ui.box}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <RenderBadge count={renders} />
      </div>
      <code className="mt-1 block font-mono text-xs text-zinc-400">{code}</code>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className={ui.btnPrimary} onClick={() => setOther((o) => o + 1)}>관련 없는 state 변경 ({other})</button>
        <input className={`${ui.input} w-36`} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="검색어" aria-label="검색어" />
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ProductRows({ items }) {
  const renders = useRenderCount();
  return (
    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold">ProductRows (memo 없음)</span>
        <RenderBadge count={renders} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="표시 중인 상품" value={`${items.length}개`} />
        <Stat label="자식 렌더" value={`${renders}회`} tone={renders > 3 ? 'bad' : 'good'} />
      </div>
      <ul className={`mt-2 text-xs ${ui.muted}`}>
        {items.map((p) => <li key={p}>{p}</li>)}
      </ul>
    </div>
  );
}
