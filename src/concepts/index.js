import { lazy } from 'react';

// 심화 페이지: 기본 답변(md)에 더해 시각화·코드 비교·직접 해보기가 필요한 개념만 따로 만든다.
// parent에 연결할 md 질문을 지정하면 목록과 질문 페이지에 '심화' 선택지로 나타난다.
// 페이지는 React.lazy로 불러와서, 들어갈 때 해당 페이지 코드만 다운로드된다.
const MEMO = { categoryId: 'react', slug: 'use-memo-use-callback' };
const OPTIMIZATION = { categoryId: 'react', slug: 'in-react-optimization' };

export const deepDives = [
  {
    slug: 'memo-usememo',
    parent: MEMO,
    title: 'React.memo & useMemo',
    summary: '같은 입력이면 이전 결과를 재사용한다 — 컴포넌트 단위(memo) vs 값 단위(useMemo)',
    tags: ['memo', 'useMemo', '메모이제이션', '리렌더링', '최적화', '얕은 비교'],
    Component: lazy(() => import('./MemoUseMemo.jsx')),
  },
  {
    slug: 'usecallback',
    parent: MEMO,
    title: 'useCallback',
    summary: '함수의 참조(주소)를 고정해서 memo된 자식의 불필요한 리렌더를 막는다',
    tags: ['useCallback', '함수 참조', '메모이제이션', '리렌더링', '최적화', '의존성 배열'],
    Component: lazy(() => import('./UseCallback.jsx')),
  },
  {
    slug: 'react-lazy',
    parent: OPTIMIZATION,
    title: 'React.lazy',
    summary: '컴포넌트 코드를 별도 파일(청크)로 쪼개서 필요할 때 불러온다',
    tags: ['lazy', '코드 스플리팅', 'code splitting', 'dynamic import', '번들', '초기 로딩'],
    Component: lazy(() => import('./ReactLazy.jsx')),
  },
  {
    slug: 'suspense',
    parent: OPTIMIZATION,
    title: 'Suspense',
    summary: '아직 준비 안 된 UI 대신 fallback을 보여주는 "로딩 경계"',
    tags: ['Suspense', 'fallback', '로딩', '비동기', 'use', '데이터 패칭'],
    Component: lazy(() => import('./SuspensePage.jsx')),
  },
  {
    slug: 'virtualized-list',
    parent: OPTIMIZATION,
    title: 'Virtualized List',
    summary: '긴 목록에서 화면에 보이는 행만 DOM으로 그린다',
    tags: ['가상화', 'virtualization', 'windowing', 'react-window', '긴 목록', '무한 스크롤', 'DOM'],
    Component: lazy(() => import('./VirtualizedList.jsx')),
  },
  {
    slug: 'concurrent-mode',
    parent: OPTIMIZATION,
    title: 'Concurrent Mode (동시성 렌더링)',
    summary: '렌더링을 중단·재개할 수 있게 해서 급한 업데이트(입력)를 먼저 처리한다',
    tags: ['Concurrent', '동시성', 'useTransition', 'useDeferredValue', 'startTransition', '우선순위', 'React 18'],
    Component: lazy(() => import('./ConcurrentMode.jsx')),
  },
];

