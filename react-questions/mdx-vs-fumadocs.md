# Q : @mdx-js/react(MDX)와 Fumadocs는 무엇이 다른가요?

<br />

# A : MDX는 마크다운 안에서 React 컴포넌트를 쓸 수 있게 해주는 "문서 형식과 변환기"이고, @mdx-js/react는 그 MDX에 어떤 컴포넌트를 쓸지 연결해주는 작은 도구입니다. Fumadocs는 MDX를 바탕으로 사이드바·목차·검색·문서 레이아웃까지 갖춘 "문서 사이트 프레임워크"입니다. MDX는 재료이고, Fumadocs는 그 재료로 문서 사이트를 완성해주는 도구라고 보면 됩니다.

### MDX와 @mdx-js/react

- **MDX** = Markdown + JSX. `.mdx` 파일 안에서 `import`도 하고 `<Chart />` 같은 컴포넌트도 쓴다.
- MDX 파일은 그대로 실행되지 않고, 빌드할 때 **React 컴포넌트(JS)로 변환**된다. 변환은 `@mdx-js/mdx`가 하고, 번들러용 플러그인(`@mdx-js/rollup`(Vite), `@next/mdx`(Next.js))으로 연결한다.
- **@mdx-js/react**: `MDXProvider`로 "MDX 안의 `h1`, `a`, `code`를 내 컴포넌트로 바꿔 그려라"를 한 번에 지정한다. (Next.js `@next/mdx`에서는 같은 역할을 `mdx-components.tsx`가 한다)

```mdx
---
title: 버튼
---
import { Button } from '@/components/button';

# 버튼 사용법

<Button variant="primary">저장</Button>
```

```tsx
import { MDXProvider } from '@mdx-js/react';
import Post from './post.mdx';

const components = { h1: (p) => <h1 className="text-3xl" {...p} />, a: MyLink };

<MDXProvider components={components}>
  <Post />
</MDXProvider>
```

- 여기까지가 MDX가 해주는 전부다. **사이드바, 목차(TOC), 검색, 이전/다음 링크, 문서 레이아웃은 직접 만들어야 한다.** frontmatter(`title`)를 읽는 것도 플러그인(`remark-frontmatter` 등)을 따로 붙여야 한다.

### Fumadocs

- Next.js(App Router)용으로 시작한 **문서 사이트 프레임워크**다. React Router, TanStack Start, Waku, Astro도 지원한다.
- 세 패키지로 나뉜다.

| 패키지 | 하는 일 |
|---|---|
| **fumadocs-mdx** | `content/docs`의 MDX를 빌드할 때 읽고 변환, frontmatter 검사(Zod 스키마) |
| **fumadocs-core** | 헤드리스 로직: 페이지 목록·사이드바 트리 만들기(`loader`), 검색, 목차, MDX 플러그인 |
| **fumadocs-ui** | 기본 디자인: 문서 레이아웃(사이드바·목차·검색창), Callout·Tabs·Steps 같은 MDX 컴포넌트 |

- `content/docs` 폴더에 MDX를 넣으면 **폴더 구조와 `meta.json`으로 사이드바가 자동으로 만들어지고**, 제목(h2, h3)으로 목차가, 전체 문서로 검색 색인이 만들어진다.
- 코드 블록 하이라이트(Shiki), 파일 제목(`title="next.config.mjs"`), 줄 강조(`// [!code highlight]`), 탭 코드 블록이 기본으로 된다.
- `npm create fumadocs-app`으로 바로 시작할 수 있다.

### 비교

| | @mdx-js/react (MDX) | Fumadocs |
|---|---|---|
| 정체 | 문서 형식 + 변환기 + 컴포넌트 연결 | 문서 사이트 프레임워크 (MDX 기반) |
| 범위 | MDX → React 컴포넌트까지 | 콘텐츠 읽기 + 사이드바 + 목차 + 검색 + 레이아웃 + 디자인 |
| 사이드바·목차·검색 | 직접 구현 | 기본 제공 |
| frontmatter | 플러그인 추가 필요 | 기본 지원, Zod로 타입 검사 |
| 디자인 | 없음 (자유) | fumadocs-ui 테마 (Tailwind 기반, 수정 가능) |
| 프레임워크 | 어디서나 (Vite, Next.js, Remix…) | Next.js 중심 + React Router, TanStack Start, Waku, Astro |
| 어울리는 곳 | 블로그 글 몇 개, 랜딩 페이지 일부, 기존 사이트에 MDX 페이지 추가 | 라이브러리·API·사내 문서처럼 문서가 많고 구조가 있는 사이트 |

### 그래서 무엇을 고르나

- **기존 앱에 글 몇 개를 MDX로 넣고 싶다** → MDX(`@next/mdx`, `@mdx-js/rollup`)만으로 충분하다. 레이아웃은 내 앱 것을 그대로 쓴다.
- **문서 사이트를 새로 만든다** → Fumadocs처럼 사이드바·검색·목차가 갖춰진 도구가 빠르다. 같은 범주로 Nextra, Docusaurus, Starlight(Astro)가 있다.
- Fumadocs는 core(로직)와 ui(디자인)가 나뉘어 있어서, **디자인은 직접 만들고 로직만** 가져다 쓸 수도 있다.

### 참고: 이 사이트는?

- 이 사이트는 MDX가 아니라 **react-markdown**으로 `.md`를 화면에서 그린다. md 안에 컴포넌트를 쓰지 않고, 직접 다뤄 보는 부분은 별도 "심화" 페이지(JSX)로 만들었기 때문이다.
- md 안에 데모 컴포넌트를 바로 넣고 싶어지면 그때 MDX로 옮기는 게 자연스럽다.

### 관련 질문

- [React 대신 Next.js를 사용하는 이유는 무엇인가요?](./why-nextjs.md)
- [src/app/layout.tsx와 src/app/page.tsx는 각각 어떤 역할일까요?](./nextjs-layout-page.md)
- [모듈 번들러와 트랜스파일러에 대해서 설명해주세요](../web-questions/bundler-tarnspiler.md)

### 참고

- [Fumadocs MDX — Next.js](https://www.fumadocs.dev/docs/mdx/next)
- [Fumadocs Manual Installation (Next.js)](https://www.fumadocs.dev/docs/manual-installation/next)
- [Fumadocs Page Conventions (meta.json)](https://www.fumadocs.dev/docs/page-conventions)
- [Fumadocs Collections](https://www.fumadocs.dev/docs/mdx/collections)
- [Fumadocs Markdown (코드 블록·Callout·Cards)](https://www.fumadocs.dev/docs/markdown)
- [Fumadocs UI Components — Tabs](https://www.fumadocs.dev/docs/ui/components/tabs) · [Steps](https://www.fumadocs.dev/docs/ui/components/steps) · [Files](https://www.fumadocs.dev/docs/ui/components/files)
- [Fumadocs 16.17 릴리스](https://www.fumadocs.dev/blog/v16-17)
