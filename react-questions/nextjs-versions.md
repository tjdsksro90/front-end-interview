# Q : Next.js는 버전별로 무엇이 바뀌었나요? (Pages Router → App Router)

<br />

# A : 가장 큰 변화는 13에서 시작해 13.4에서 정식이 된 App Router입니다. pages 폴더와 getServerSideProps 방식에서, app 폴더의 중첩 layout과 서버 컴포넌트 방식으로 바뀌었고, 이후 15·16은 캐시 기본값과 번들러(Turbopack)를 정리한 버전입니다.

### Next.js 9 ~ 12 : Pages Router 시절

- **9 (2019)**: 동적 라우팅(`pages/[id].js`), API Routes(`pages/api`)
- **9.3 ~ 9.5**: `getStaticProps`, `getServerSideProps`(SSG/SSR), ISR
- **10 (2020)**: `next/image` 이미지 최적화
- **12 (2021)**: Babel 대신 Rust 기반 컴파일러(SWC)로 빌드 속도 향상, Middleware(beta)

### Next.js 13 (2022.10) · 13.4 (2023.05) : App Router

- `app/` 폴더 도입. 13에서는 beta, **13.4에서 정식(stable)**이 됐다.
- **서버 컴포넌트가 기본**: `'use client'`를 적은 컴포넌트만 브라우저로 JS가 간다.
- **중첩 layout**: 폴더마다 `layout.tsx`를 두고, 페이지를 이동해도 바깥 layout은 유지된다.
- **컴포넌트에서 바로 데이터 요청**: 페이지 단위 `getServerSideProps` 대신 async 컴포넌트에서 `await fetch()`.
- **스트리밍**: `loading.tsx`(Suspense)로 느린 부분만 나중에 보여준다. `error.tsx`는 자동 Error Boundary.
- 그 외: Turbopack(alpha), `next/font`

```tsx
// Pages Router: pages/products/[id].tsx
export async function getServerSideProps({ params }) {
  const product = await getProduct(params.id);
  return { props: { product } };
}
export default function Page({ product }) {
  return <h1>{product.name}</h1>;
}

// App Router: app/products/[id]/page.tsx (서버 컴포넌트)
export default async function Page({ params }) {
  const { id } = await params;
  const product = await getProduct(id);
  return <h1>{product.name}</h1>;
}
```

### Next.js 14 (2023.10) : Server Actions 정식

- 폼이나 버튼에서 서버 함수(`'use server'`)를 직접 호출한다. API 라우트를 따로 만들지 않아도 된다.
- Partial Prerendering(미리보기). 구조적인 큰 변화는 없어서, 실무에서는 "13~14부터 App Router를 썼다"고 묶어서 말하는 경우가 많다.

### Next.js 15 (2024.10) : React 19 · 캐시 기본값 변경

- React 19 지원.
- `params`, `searchParams`, `cookies()`, `headers()`가 **async(Promise)**로 바뀌었다.
- **캐시 기본값 변경**: 13~14는 `fetch`가 기본으로 캐시돼 "데이터가 안 바뀐다"는 혼란이 많았다. 15부터 기본은 캐시하지 않고, 필요하면 명시한다.
- Turbopack 개발 서버 정식.

```ts
// 13~14: 끄려면 명시
await fetch(url, { cache: 'no-store' });
// 15~: 켜려면 명시
await fetch(url, { cache: 'force-cache' });
```

### Next.js 16 (2025.10) : Turbopack 기본 · Cache Components

- **Turbopack이 기본 번들러**가 됐다. (webpack은 선택)
- **Cache Components**: 캐시할 함수나 컴포넌트에 `'use cache'`를 직접 표시하는 방식으로 캐시를 정리했다.
- React Compiler 정식 지원(`reactCompiler: true`), React 19.2 기능.
- `middleware.ts`가 `proxy.ts`로 이름이 바뀌었다.

```ts
async function getProducts() {
  'use cache';
  return db.product.findMany();
}
```

### App Router의 장점과 단점

- **장점**
  - 서버 컴포넌트는 브라우저로 JS가 가지 않아 번들이 줄어든다.
  - 데이터가 필요한 컴포넌트에서 바로 요청해서 props drilling이 줄어든다.
  - 중첩 layout으로 공통 UI가 이동해도 유지된다.
  - 스트리밍으로 첫 화면을 빨리 보여준다.
- **단점**
  - 서버/클라이언트 경계(`'use client'` 위치, 직렬화 가능한 props만 전달)를 이해해야 한다.
  - 캐시 정책이 버전마다 바뀌어 헷갈린다. (13~14 기본 캐시 → 15 기본 미캐시 → 16 `'use cache'`)
  - Context, useState를 쓰는 라이브러리는 클라이언트 컴포넌트로 감싸야 한다.
  - 큰 Pages Router 프로젝트는 두 방식을 공존시키며 점진적으로 옮겨야 한다.
