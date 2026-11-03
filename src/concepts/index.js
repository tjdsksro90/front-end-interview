import { lazy } from 'react';

// 심화 페이지: 기본 답변(md)에 더해 시각화·코드 비교·직접 해보기가 필요한 개념만 따로 만든다.
// parent에 연결할 md 질문을 지정하면 목록과 질문 페이지에 '심화' 선택지로 나타난다.
// 페이지는 React.lazy로 불러와서, 들어갈 때 해당 페이지 코드만 다운로드된다.
const MEMO = { categoryId: 'react', slug: 'use-memo-use-callback' };
const OPTIMIZATION = { categoryId: 'react', slug: 'in-react-optimization' };
const BUNDLER = { categoryId: 'web', slug: 'bundler-tarnspiler' };
const PROJECT_OPTI = { categoryId: 'project', slug: 'project-opti' };

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
  {
    slug: 'webpack',
    parent: BUNDLER,
    title: 'Webpack',
    summary: '흩어진 모듈을 의존성 그래프로 엮어 브라우저용 번들로 만드는 번들러',
    tags: ['webpack', '번들러', 'loader', 'plugin', 'entry', 'output', '의존성 그래프', 'Vite'],
    Component: lazy(() => import('./Webpack.jsx')),
  },
  {
    slug: 'tree-shaking',
    parent: BUNDLER,
    title: 'Tree Shaking',
    summary: '실제로 import해서 쓰지 않는 코드를 번들에서 털어낸다',
    tags: ['tree shaking', '트리 쉐이킹', 'ESM', 'sideEffects', 'dead code', 'lodash-es', '번들 크기'],
    Component: lazy(() => import('./TreeShaking.jsx')),
  },
  {
    slug: 'code-splitting',
    parent: PROJECT_OPTI,
    title: 'Code Splitting',
    summary: '하나의 큰 번들을 여러 청크로 나눠 필요한 것만, 캐시는 오래 쓰게 한다',
    tags: ['code splitting', '코드 분할', '코드 스플리팅', 'chunk', '청크', 'vendor', 'splitChunks', '캐싱'],
    Component: lazy(() => import('./CodeSplitting.jsx')),
  },
  {
    slug: 'dynamic-import',
    parent: PROJECT_OPTI,
    title: 'Dynamic Import',
    summary: 'import()로 모듈을 실행 중에 필요할 때 불러온다',
    tags: ['dynamic import', '동적 import', 'import()', 'prefetch', 'preload', 'next/dynamic', '지연 로딩'],
    Component: lazy(() => import('./DynamicImport.jsx')),
  },
  {
    slug: 'bundle-analyzer',
    parent: PROJECT_OPTI,
    title: 'Bundle Analyzer',
    summary: '번들 안에 무엇이 얼마나 들어있는지 트리맵으로 보고 줄일 곳을 찾는다',
    tags: ['bundle analyzer', 'webpack-bundle-analyzer', '@next/bundle-analyzer', 'rollup-plugin-visualizer', '트리맵', '번들 크기', '청크 최적화'],
    Component: lazy(() => import('./BundleAnalyzer.jsx')),
  },
  {
    slug: 'nextjs-image',
    parent: PROJECT_OPTI,
    title: 'Next.js Image Optimization',
    summary: 'next/image로 크기 조절·포맷 변환·lazy loading·반응형 이미지·CLS 방지를 자동으로',
    tags: ['next/image', '이미지 최적화', 'lazy loading', 'responsive image', 'srcset', 'sizes', 'WebP', 'AVIF', 'CLS', 'LCP', 'priority'],
    Component: lazy(() => import('./NextImage.jsx')),
  },
];
