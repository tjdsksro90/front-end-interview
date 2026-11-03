import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

const TIMELINE = [
  { v: '16.0', date: '2017.09', title: 'Fiber', desc: '렌더링 엔진(재조정 알고리즘)을 새로 작성. 작업을 쪼개서 우선순위를 줄 수 있는 구조의 시작. Fragment·Portal·Error Boundary.' },
  { v: '16.3', date: '2018.03', title: '새 Context API', desc: 'createContext, createRef, forwardRef. getDerivedStateFromProps 추가, componentWillMount 등은 UNSAFE_로 변경.' },
  { v: '16.6', date: '2018.10', title: 'memo · lazy · Suspense', desc: 'React.memo, React.lazy와 코드 스플리팅용 Suspense.' },
  { v: '16.8', date: '2019.02', title: 'Hooks', major: true, desc: 'useState, useEffect 등. 함수 컴포넌트로 상태와 생명주기를 다룰 수 있게 되며 클래스 컴포넌트 시대가 끝남.' },
  { v: '17', date: '2020.10', title: '새 기능 없는 디딤돌', desc: '새 JSX 변환(import React 없이 JSX), 이벤트 위임 위치를 document → root로 변경, 이벤트 풀링 제거. 점진적 업그레이드가 목적.' },
  { v: '18', date: '2022.03', title: '동시성 렌더링', major: true, desc: 'createRoot, 자동 배칭, useTransition·useDeferredValue, Suspense 스트리밍 SSR, useId, useSyncExternalStore.', to: 'react-18' },
  { v: '19', date: '2024.12', title: 'Actions · Server Components', major: true, desc: 'useActionState, useOptimistic, useFormStatus, use(), ref를 prop으로, 메타데이터 태그, Server Components 정식.', to: 'react-19' },
  { v: '19.2', date: '2025.10', title: 'Activity · useEffectEvent', desc: '<Activity>로 숨긴 화면의 state 유지, useEffectEvent, React Performance 트랙. 같은 달 React Compiler 1.0.' },
  { v: '19.3', date: '2026.09', title: 'View Transition', desc: '<ViewTransition>으로 화면 전환 애니메이션, Fragment ref.' },
];

