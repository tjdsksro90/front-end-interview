# Q : Server Component와 Client Component의 역할은 무엇인가요?

<br />

# A : Server Component는 서버에서만 실행되어 데이터를 가져오고 화면의 뼈대(HTML 결과)를 만드는 컴포넌트이고, Client Component는 브라우저에서도 실행되어 상태·이벤트처럼 사용자와 상호작용하는 부분을 맡는 컴포넌트입니다. Next.js App Router에서는 모든 컴포넌트가 기본적으로 Server Component이고, 상호작용이 필요한 파일에만 `'use client'`를 붙여 Client Component로 만듭니다.

### 한 줄로

- **Server Component = 서버에서 데이터를 가져와 결과만 보낸다. 컴포넌트 코드(JS)는 브라우저로 가지 않는다.**
- **Client Component = 브라우저로 JS가 보내져서, 클릭·입력·상태 변화를 처리한다.**

### 각자 맡는 일

| | Server Component | Client Component |
|---|---|---|
| 실행 위치 | 서버에서만 | 서버(첫 HTML 미리 렌더) + 브라우저 |
| 선언 방법 | 기본값 (아무것도 안 붙임) | 파일 맨 위에 `'use client'` |
| 데이터 가져오기 | `async` 컴포넌트에서 `await fetch()`, DB 직접 조회 | `useEffect`, TanStack Query 등으로 API 호출 |
| 비밀 값 (API 키, 토큰) | 써도 브라우저로 노출되지 않는다 | 쓰면 안 된다 (번들에 포함됨) |
| `useState`, `useEffect`, Context | 쓸 수 없다 | 쓸 수 있다 |
| `onClick`, `onChange` 같은 이벤트 | 쓸 수 없다 | 쓸 수 있다 |
| `window`, `localStorage` 같은 브라우저 API | 쓸 수 없다 | 쓸 수 있다 (`useEffect` 안에서) |
| 브라우저로 보내는 JS | 없음 (렌더 결과만 전달) | 컴포넌트 코드와 import한 라이브러리 전부 |

- 무거운 라이브러리(마크다운 변환, 날짜 포맷, 코드 하이라이트 등)를 Server Component에서 쓰면, 결과만 보내고 라이브러리는 번들에 들어가지 않는다.
- 그래서 **기본은 Server Component로 두고, 상호작용이 필요한 작은 부분만 Client Component로** 만드는 것이 원칙이다.

### 예시: 게시글 페이지

```tsx
// app/posts/[id]/page.tsx — Server Component (기본값)
import LikeButton from './LikeButton';

export default async function PostPage({ params }) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } }); // 서버에서 DB 직접 조회

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <LikeButton postId={post.id} initialCount={post.likes} /> {/* 이 부분만 Client */}
    </article>
  );
}
```

```tsx
// app/posts/[id]/LikeButton.tsx — Client Component
'use client';

import { useState } from 'react';

export default function LikeButton({ postId, initialCount }) {
  const [count, setCount] = useState(initialCount);
  return <button onClick={() => setCount((c) => c + 1)}>좋아요 {count}</button>;
}
```

- 게시글 제목·본문은 서버에서 HTML로 완성되고, 브라우저로 가는 JS는 `LikeButton`뿐이다.

### 자주 헷갈리는 점

**1. Client Component도 서버에서 렌더된다**

- "Client Component = CSR"이 아니다. 첫 요청 때는 Client Component도 서버에서 HTML로 미리 렌더되고, 브라우저에서 JS가 도착하면 **hydration**으로 이벤트가 붙는다.
- 차이는 **브라우저에서도 실행되느냐(JS가 가느냐)**다. Server Component는 서버에서만 실행되고 끝난다.
- 첫 로드 순서: ① HTML로 바로 화면을 보여주고 → ② RSC Payload(Server Component 렌더 결과와 Client Component 자리 정보)로 트리를 맞추고 → ③ JS로 Client Component를 hydrate한다.

**2. `'use client'`는 "경계"를 표시한다**

- `'use client'`를 붙인 파일과 그 파일이 **import하는 모든 모듈**이 클라이언트 번들에 들어간다. 그래서 그 아래 파일마다 `'use client'`를 붙일 필요는 없다.
- 경계를 트리 위쪽(예: layout 전체)에 두면 그 아래가 전부 Client Component가 되어 번들이 커진다. **상호작용이 필요한 말단(leaf) 컴포넌트에만** 붙이는 것이 좋다.
- `'use client'`는 파일 맨 처음(import보다 위)에 있어야 한다.

**3. Client Component 안에 Server Component를 넣을 수 있다 (children으로)**

- Client Component 파일에서 Server Component를 **import하면** 그 컴포넌트도 클라이언트 코드가 된다.
- 대신 Server Component에서 `children`이나 props로 **넘겨주면**, 서버에서 미리 렌더된 결과가 전달되어 Server Component로 남는다.

```tsx
// page.tsx (Server)
<Modal>        {/* 'use client' — 열고 닫는 상태 */}
  <Cart />     {/* Server — 서버에서 장바구니 데이터 조회 */}
</Modal>
```

**4. Server → Client로 넘기는 props는 직렬화할 수 있어야 한다**

- 문자열, 숫자, 배열, 일반 객체, `Date`, `Map`/`Set`, Promise, JSX 등은 넘길 수 있다.
- **일반 함수, 클래스 인스턴스는 넘길 수 없다**. 서버에서 실행돼야 하는 함수라면 `'use server'`로 만든 Server Function(Server Action)만 넘길 수 있다.

**5. Context Provider는 Client Component로 감싼다**

- Server Component에서는 Context를 만들거나 쓸 수 없다. `ThemeProvider` 같은 Provider는 `'use client'` 파일로 만들고, layout에서 `children`을 감싸서 쓴다. 가능한 한 트리 깊은 곳에 둔다.

**6. 서버 전용 코드 보호**

- DB 접근이나 비밀 키를 쓰는 모듈에 `import 'server-only'`를 넣어 두면, 실수로 Client Component에서 import했을 때 **빌드 에러**가 난다.
- Next.js에서는 `NEXT_PUBLIC_`으로 시작하는 환경 변수만 클라이언트 번들에 들어간다.

### 언제 무엇을 쓰나

- **Server Component**: 데이터 조회, 비밀 값 사용, 무거운 라이브러리로 정적인 내용 만들기, SEO가 중요한 본문
- **Client Component**: `useState`·`useEffect`·커스텀 훅, `onClick`·`onChange`, `window`·`localStorage`·`navigator`, 애니메이션, 브라우저 전용 서드파티 컴포넌트(캐러셀, 지도, 차트)

### 관련 질문

- [React에서 Hydration에 대해서 설명해주세요.](./hyration.md)
- [Next.js의 App Router는 무엇이고, Pages Router와 어떻게 다른가요?](./pages-router-vs-app-router.md)
- [src/app/layout.tsx와 src/app/page.tsx는 각각 어떤 역할일까요?](./nextjs-layout-page.md)

### 참고

- [Server and Client Components (Next.js 문서)](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- ['use client' (React 문서)](https://react.dev/reference/rsc/use-client)
- [Server Components (React 문서)](https://react.dev/reference/rsc/server-components)
