# Q : next.config.ts의 cacheComponents, partialPrefetching, turbopack.rules는 각각 무슨 설정일까요?

<br />

# A : cacheComponents는 데이터를 기본적으로 매 요청마다 새로 가져오게 하고, 캐시할 부분만 "use cache"로 골라 담게 하는 캐싱 방식입니다. partialPrefetching은 링크를 미리 받아올 때 경로마다 공통 껍데기(App Shell)만 한 번 받아오게 하는 설정입니다. turbopack.rules는 Turbopack 번들러가 특정 파일(예: .svg)을 어떤 로더로 변환할지 정하는 규칙입니다.

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.svg': { loaders: ['@svgr/webpack'], as: '*.js' },
    },
  },
};

export default nextConfig;
```

### 1. cacheComponents — 캐시는 직접 고르고, 페이지는 정적 + 동적으로 나눠 보낸다

- Next.js 16에서 정식이 된 옵션이다. 예전의 `experimental.ppr`, `experimental.dynamicIO`, `experimental.useCache`를 하나로 합쳤다.
- **기본이 동적**: 켜면 데이터 요청은 기본적으로 요청할 때마다 실행된다. 캐시하고 싶은 페이지·컴포넌트·함수에만 `'use cache'`를 붙인다. (Next.js 14까지는 반대로 fetch가 기본으로 캐시되어서 "왜 데이터가 안 바뀌지?" 하는 혼란이 많았다)
- **Partial Prerendering(PPR)이 기본 동작**: 한 페이지 안에서 변하지 않는 부분은 빌드할 때 미리 HTML로 만들어 바로 보내고, 요청마다 달라지는 부분은 `<Suspense>`로 감싸서 준비되는 대로 이어서 보낸다(스트리밍).
- 함께 쓰는 것: `cacheLife('hours')`로 캐시 유지 시간, `cacheTag('posts')`로 이름표를 붙이고 `revalidateTag`·`updateTag`로 갱신한다.
- 페이지를 이동할 때 이전 페이지를 바로 지우지 않고 React `<Activity>`로 숨겨 둬서, 뒤로 가면 입력값이나 펼친 상태가 그대로 남아 있다.

```tsx
async function getPosts() {
  'use cache';
  cacheLife('hours');
  cacheTag('posts');
  return db.post.findMany();
}

export default function Page() {
  return (
    <>
      <PostList />                          {/* 캐시된 부분 → 미리 만든 HTML에 포함 */}
      <Suspense fallback={<p>로딩…</p>}>
        <MyCart />                          {/* cookies()를 읽는 동적 부분 → 나중에 스트리밍 */}
      </Suspense>
    </>
  );
}
```

### 2. partialPrefetching — 링크 미리 받기를 "경로당 한 번"으로

- Next.js 16.3에서 추가됐고, **cacheComponents가 켜져 있어야** 쓸 수 있다. 없으면 `next dev`, `next build`가 설정 검사에서 실패한다.
- 기존: 화면에 보이는 `<Link>`마다 그 주소의 내용을 미리 받아왔다. 상품 링크가 50개면 미리 받기 요청도 50개.
- 켜면: 같은 경로(`/products/[id]`)의 링크들은 **주소와 상관없는 공통 껍데기(App Shell) 하나**만 받아서 같이 쓴다. `params`, `searchParams`에 따라 달라지는 내용은 이동한 뒤에 받아온다.
- 특정 링크만 내용까지 미리 받고 싶으면 `<Link prefetch={true}>`를 쓴다. 경로 단위로는 `export const prefetch = ...`로 바꿀 수 있다.
- 지금은 설정하지 않으면 `false`처럼 동작하면서 경고가 뜬다. 공식 문서에 따르면 다음 메이저 버전에서는 cacheComponents와 함께 기본으로 켜지고 옵션이 사라질 예정이다.

### 3. turbopack.rules — 파일 종류별 변환 규칙

- Turbopack은 Next.js의 기본 번들러(Rust로 만든 webpack 후속)다. CSS, TypeScript, 최신 JS는 기본으로 처리하므로 로더가 필요 없다.
- 그 밖의 파일을 다르게 불러오고 싶을 때 webpack 로더를 연결하는 설정이 `rules`다. 파일 패턴 → 로더 목록, 그리고 결과를 어떤 파일로 취급할지(`as`)를 적는다.
- 대표 예: `.svg`를 `@svgr/webpack`으로 변환해 React 컴포넌트로 import (`import Logo from './logo.svg'` → `<Logo />`).
- `condition`으로 범위를 좁힐 수 있다: `{ not: 'foreign' }`(node_modules 제외), `'browser'`(클라이언트 코드만), `'development'`/`'production'`.
- 예전 이름은 `experimental.turbo`였고, 15.3부터 최상위 `turbopack`으로 옮겨졌다. webpack을 쓸 때 `webpack(config)` 함수 안에서 `module.rules`로 하던 일을 Turbopack에서는 여기서 한다.

### 한 줄 정리

| 설정 | 무엇을 바꾸나 | 한 줄 |
|---|---|---|
| `cacheComponents` | 렌더링·캐싱 | 기본은 동적, 캐시는 `'use cache'`로 골라서. 정적 껍데기 + 동적 스트리밍(PPR) |
| `partialPrefetching` | 링크 미리 받기 | 링크마다가 아니라 경로마다 공통 껍데기 하나만 미리 받기 |
| `turbopack.rules` | 번들링 | 파일 패턴별로 어떤 로더로 변환할지 |

### 관련 질문

- [Next.js는 버전별로 무엇이 바뀌었나요? (Pages Router → App Router)](./nextjs-versions.md)
- [src/app/layout.tsx와 src/app/page.tsx는 각각 어떤 역할일까요?](./nextjs-layout-page.md)
- [모듈 번들러와 트랜스파일러에 대해서 설명해주세요](../web-questions/bundler-tarnspiler.md)

### 참고

- [Next.js Docs — cacheComponents](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [Next.js Docs — partialPrefetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching)
- [Next.js Docs — turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
