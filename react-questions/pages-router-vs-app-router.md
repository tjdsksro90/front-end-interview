# Q : Next.js의 App Router는 무엇이고, Pages Router와 어떻게 다른가요?

<br />

# A : Nextjs 13버전 부터 도입 된 파일 시스템 기반 라우터를 뜻합니다.

- 해당 앱라우터는 React 서버 컴포넌트에 기반했으며, 이를 통해 공유 레이아웃, 중첩 라우팅, 로딩 상태, 오류처리 등을 수행할 수 있게되었습니다.

<br />

**Pages Router와 App Router의 가장 큰 차이는 "페이지 컴포넌트가 어디서 실행되느냐"와 "데이터를 어떻게 가져오느냐"입니다.**

- Pages Router(`pages/` 폴더)는 Next.js 12까지의 기본 라우터입니다. 페이지가 **클라이언트 컴포넌트**이고, 서버에서 필요한 데이터는 `getServerSideProps`, `getStaticProps` 같은 정해진 함수로 받아 props로 넘깁니다.
- App Router(`app/` 폴더)는 페이지가 기본적으로 **서버 컴포넌트**입니다. 컴포넌트 안에서 바로 `await fetch()`로 데이터를 가져오고, 브라우저에서 상태·이벤트가 필요한 부분만 `'use client'`로 클라이언트 컴포넌트로 만듭니다. 그만큼 브라우저로 보내는 JS가 줄어듭니다.

<br />

**폴더 구조 비교**

```txt
Pages Router                     App Router
pages/                           app/
├─ _app.tsx    (공통 레이아웃)    ├─ layout.tsx      (루트 레이아웃, <html>·<body> 포함)
├─ _document.tsx (<html> 구조)    ├─ page.tsx        → /
├─ index.tsx       → /           ├─ not-found.tsx   (404)
├─ 404.tsx                       ├─ error.tsx       (에러 화면)
├─ blog/                         ├─ blog/
│  └─ [slug].tsx   → /blog/:slug │  ├─ layout.tsx    (blog 아래에만 적용되는 레이아웃)
└─ api/                          │  ├─ loading.tsx   (로딩 화면)
   └─ hello.ts     → /api/hello  │  └─ [slug]/page.tsx → /blog/:slug
                                 └─ api/hello/route.ts → /api/hello
```

- Pages Router는 **파일 하나 = URL 하나**입니다(`blog/[slug].tsx`).
- App Router는 **폴더 = URL**이고, 폴더 안의 `page.tsx`가 있어야 그 URL이 열립니다. 같은 폴더에 `layout`, `loading`, `error` 같은 특수 파일을 두어 그 구간의 레이아웃·로딩·에러 화면을 정합니다. 그래서 `page.tsx`가 아닌 컴포넌트·유틸 파일을 라우트 폴더 안에 같이 둘 수 있습니다.

<br />

**데이터 가져오기 비교**

```tsx
// Pages Router: pages/blog/[slug].tsx
export async function getStaticPaths() {
  const posts = await getPosts();
  return { paths: posts.map((p) => ({ params: { slug: p.slug } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const post = await getPost(params.slug);
  return { props: { post }, revalidate: 60 }; // ISR
}

export default function Post({ post }) {
  return <h1>{post.title}</h1>;
}
```

```tsx
// App Router: app/blog/[slug]/page.tsx
export const revalidate = 60; // ISR

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug })); // params 객체 없이 값만 돌려준다
}

export default async function Post({ params }) {
  const { slug } = await params;
  const post = await getPost(slug); // 컴포넌트 안에서 바로 데이터를 가져온다
  return <h1>{post.title}</h1>;
}
```

<br />

**한눈에 비교**

| | Pages Router | App Router |
|---|---|---|
| 폴더 | `pages/` | `app/` |
| 라우트 | 파일 하나 = URL (`blog/[slug].tsx`) | 폴더 = URL, 그 안의 `page.tsx` (`blog/[slug]/page.tsx`) |
| 컴포넌트 기본값 | 클라이언트 컴포넌트 | 서버 컴포넌트 (`'use client'`로 클라이언트 지정) |
| 공통 레이아웃 | `_app.tsx`, `_document.tsx` 하나 | `layout.tsx`를 폴더마다 두고 중첩 |
| SSR 데이터 | `getServerSideProps` | 컴포넌트에서 `await fetch(url, { cache: 'no-store' })` 등 |
| SSG 데이터 | `getStaticProps` | 컴포넌트에서 `await fetch()` + 캐시 설정 |
| 동적 경로 미리 만들기 | `getStaticPaths` (`fallback`) | `generateStaticParams` (`dynamicParams`) |
| ISR | `getStaticProps`에서 `revalidate: 60` 반환 | `export const revalidate = 60` 또는 `fetch(url, { next: { revalidate: 60 } })` |
| 라우터 훅 | `next/router`의 `useRouter` (`router.query`, `router.pathname`) | `next/navigation`의 `useRouter`, `usePathname`, `useSearchParams`, `useParams` |
| `<head>` / SEO | `next/head` | `export const metadata` / `generateMetadata` |
| API | `pages/api/*.ts` (API Routes) | `app/**/route.ts` (Route Handlers, Web Request/Response 사용) |
| 로딩·에러 화면 | 직접 구현, `404.tsx`, `_error.tsx` | `loading.tsx`(Suspense), `error.tsx`, `not-found.tsx` |
| 스트리밍 | 지원 안 함 (페이지 전체가 준비돼야 응답) | 지원 (준비된 부분부터 먼저 보냄) |

<br />

**함께 쓸 수 있나요?**

- 네. 같은 프로젝트에 `pages/`와 `app/`을 함께 둘 수 있어서, 페이지 단위로 조금씩 옮길 수 있습니다.
- 대신 두 라우터 사이를 이동할 때는 SPA처럼 부드럽게 바뀌지 않고 **페이지 전체를 새로 불러오고**(hard navigation), `next/link`의 미리 불러오기(prefetch)도 라우터를 넘어서 동작하지 않습니다.
- `app/layout.tsx`의 스타일은 `pages/` 쪽 페이지에 적용되지 않으므로, 옮기는 동안에는 `_app`·`_document`를 그대로 두어야 합니다.
- 지금 새로 시작하는 프로젝트는 App Router가 기본이고, Pages Router는 기존 프로젝트를 위해 계속 지원됩니다.

### 관련 질문

- [src/app/layout.tsx와 src/app/page.tsx는 각각 어떤 역할일까요?](./nextjs-layout-page.md)
- [CSR과SSR의 차이점](../web-questions/spa.md)

### 참고

- [App Router 마이그레이션 가이드 (Next.js 문서)](https://nextjs.org/docs/app/guides/migrating/app-router-migration)
