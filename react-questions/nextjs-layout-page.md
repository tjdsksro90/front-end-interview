# Q : src/app/layout.tsx와 src/app/page.tsx는 각각 어떤 역할일까요?

<br />

# A : App Router에서 page.tsx는 그 주소에서 보여줄 화면 자체이고, layout.tsx는 여러 페이지를 감싸는 공통 틀입니다. src/app/layout.tsx는 최상위(루트) 레이아웃이라 모든 페이지에 적용되며 `<html>`과 `<body>`를 반드시 포함해야 하고, src/app/page.tsx는 `/` 주소(홈)의 화면입니다.

### page.tsx — 주소에 해당하는 화면

- App Router는 **폴더 구조가 곧 주소**다. 폴더 안에 `page.tsx`가 있어야 그 주소로 접속할 수 있다.
  - `src/app/page.tsx` → `/`
  - `src/app/blog/page.tsx` → `/blog`
  - `src/app/blog/[slug]/page.tsx` → `/blog/hello` (`params.slug === 'hello'`)
- 기본이 **서버 컴포넌트**라서 컴포넌트 안에서 바로 `await`로 데이터를 가져올 수 있다.
- `params`, `searchParams`를 props로 받는다 (Next.js 15부터 Promise라서 `await` 필요).

```tsx
// src/app/blog/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article>{post.title}</article>;
}
```

### layout.tsx — 여러 페이지를 감싸는 공통 틀

- 자기 폴더와 그 아래 모든 페이지를 감싼다. `children` 자리에 page(또는 하위 layout)가 들어간다.
- **페이지를 이동해도 다시 그려지지 않고 상태가 유지된다.** 그래서 헤더, 사이드바, 탭 메뉴처럼 계속 남아 있어야 하는 UI를 둔다.
- 레이아웃은 중첩된다: `app/layout.tsx` → `app/dashboard/layout.tsx` → `app/dashboard/settings/page.tsx` 순서로 감싼다.

### src/app/layout.tsx (루트 레이아웃)가 특별한 점

- **필수 파일**이고, 모든 페이지에 적용된다.
- `<html>`, `<body>` 태그를 **여기서만** 작성한다. (Pages Router의 `_app.tsx` + `_document.tsx` 역할을 합친 것)
- 사이트 전체에 들어갈 것들을 둔다: 전역 CSS, 폰트(`next/font`), `metadata`(기본 title·description), 테마·React Query 같은 Provider.

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '내 사이트', template: '%s | 내 사이트' },
  description: '사이트 설명',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>   {/* 여기에 page.tsx가 들어간다 */}
      </body>
    </html>
  );
}
```

```tsx
// src/app/page.tsx → "/" 홈 화면
export default function Home() {
  return <h1>안녕하세요</h1>;
}
```

### 정리

| | layout.tsx | page.tsx |
|---|---|---|
| 역할 | 공통 틀 (감싸는 쪽) | 그 주소의 화면 (감싸지는 쪽) |
| 받는 props | `children` (+ `params`) | `params`, `searchParams` |
| 페이지 이동 시 | 유지됨 (다시 그리지 않음, 상태 유지) | 바뀜 |
| 없으면 | 루트는 필수, 하위는 선택 | 그 주소로 접속할 수 없음 (404) |
| src/app에서 | 모든 페이지의 `<html>`, `<body>` | `/` 홈 화면 |

### 같은 폴더에 둘 수 있는 다른 파일

- `loading.tsx`: 페이지를 불러오는 동안 보여줄 화면 (자동으로 `<Suspense>`로 감쌈)
- `error.tsx`: 에러가 났을 때 보여줄 화면 (Error Boundary, 클라이언트 컴포넌트)
- `not-found.tsx`: 404 화면
- `template.tsx`: layout과 비슷하지만 **이동할 때마다 새로 그려진다** (상태를 매번 초기화해야 할 때)
- `route.ts`: 화면 대신 API 응답을 돌려주는 엔드포인트

### 관련 질문

- [Next.js의 App Router는 무엇이고, Pages Router와 어떻게 다른가요?](./pages-router-vs-app-router.md)
- [Next.js는 버전별로 무엇이 바뀌었나요? (Pages Router → App Router)](./nextjs-versions.md)
- [next.config.ts의 cacheComponents, partialPrefetching, turbopack.rules는 각각 무슨 설정일까요?](./nextjs-config.md)