export default function ReactVersions() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          React는 <u>16.8에서 Hooks</u>로 작성 방식이 바뀌었고, <u>18에서 동시성 렌더링</u>으로 렌더링 엔진의 동작이 바뀌었고,
          <u>19에서 Actions와 Server Components</u>로 비동기·서버까지 기본 기능이 넓어졌습니다. 17은 새 기능 없이 업그레이드를 쉽게 하기 위한 버전입니다.
        </OneLiner>

        <H3>버전 타임라인</H3>
        <ol className="relative space-y-4 border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
          {TIMELINE.map((t) => (
            <li key={t.v} className="relative">
              <span className={`absolute top-1.5 -left-[31px] h-3 w-3 rounded-full ${t.major ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:bg-indigo-400 dark:ring-indigo-500/20' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm font-bold">React {t.v}</span>
                <span className="text-xs text-zinc-400">{t.date}</span>
                <span className="font-semibold">{t.title}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {t.desc}
                {t.to && <> <Link className={linkCls} to={`/react/react-versions/deep/${t.to}`}>자세히 →</Link></>}
              </p>
            </li>
          ))}
        </ol>

        <H3>면접에서 자주 묻는 비교</H3>
        <Table
          head={['', '무엇이 바뀌었나', '개발자에게 달라진 점']}
          rows={[
            ['16.8 Hooks', '함수 컴포넌트가 state·생명주기를 가짐', 'class·this·HOC 대신 커스텀 훅으로 로직 재사용'],
            ['17', 'JSX 변환, 이벤트 위임 위치', <>파일마다 <Code>import React</Code> 불필요. 여러 React 버전이 한 페이지에 공존 가능</>],
            ['18', '렌더링을 중단·재개 가능 (동시성)', <><Code>createRoot</Code>로 교체. 자동 배칭. 개발 모드에서 effect 두 번 실행(Strict Mode)</>],
            ['19', '비동기 액션·서버 컴포넌트가 기본 기능', <>폼 상태 코드 감소, <Code>forwardRef</Code> 불필요, <Code>ReactDOM.render</Code>·propTypes 삭제</>],
          ]}
        />

        <Callout type="tip" title="면접 포인트">
          <p>"사용 중인 React 버전이 무엇이냐"는 질문 뒤에는 보통 "그 버전에서 바뀐 점"이 따라옵니다. 18이면 <b>자동 배칭과 동시성(useTransition)</b>, 19면 <b>Actions(useActionState·useOptimistic)와 Server Components</b>를 한 문장씩 말할 수 있으면 충분합니다.</p>
          <p>React Compiler는 React 버전이 아니라 별도 빌드 도구라는 점도 구분해서 말하세요. (<Link className={linkCls} to="/react/use-memo-use-callback/deep/react-compiler">React Compiler 심화</Link>)</p>
        </Callout>
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: '프로젝트의 React 버전', path: ['package.json', 'dependencies', 'react'], what: '"^19.1.0"이면 19.x 최신 버전까지 설치됨. 실제 설치 버전은 npm ls react.' },
            { where: '실행 중인 페이지의 React 버전', path: ['F12', 'Components (React DevTools)', '설정(톱니)'], what: '또는 앱 코드에서 import { version } from "react"로 출력.' },
            { where: '업그레이드할 때 바꿀 코드', path: ['npx codemod@latest react/19/migration-recipe'], what: '공식 codemod가 ReactDOM.render, 문자열 ref 같은 삭제된 API를 자동으로 바꿔 준다.' },
            { where: '18부터 effect가 두 번 실행되는 이유', path: ['F12', 'Console'], what: '개발 모드 + StrictMode일 때만 마운트→언마운트→마운트. 배포 빌드에서는 한 번.' },
          ]}
        />
        <Screen title="React 18+ 개발 모드 Console (StrictMode)" dark>
          <div className="space-y-1 p-4 font-mono text-xs">
            <div className="text-zinc-300">effect 실행: 채팅 서버 연결</div>
            <div className="text-zinc-500">cleanup: 연결 끊기</div>
            <div className="text-zinc-300">effect 실행: 채팅 서버 연결</div>
            <div className="mt-2 text-zinc-500">// cleanup을 안 만들었다면 연결이 2개 남는 버그가 여기서 드러난다</div>
          </div>
        </Screen>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="16.8 이전 → 이후: 클래스에서 Hooks로"
          code={`
// ~16.7
class Counter extends React.Component {
  state = { count: 0 };
  componentDidMount() { document.title = this.state.count; }
  componentDidUpdate() { document.title = this.state.count; }
  render() {
    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>{this.state.count}</button>;
  }
}

// 16.8~
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = count; }, [count]);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`}
        />
        <CodeBlock
          title="17: 새 JSX 변환"
          code={`
// ~16: JSX가 React.createElement로 바뀌어서 import가 필수
import React from 'react';
const el = <h1>안녕</h1>;   // → React.createElement('h1', null, '안녕')

// 17~: 컴파일러가 jsx 함수를 자동으로 import
const el = <h1>안녕</h1>;   // → import { jsx as _jsx } from 'react/jsx-runtime'`}
        />
        <CodeBlock
          title="18: 루트 API · 19: 삭제된 API 정리"
          code={`
// ~17
ReactDOM.render(<App />, root);
ReactDOM.hydrate(<App />, root);

// 18~ (19에서는 위 두 함수가 삭제됨)
createRoot(root).render(<App />);
hydrateRoot(root, <App />);`}
        />
        <List
          items={[
            <>18의 자세한 내용과 자동 배칭 데모: <Link className={linkCls} to="/react/react-versions/deep/react-18">React 18 심화</Link></>,
            <>19의 Actions·useOptimistic 데모: <Link className={linkCls} to="/react/react-versions/deep/react-19">React 19 심화</Link></>,
          ]}
        />
      </Section>
    </>
  );
}
