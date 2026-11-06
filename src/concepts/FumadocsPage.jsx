import { useMemo, useState } from 'react';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, Segmented, ui } from '../components/kit.jsx';
import { WhereToCheck, Screen, FolderTree } from '../components/screens.jsx';

export default function FumadocsPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Fumadocs는 <u>content/docs 폴더에 MDX만 넣으면 사이드바·목차·검색·문서 레이아웃이 갖춰진 문서 사이트를 만들어주는 프레임워크</u>입니다.
          MDX 변환(fumadocs-mdx), 로직(fumadocs-core), 디자인(fumadocs-ui)이 <u>세 패키지로 나뉘어 있어서</u> 필요한 만큼만 가져다 쓸 수 있습니다.
        </OneLiner>

        <H3>MDX가 화면이 되기까지</H3>
        <Pipeline />

        <H3>세 패키지</H3>
        <Table
          head={['패키지', '하는 일', '주로 쓰는 것']}
          rows={[
            ['fumadocs-mdx', 'MDX 파일을 빌드할 때 읽고 변환, frontmatter 검사', <><Code>defineDocs</Code>, <Code>createMDX</Code></>],
            ['fumadocs-core', '디자인 없는 로직: 페이지 목록·사이드바 트리, 검색, 목차, MDX 플러그인', <><Code>loader</Code>, <Code>createFromSource</Code></>],
            ['fumadocs-ui', '기본 디자인: 문서 레이아웃, 검색창, MDX 컴포넌트', <><Code>DocsLayout</Code>, <Code>DocsPage</Code>, <Code>Tabs</Code></>],
          ]}
        />

        <H3>알아둘 용어</H3>
        <List
          items={[
            <><b>source</b>: <Code>loader()</Code>가 만든 문서 저장소. <Code>source.getPage(slug)</Code>로 페이지를, <Code>source.getPageTree()</Code>로 사이드바 트리를 꺼낸다.</>,
            <><b>page tree</b>: 사이드바 구조. 폴더 구조로 자동으로 만들어지고, 폴더의 <Code>meta.json</Code>으로 순서·구분선·제외를 정한다.</>,
            <><b>frontmatter</b>: MDX 맨 위 <Code>title</Code>, <Code>description</Code>, <Code>icon</Code>. 스키마를 넓혀서 필드를 추가할 수 있고, 틀리면 빌드에서 에러가 난다.</>,
            <><b>TOC</b>: 본문의 h2, h3로 자동으로 만든 오른쪽 목차.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>라이브러리·SDK 문서</b>: 설치, 가이드, API 레퍼런스처럼 페이지가 많고 구조가 있는 문서</>,
            <><b>사내 기술 문서·디자인 시스템 문서</b>: MDX라서 실제 컴포넌트 예시를 문서 안에 바로 넣을 수 있다</>,
            <><b>OpenAPI 문서</b>: fumadocs-openapi로 명세에서 API 문서 페이지를 생성</>,
            <><b>이미 Next.js를 쓰는 팀</b>: 별도 도구 없이 같은 앱 안의 <Code>/docs</Code> 경로로 붙일 수 있다</>,
          ]}
          avoid={[
            '블로그 글 몇 개 — @next/mdx나 @mdx-js/rollup만으로 충분하다',
            'Next.js 16·Tailwind 4 환경이 아닌 프로젝트에 붙이기 — 공식 설치 문서가 이 버전들을 전제로 한다',
            '문서 사이트 모양을 완전히 다르게 만들고 싶은데 fumadocs-ui를 억지로 고치기 — fumadocs-core만 쓰고 UI를 직접 만드는 편이 낫다',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"MDX는 마크다운에 컴포넌트를 쓰게 해주는 형식이고, Fumadocs는 그 위에 사이드바·검색·목차를 갖춘 문서 프레임워크다. core(로직)와 ui(디자인)가 분리돼 있어서 로직만 쓰고 디자인은 직접 만들 수도 있다."</p>
        </Callout>
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: '사이드바 순서가 이상할 때', path: ['content/docs/<폴더>', 'meta.json'], what: 'pages 배열에 적은 순서대로 나온다. pages를 적으면 목록에 없는 페이지는 빠진다 ("..."로 나머지 포함)' },
            { where: '페이지가 안 보일 때 (404)', path: ['content/docs', '파일 경로'], what: 'content/docs/guides/routing.mdx → /docs/guides/routing. (괄호) 폴더는 주소에 들어가지 않는다' },
            { where: 'frontmatter 에러', path: ['터미널', 'next dev 로그'], what: 'source.config.ts의 스키마와 맞지 않으면 빌드 단계에서 어느 파일인지 알려준다' },
            { where: '검색 결과가 비어 있을 때', path: ['F12', 'Network', '/api/search?query=...'], what: '검색 API 응답을 확인. 정적 export라면 staticGET으로 색인을 미리 만들어야 한다' },
          ]}
        />

        <H3>직접 해보기: meta.json으로 사이드바 만들기</H3>
        <p>
          왼쪽 <Code>meta.json</Code>을 바꾸면 Fumadocs가 만드는 사이드바가 어떻게 바뀌는지 보여줍니다. 사이드바에서 페이지를 누르면 본문과 오른쪽 목차(TOC)가 바뀌고,
          검색창에 입력하면 제목과 본문에서 찾습니다.
        </p>
        <MockDocs />
      </Section>

      <Section step={3} title="코드">
        <H3>시작하기</H3>
        <CodeBlock
          title="터미널"
          code={`
# 새 프로젝트 (Next.js, React Router, TanStack Start, Waku, Astro 중 선택)
npm create fumadocs-app

# 기존 Next.js 앱에 직접 붙이기
npm i fumadocs-ui fumadocs-core fumadocs-mdx @types/mdx`}
        />
        <FolderTree
          title="폴더 구조 (Next.js)"
          lines={[
            'content/docs/',
            '  index.mdx              # /docs',
            '  installation.mdx       # /docs/installation',
            '  meta.json              # 사이드바 순서',
            '  guides/',
            '    routing.mdx          # /docs/guides/routing',
            '    theming.mdx',
            'app/',
            '  layout.tsx             # RootProvider',
            '  docs/',
            '    layout.tsx           # DocsLayout (사이드바)',
            '    [[...slug]]/page.tsx # DocsPage (본문 + 목차)',
            '  api/search/route.ts    # 검색 API',
            'lib/source.ts            # loader',
            'components/mdx.tsx       # MDX 컴포넌트 목록',
            'source.config.ts         # 컬렉션·스키마·MDX 플러그인',
            'next.config.mjs          # createMDX',
          ]}
        />

        <CodeBlock
          title="source.config.ts — 어떤 폴더를 문서로 읽을지, frontmatter 스키마"
          code={`
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // 기본 title·description에 필드 추가 → 빠지거나 타입이 틀리면 빌드 에러
    schema: pageSchema.extend({
      badge: z.enum(['new', 'beta']).optional(),
    }),
  },
});

export default defineConfig();`}
        />
        <CodeBlock
          title="next.config.mjs — MDX 변환 연결 (ESM 전용이라 .mjs 권장)"
          code={`
import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withMDX = createMDX();

export default withMDX(config);`}
        />
        <CodeBlock
          title="lib/source.ts — 문서 저장소 만들기 (공식 Next.js 가이드의 Macro 방식)"
          code={`
import { defineDocs } from 'fumadocs-mdx/macro';
import { loader } from 'fumadocs-core/source';

const docs = defineDocs({
  dir: 'content/docs',
});

export const source = loader({
  baseUrl: '/docs',                 // 모든 문서 주소의 앞부분
  source: docs.toFumadocsSource(),
});`}
        />
        <Callout title="컬렉션을 정의하는 두 가지 방법">
          <p>
            <b>Config API</b>: 앞의 코드처럼 <Code>source.config.ts</Code>에 <Code>fumadocs-mdx/config</Code>의 <Code>defineDocs</Code>로 컬렉션·스키마·MDX 플러그인을 모아 두고, 생성된 파일을 불러와서 씁니다.
            <b> Macro API</b>: 바로 위 코드처럼 <Code>fumadocs-mdx/macro</Code>의 <Code>defineDocs</Code>를 앱 코드(<Code>lib/source.ts</Code>) 안에서 바로 씁니다. 공식 Next.js 설치 가이드는 이 방식이에요.
          </p>
          <p>생성 파일을 불러오는 경로는 버전마다 다를 수 있으니, <Code>npm create fumadocs-app</Code>으로 만든 프로젝트를 기준으로 맞추는 게 안전합니다.</p>
        </Callout>
        <CodeBlock
          title="app/layout.tsx — 테마·검색 등 전역 Provider"
          code={`
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';   // @import 'tailwindcss'; @import 'fumadocs-ui/css/neutral.css'; @import 'fumadocs-ui/css/preset.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}`}
        />
        <CodeBlock
          title="app/docs/layout.tsx — 사이드바"
          code={`
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout tree={source.getPageTree()} nav={{ title: '내 문서' }}>
      {children}
    </DocsLayout>
  );
}`}
        />
        <CodeBlock
          title="app/docs/[[...slug]]/page.tsx — 본문 + 목차"
          code={`
import { source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;          // MDX가 변환된 React 컴포넌트

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {/* ./other.mdx 같은 상대 링크를 실제 주소로 바꿔준다 */}
        <MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} />
      </DocsBody>
    </DocsPage>
  );
}

// 빌드할 때 모든 문서를 정적 페이지로
export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>) {
  const page = source.getPage((await props.params).slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}`}
        />
        <CodeBlock
          title="components/mdx.tsx — MDX 안에서 쓸 컴포넌트 (@mdx-js/react의 MDXProvider 역할)"
          code={`
import defaultMdxComponents from 'fumadocs-ui/mdx';         // Callout, Cards, 코드 블록, 제목 등
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,      // 추가로 등록하면 MDX에서 import 없이 <Tabs> 사용
    ...components,
  } satisfies MDXComponents;
}`}
        />
        <CodeBlock
          title="app/api/search/route.ts — 검색 API (문서 전체 색인)"
          code={`
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const { GET } = createFromSource(source);

// 정적 export(서버 없이 배포)라면 색인을 빌드할 때 만든다
// export const revalidate = false;
// export const { staticGET: GET } = createFromSource(source);`}
        />

        <H3>meta.json 문법</H3>
        <Table
          head={['쓰는 법', '뜻']}
          rows={[
            [<Code>"installation"</Code>, '이 페이지(또는 폴더)를 이 위치에'],
            [<Code>"---가이드---"</Code>, '구분선(소제목)'],
            [<Code>"..."</Code>, '아직 적지 않은 나머지 전부 (이름순)'],
            [<Code>"...guides"</Code>, 'guides 폴더를 펼쳐서 안의 페이지들을 이 단계에 바로'],
            [<Code>"!api"</Code>, '사이드바에서 제외'],
            [<Code>"[GitHub](https://github.com/...)"</Code>, '외부 링크'],
            [<Code>{'"root": true'}</Code>, '이 폴더를 별도 탭(최상위 영역)으로. 버전별 문서에 쓴다'],
          ]}
        />

        <H3>MDX에서 쓰는 기본 기능</H3>
        <CodeBlock
          title="content/docs/installation.mdx"
          code={`
---
title: 설치
description: 프로젝트에 라이브러리를 추가합니다
badge: new
---

import { Step, Steps } from 'fumadocs-ui/components/steps';
import { File, Folder, Files } from 'fumadocs-ui/components/files';

<Callout type="warn" title="Node.js 22 이상이 필요해요">
  기본 컴포넌트라 import 없이 쓴다.
</Callout>

<Steps>
<Step>
### 패키지 설치
</Step>
<Step>
### 설정 파일 추가
</Step>
</Steps>

<Tabs items={['npm', 'pnpm']}>
  <Tab value="npm">npm i my-lib</Tab>
  <Tab value="pnpm">pnpm add my-lib</Tab>
</Tabs>

<Files>
  <Folder name="app" defaultOpen>
    <File name="layout.tsx" />
  </Folder>
</Files>

\`\`\`ts title="lib/client.ts"
const client = createClient(); // [!code highlight]
client.get('/old');            // [!code --]
client.get('/users');          // [!code ++]
\`\`\``}
        />
        <List
          items={[
            <>코드 블록: Shiki로 하이라이트, <Code>title="..."</Code>로 파일 이름, <Code>// [!code highlight]</Code>·<Code>[!code ++]</Code>·<Code>[!code --]</Code>로 줄 강조와 diff, <Code>lineNumbers</Code>로 줄 번호.</>,
            <>그 밖의 컴포넌트: <Code>Accordion</Code>, <Code>TypeTable</Code>(props 표), <Code>Cards</Code>(링크 카드).</>,
          ]}
        />

        <H3>@mdx-js/react만 쓸 때와 비교</H3>
        <Table
          head={['할 일', 'MDX만 쓰면', 'Fumadocs']}
          rows={[
            ['MDX 변환', <><Code>@next/mdx</Code>·<Code>@mdx-js/rollup</Code> 설정</>, <><Code>createMDX()</Code></>],
            ['컴포넌트 연결', <><Code>MDXProvider</Code> / <Code>mdx-components.tsx</Code></>, <><Code>getMDXComponents()</Code></>],
            ['frontmatter', 'remark 플러그인 추가 + 타입은 직접', 'Zod 스키마로 검사'],
            ['문서 목록·사이드바', '파일 목록을 읽어서 직접', <><Code>source.getPageTree()</Code> + <Code>meta.json</Code></>],
            ['목차', 'rehype 플러그인으로 제목 추출 후 직접', <><Code>page.data.toc</Code></>],
            ['검색', '색인·검색 UI 직접 (또는 Algolia)', <><Code>createFromSource</Code> + 기본 검색창</>],
          ]}
        />
      </Section>
    </>
  );
}

