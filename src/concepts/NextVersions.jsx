import { Link } from 'react-router-dom';
import { Section, H3, Code, OneLiner, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, FolderTree } from '../components/screens.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

const TIMELINE = [
  { v: '9', date: '2019.07', title: '동적 라우팅 · API Routes', desc: 'pages/[id].js, pages/api. 9.3에서 getStaticProps·getServerSideProps(SSG/SSR), 9.5에서 ISR 정식.' },
  { v: '10', date: '2020.10', title: 'next/image', desc: '이미지 최적화 컴포넌트, 국제화 라우팅.' },
  { v: '12', date: '2021.10', title: 'SWC · Middleware', desc: 'Babel 대신 Rust 기반 컴파일러(SWC)로 빌드 속도 향상. Middleware(beta), React 18 지원.' },
  { v: '13', date: '2022.10', title: 'app 디렉터리 (beta)', major: true, desc: 'Pages Router → App Router의 시작. 중첩 layout, React Server Components, 스트리밍. Turbopack(alpha), next/font.' },
  { v: '13.4', date: '2023.05', title: 'App Router 정식', major: true, desc: 'App Router가 stable이 됨. Server Actions(실험적).' },
  { v: '14', date: '2023.10', title: 'Server Actions 정식', desc: '폼·버튼에서 서버 함수를 직접 호출. Partial Prerendering(미리보기). 큰 구조 변화는 없음.' },
  { v: '15', date: '2024.10', title: 'React 19 · 캐시 기본값 변경', major: true, desc: 'React 19 지원. params·cookies() 등이 async로 바뀜. fetch·GET Route Handler가 기본으로 캐시되지 않게 변경. Turbopack dev 정식.' },
  { v: '16', date: '2025.10', title: 'Turbopack 기본 · Cache Components', major: true, desc: 'Turbopack이 기본 번들러. "use cache"로 캐시를 명시하는 Cache Components. React Compiler 정식 지원. middleware.ts → proxy.ts.' },
  { v: '16.3', date: '2026.08', title: 'Instant Navigations', desc: '서버 중심 구조에서도 SPA처럼 즉각적인 화면 전환을 위한 도구들.' },
];