/* ---------------------------------- 시각화 ---------------------------------- */

function Pipeline() {
  const steps = [
    { pkg: '', name: 'content/docs/*.mdx', sub: 'MDX + frontmatter + meta.json' },
    { pkg: 'fumadocs-mdx', name: '빌드할 때 변환', sub: 'MDX → React 컴포넌트, 스키마 검사' },
    { pkg: 'fumadocs-core', name: 'loader()', sub: '페이지 목록 · 사이드바 트리 · 목차 · 검색 색인' },
    { pkg: 'fumadocs-ui', name: 'DocsLayout · DocsPage', sub: '사이드바 · 본문 · 목차 · 검색창' },
  ];
  const tone = {
    '': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    'fumadocs-mdx': 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    'fumadocs-core': 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
    'fumadocs-ui': 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  };
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {steps.map((s, i) => (
        <div key={s.name} className="flex items-center gap-2 sm:flex-col sm:items-stretch">
          <div className={`${ui.box} flex-1`}>
            <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${tone[s.pkg]}`}>{s.pkg || '내가 쓰는 것'}</span>
            <div className="mt-1.5 font-mono text-sm font-semibold">{s.name}</div>
            <div className={`mt-0.5 text-xs ${ui.muted}`}>{s.sub}</div>
          </div>
          {i < steps.length - 1 && <span className="text-zinc-400 sm:hidden">↓</span>}
        </div>
      ))}
    </div>
  );
}

// 가상의 문서: 폴더 구조와 본문(h2 → 목차)
const DOCS = {
  index: { title: '소개', body: ['왜 만들었나', '특징'], text: '이 라이브러리는 데이터를 불러오는 작업을 쉽게 만듭니다.' },
  installation: { title: '설치', body: ['요구 사항', '패키지 설치', '설정 파일'], text: 'npm으로 설치하고 설정 파일을 추가합니다.' },
  guides: {
    folder: '가이드',
    children: {
      routing: { title: '라우팅', body: ['경로 정의', '동적 경로'], text: '파일 이름으로 경로를 만듭니다. [slug]는 동적 경로입니다.' },
      theming: { title: '테마', body: ['색상', '다크 모드'], text: 'CSS 변수로 색상을 바꾸고 다크 모드를 지원합니다.' },
    },
  },
  api: {
    folder: 'API',
    children: {
      client: { title: 'createClient', body: ['옵션', '반환값'], text: '클라이언트를 만듭니다. baseUrl 옵션이 필요합니다.' },
      server: { title: 'createServer', body: ['옵션', '미들웨어'], text: '서버 쪽 핸들러를 만듭니다.' },
    },
  },
};

const META = {
  none: { label: 'meta.json 없음', pages: null },
  ordered: { label: '순서 + 구분선', pages: ['index', 'installation', '---가이드---', '...guides', '---API 레퍼런스---', 'api'] },
  rest: { label: '"..." + 제외', pages: ['index', '...', '!api', '[GitHub](https://github.com)'] },
};

// meta.json의 pages를 사이드바 항목으로 (Fumadocs 규칙의 일부만 흉내)
function buildTree(pages) {
  const names = Object.keys(DOCS);
  const node = (name) =>
    DOCS[name].folder
      ? { type: 'folder', name, title: DOCS[name].folder, children: Object.keys(DOCS[name].children).map((c) => ({ type: 'page', slug: `${name}/${c}`, title: DOCS[name].children[c].title })) }
      : { type: 'page', slug: name, title: DOCS[name].title };
  if (!pages) return [...names].sort().map(node);

  const excluded = pages.filter((p) => p.startsWith('!')).map((p) => p.slice(1));
  const used = new Set([...excluded, ...pages.filter((p) => names.includes(p)), ...pages.filter((p) => /^\.\.\.\w/.test(p)).map((p) => p.slice(3))]);
  const out = [];
  for (const p of pages) {
    if (p.startsWith('!')) continue;
    const sep = p.match(/^---(.+)---$/);
    const link = p.match(/^\[(.+)\]\((.+)\)$/);
    if (sep) out.push({ type: 'separator', title: sep[1] });
    else if (link) out.push({ type: 'link', title: link[1] });
    else if (p === '...') names.filter((n) => !used.has(n)).sort().forEach((n) => out.push(node(n)));
    else if (p.startsWith('...')) out.push(...node(p.slice(3)).children);
    else if (names.includes(p)) out.push(node(p));
  }
  return out;
}

const findDoc = (slug) => {
  const [a, b] = slug.split('/');
  return b ? DOCS[a].children[b] : DOCS[a];
};

function MockDocs() {
  const [meta, setMeta] = useState('ordered');
  const [slug, setSlug] = useState('installation');
  const [query, setQuery] = useState('');
  const tree = useMemo(() => buildTree(META[meta].pages), [meta]);
  const doc = findDoc(slug);

  const all = Object.entries(DOCS).flatMap(([k, v]) =>
    v.folder ? Object.entries(v.children).map(([c, d]) => ({ slug: `${k}/${c}`, ...d })) : [{ slug: k, ...v }]
  );
  const results = query.trim()
    ? all.filter((d) => [d.title, d.text, ...d.body].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const metaJson = META[meta].pages ? JSON.stringify({ pages: META[meta].pages }, null, 2) : '// 파일 없음 → 폴더·파일 이름순';
  const pageLink = (s, title, depth = 0) => (
    <button
      key={s}
      onClick={() => setSlug(s)}
      className={`block w-full truncate rounded-md px-2 py-1 text-left ${depth ? 'pl-5' : ''} ${
        s === slug ? 'bg-violet-100 font-semibold text-violet-800 dark:bg-violet-500/20 dark:text-violet-200' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
      }`}
    >
      {title}
    </button>
  );

  return (
    <div className="space-y-3">
      <Segmented value={meta} onChange={setMeta} options={Object.entries(META).map(([value, m]) => ({ value, label: m.label }))} />
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <div>
          <div className={`mb-1 text-xs ${ui.muted}`}>content/docs/meta.json</div>
          <pre className="overflow-x-auto rounded-xl bg-[#1e1f24] p-3 font-mono text-xs text-zinc-200">{metaJson}</pre>
        </div>
        <Screen title="localhost:3000/docs" caption="Fumadocs 기본 레이아웃(사이드바 · 본문 · 목차)을 단순화해서 재현했어요">
          <div className="grid min-w-[520px] grid-cols-[150px_1fr_110px]">
            <aside className="space-y-0.5 border-r border-zinc-200 p-2 dark:border-zinc-700">
              <div className="relative mb-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="검색…"
                  aria-label="문서 검색"
                  className="w-full rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-violet-400 dark:border-zinc-700"
                />
                {query.trim() && (
                  <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    {results.length ? (
                      results.map((r) => (
                        <button key={r.slug} onClick={() => { setSlug(r.slug); setQuery(''); }} className="block w-full rounded px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          <div className="font-semibold">{r.title}</div>
                          <div className="truncate text-[10px] text-zinc-400">/docs/{r.slug === 'index' ? '' : r.slug}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-zinc-400">결과 없음</div>
                    )}
                  </div>
                )}
              </div>
              {tree.map((n, i) => {
                if (n.type === 'separator') return <div key={i} className="px-2 pt-3 pb-1 text-[10px] font-bold tracking-wide text-zinc-400 uppercase">{n.title}</div>;
                if (n.type === 'link') return <div key={i} className="px-2 py-1 text-zinc-500">{n.title} ↗</div>;
                if (n.type === 'folder')
                  return (
                    <div key={n.name}>
                      <div className="px-2 py-1 font-semibold text-zinc-700 dark:text-zinc-200">{n.title} ▾</div>
                      {n.children.map((c) => pageLink(c.slug, c.title, 1))}
                    </div>
                  );
                return pageLink(n.slug, n.title);
              })}
            </aside>
            <article className="p-4">
              <div className="text-[10px] text-zinc-400">/docs/{slug === 'index' ? '' : slug}</div>
              <h4 className="mt-1 text-base font-bold">{doc.title}</h4>
              <p className={`mt-1 ${ui.muted}`}>{doc.text}</p>
              {doc.body.map((h) => (
                <div key={h} className="mt-3">
                  <div className="font-semibold">{h}</div>
                  <div className="mt-1 h-2 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="mt-1 h-2 w-3/5 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
            </article>
            <nav className="border-l border-zinc-200 p-2 dark:border-zinc-700">
              <div className="mb-1 text-[10px] font-bold text-zinc-400">이 페이지</div>
              {doc.body.map((h) => (
                <div key={h} className="truncate py-0.5 text-zinc-500">{h}</div>
              ))}
            </nav>
          </div>
        </Screen>
      </div>
      <p className={`text-sm ${ui.muted}`}>
        {meta === 'none' && '→ meta.json이 없으면 폴더와 파일이 이름순으로 나온다. 폴더 제목은 그 폴더의 meta.json title(또는 폴더 이름).'}
        {meta === 'ordered' && '→ 적은 순서대로. "...guides"는 가이드 폴더를 펼쳐서 바로 그 자리에 넣고, "api"는 폴더째 들어간다.'}
        {meta === 'rest' && '→ "..."가 아직 안 적은 나머지(guides, installation)를 이름순으로 채우고, "!api"는 빠진다. 링크도 넣을 수 있다.'}
      </p>
    </div>
  );
}