export default function NextVersions() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Next.js의 가장 큰 변화는 <u>13에서 시작해 13.4에서 정식이 된 App Router</u>입니다. <Code>pages/</Code>의 파일 기반 라우팅 + getServerSideProps 방식에서,
          <Code>app/</Code>의 <u>중첩 layout + React Server Components + 스트리밍</u> 방식으로 바뀌었습니다. 이후 15·16은 캐시 기본값과 번들러(Turbopack)를 정리한 버전입니다.
        </OneLiner>
        <Callout title="13 → 14가 아니라 12 → 13에서 바뀌었어요">
          <p>page에서 app으로 바뀐 건 <b>13(2022.10, beta)</b>이고 <b>13.4(2023.05)</b>에서 정식이 됐습니다. 14는 Server Actions를 정식으로 만든 버전이라, 실무에서 "13~14부터 App Router를 썼다"고 함께 묶어 말하는 경우가 많습니다.</p>
        </Callout>

        <H3>버전 타임라인</H3>
        <ol className="relative space-y-4 border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
          {TIMELINE.map((t) => (
            <li key={t.v} className="relative">
              <span className={`absolute top-1.5 -left-[31px] h-3 w-3 rounded-full ${t.major ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:bg-indigo-400 dark:ring-indigo-500/20' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm font-bold">Next.js {t.v}</span>
                <span className="text-xs text-zinc-400">{t.date}</span>
                <span className="font-semibold">{t.title}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.desc}</p>
            </li>
          ))}
        </ol>

        <H3>Pages Router vs App Router</H3>
        <Table
          head={['', 'Pages Router (~12)', 'App Router (13~)']}
          rows={[
            ['폴더', <Code>pages/about.tsx</Code>, <Code>app/about/page.tsx</Code>],
            ['컴포넌트 기본값', '모두 클라이언트 컴포넌트 (전부 hydration)', <>서버 컴포넌트. 필요한 곳만 <Code>'use client'</Code></>],
            ['데이터 요청', <><Code>getServerSideProps</Code>, <Code>getStaticProps</Code> (페이지 단위)</>, <>컴포넌트가 <Code>async</Code>로 직접 fetch (컴포넌트 단위)</>],
            ['공통 레이아웃', <><Code>_app.tsx</Code> 하나 + 페이지별로 직접 감싸기</>, <>폴더마다 <Code>layout.tsx</Code>가 중첩, 이동해도 유지</>],
            ['로딩·에러', '직접 구현', <><Code>loading.tsx</Code>(Suspense), <Code>error.tsx</Code>(Error Boundary)</>],
            ['HTML 전송', '페이지 데이터가 다 준비된 뒤 한 번에', '준비된 부분부터 스트리밍'],
            ['API', <Code>pages/api/*.ts</Code>, <><Code>app/**/route.ts</Code> (Route Handler), Server Actions</>],
            ['라우터 Hook', <Code>next/router</Code>, <><Code>next/navigation</Code> (useRouter, usePathname, useSearchParams)</>],
          ]}
        />

        <H3>App Router의 장점과 단점</H3>
        <ProsCons
          pros={[
            <><b>JS 번들 감소</b>: 서버 컴포넌트는 브라우저로 JS가 가지 않는다. 데이터 표시만 하는 부분이 많을수록 이득</>,
            <><b>데이터 요청이 가까워짐</b>: 필요한 컴포넌트에서 바로 await. props로 페이지 끝까지 내려보내는 drilling이 줄어든다</>,
            <><b>중첩 layout</b>: 사이드바·탭이 이동해도 유지되고 다시 그려지지 않는다</>,
            <><b>스트리밍</b>: 느린 영역만 loading으로 두고 나머지를 먼저 보여줘 첫 화면이 빨라진다</>,
            <><b>Server Actions</b>: API 라우트 없이 폼에서 서버 함수 호출</>,
          ]}
          cons={[
            <><b>학습 비용</b>: 서버/클라이언트 경계, 'use client' 위치, 직렬화 가능한 props만 넘길 수 있는 규칙</>,
            <><b>캐시가 복잡</b>: 13~14의 "기본으로 캐시" 정책이 혼란스러워 15에서 기본값을 바꾸고 16에서 "use cache"로 다시 정리했다</>,
            <><b>라이브러리 호환</b>: Context·useState를 쓰는 라이브러리는 클라이언트 컴포넌트로 감싸야 한다 (CSS-in-JS 등)</>,
            <><b>마이그레이션 비용</b>: 큰 Pages Router 프로젝트는 두 방식을 공존시키며 점진적으로 옮겨야 한다</>,
          ]}
        />

        <Callout type="tip" title="면접 포인트">
          <p>"Next.js 13에서 App Router가 도입되면서 기본 컴포넌트가 서버 컴포넌트가 됐고, 데이터 요청이 페이지 단위(getServerSideProps)에서 컴포넌트 단위(async 컴포넌트)로 바뀌었다. 그래서 클라이언트 JS가 줄고 스트리밍이 가능해졌지만, 서버/클라이언트 경계와 캐시 정책을 이해해야 한다는 비용이 생겼다."</p>
          <p>App Router 자체의 폴더 규칙은 <Link className={linkCls} to="/react/app-router/deep/app-router">App Router 심화</Link>에 정리돼 있습니다.</p>
        </Callout>
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <div className="grid gap-4 lg:grid-cols-2">
          <FolderTree
            title="Pages Router (~12)"
            lines={[
              'pages/',
              '  _app.tsx             # 모든 페이지 공통 (레이아웃 1개)',
              '  _document.tsx        # html, body',
              '  index.tsx            # /',
              '  products/',
              '    index.tsx          # /products',
              '    [id].tsx           # /products/42 + getServerSideProps',
              '  api/',
              '    cart.ts            # /api/cart',
            ]}
          />
          <FolderTree
            title="App Router (13~)"
            lines={[
              'app/',
              '  layout.tsx           # html, body + 공통 레이아웃',
              '  page.tsx             # /',
              '  products/',
              '    layout.tsx         # 상품 영역 전용 레이아웃 (중첩)',
              '    page.tsx           # /products',
              '    loading.tsx        # 로딩 UI (Suspense)',
              '    [id]/page.tsx      # /products/42 (async 컴포넌트)',
              '  api/cart/route.ts    # /api/cart',
            ]}
          />
        </div>
        <WhereToCheck
          items={[
            { where: '프로젝트가 어느 라우터를 쓰는지', path: ['프로젝트 루트', 'app/ 또는 pages/ 폴더'], what: '둘 다 있으면 공존 중. 같은 경로가 겹치면 빌드 에러.' },
            { where: 'Next.js 버전', path: ['package.json', 'dependencies', 'next'], what: '업그레이드는 npx @next/codemod@latest upgrade로 버전별 변경을 자동 반영.' },
            { where: '페이지별 정적/동적 여부', path: ['터미널', 'next build', 'Route 표'], what: '○ Static, ƒ Dynamic 기호. App Router는 페이지마다 따로 정해진다.' },
          ]}
        />
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="같은 상품 상세 페이지: Pages Router"
          code={`
// pages/products/[id].tsx
export async function getServerSideProps({ params }) {
  const product = await getProduct(params.id);
  return { props: { product } };          // 페이지에서 받아서 아래로 props 전달
}

export default function ProductPage({ product }) {
  return (
    <Layout>                              {/* 페이지마다 직접 감싸기 */}
      <h1>{product.name}</h1>
      <Reviews productId={product.id} />  {/* 리뷰 데이터는 클라이언트에서 따로 fetch */}
    </Layout>
  );
}`}
        />
        <CodeBlock
          title="같은 페이지: App Router (Next.js 15+)"
          code={`
// app/products/[id]/page.tsx — 서버 컴포넌트
export default async function ProductPage({ params }) {
  const { id } = await params;            // 15부터 params는 Promise
  const product = await getProduct(id);   // 컴포넌트에서 바로 요청
  return (
    <>
      <h1>{product.name}</h1>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={id} />        {/* 느린 리뷰만 나중에 스트리밍 */}
      </Suspense>
    </>
  );
}

async function Reviews({ productId }) {   // 리뷰도 서버에서 요청 (JS 0KB)
  const reviews = await getReviews(productId);
  return reviews.map((r) => <p key={r.id}>{r.text}</p>);
}`}
        />
        <CodeBlock
          title="버전별 캐시 방식의 변화"
          code={`
// 13~14: fetch가 기본으로 캐시됨 (끄려면 명시)
await fetch(url, { cache: 'no-store' });

// 15: 기본이 캐시 안 함 (켜려면 명시)
await fetch(url, { cache: 'force-cache' });

// 16: Cache Components — 캐시할 함수·컴포넌트에 직접 표시
async function getProducts() {
  'use cache';
  return db.product.findMany();
}`}
        />
      </Section>
    </>
  );
}

function ProsCons({ pros, cons }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[
        ['장점', pros, 'bg-emerald-50 dark:bg-emerald-500/10', 'text-emerald-700 dark:text-emerald-300', 'marker:text-emerald-500'],
        ['단점', cons, 'bg-rose-50 dark:bg-rose-500/10', 'text-rose-700 dark:text-rose-300', 'marker:text-rose-400'],
      ].map(([title, items, bg, color, marker]) => (
        <div key={title} className={`rounded-xl p-5 ${bg}`}>
          <h3 className={`font-bold ${color}`}>{title}</h3>
          <ul className={`mt-2 list-disc space-y-1.5 pl-5 text-sm ${marker}`}>
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
