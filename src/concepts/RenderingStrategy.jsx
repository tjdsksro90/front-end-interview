import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function RenderingStrategy() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Pre-rendering은 HTML을 브라우저가 아니라 <u>서버(또는 빌드)에서 미리 만들어 보내는 것</u>이고, 그 HTML을 <u>언제</u> 만드느냐에 따라
          요청마다 만드는 SSR, 빌드 때 한 번 만드는 SSG, 빌드 후에도 주기적으로 다시 만드는 ISR로 나뉩니다.
        </OneLiner>

        <Table
          head={['', 'CSR', 'SSR', 'SSG', 'ISR']}
          rows={[
            ['HTML 만드는 때', '브라우저에서 JS 실행 후', '요청이 올 때마다 서버에서', '빌드할 때 한 번', '빌드 때 + N초마다 백그라운드로 다시'],
            ['처음 받는 HTML', '빈 <div id="root">', '내용이 채워진 HTML', '내용이 채워진 HTML (CDN 캐시)', '내용이 채워진 HTML (CDN 캐시)'],
            ['데이터 신선도', '항상 최신', '항상 최신', '빌드 시점에 고정', 'N초 이내로 최신'],
            ['첫 화면(LCP)', '느림 (JS 받고 실행 후)', '빠름 (서버 처리 시간만큼 TTFB↑)', '가장 빠름', '가장 빠름'],
            ['서버 부하', '없음', '요청마다', '없음', '가끔'],
            ['예', '관리자 대시보드', '검색 결과, 개인화 페이지', '블로그 글, 회사 소개', '상품 상세, 뉴스 목록'],
          ]}
        />

        <H3>Hydration과 TTI</H3>
        <List
          items={[
            <>SSR/SSG로 받은 HTML은 <b>바로 보이지만 아직 클릭이 안 된다</b>. JS가 내려와서 이벤트 핸들러를 붙이는 과정이 hydration.</>,
            <><b>TTI(Time to Interactive)</b>: 화면이 보이는 것(FCP/LCP)과 실제로 조작 가능한 시점의 차이. JS가 크면 "보이는데 안 눌리는" 시간이 길어진다.</>,
            <>그래서 SSR을 써도 JS 번들을 줄이는 게 중요하다. App Router의 서버 컴포넌트는 JS를 아예 안 보내서 이 문제를 줄인다. (Lighthouse에서 TTI는 이제 공식 지표가 아니고, 대신 TBT·INP를 본다)</>,
          ]}
        />

        <H3>Edge Function</H3>
        <List
          items={[
            <>서버 코드를 한 지역 서버가 아니라 <b>사용자와 가까운 CDN 엣지</b>에서 실행. 왕복 거리가 짧아 TTFB가 줄어든다.</>,
            <>쓰임: 미들웨어(로그인 체크, 국가별 리다이렉트, A/B 분기), 가벼운 SSR/API.</>,
            <>제약: Node.js API 전체를 쓸 수 없고(fs 등), 실행 시간·용량 제한이 있다. DB가 한 지역에 있으면 오히려 느려질 수 있다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>SSG</b>: 모든 사용자에게 같은 내용, 자주 안 바뀜 — 블로그, 문서, 랜딩 페이지</>,
            <><b>ISR</b>: 페이지가 많고 가끔 바뀜 — 상품 상세 수만 개를 빌드 때 다 만들 수 없을 때</>,
            <><b>SSR</b>: 요청마다 달라야 함 — 로그인 사용자별 화면, 검색 결과, 실시간 재고</>,
            <><b>Hybrid</b>: 한 앱 안에서 페이지마다 다르게 (메인 SSG, 상품 ISR, 마이페이지 SSR)</>,
            <><b>SEO와 첫 화면 속도(LCP)</b>가 중요한 페이지는 CSR보다 Pre-rendering</>,
          ]}
          avoid={[
            '로그인 뒤에만 보이는 관리자 화면 — SEO가 필요 없어 CSR로 충분',
            '모든 페이지 SSR — 서버 비용과 TTFB가 늘어난다. 바뀌지 않는 페이지는 SSG/ISR로',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: '페이지가 미리 렌더링됐는지', path: ['페이지에서 마우스 오른쪽', '페이지 소스 보기 (Ctrl+U)'], what: 'HTML 안에 실제 글 내용이 있으면 Pre-rendering(SSR/SSG), <div id="root"></div>만 있으면 CSR.' },
            { where: '페이지별 렌더링 방식', path: ['터미널', 'next build', '출력 표의 Route 앞 기호'], what: '○ Static(SSG), ● SSG(데이터 포함), ƒ Dynamic(SSR). ISR은 Revalidate 열에 주기가 표시된다.' },
            { where: 'ISR 캐시 상태', path: ['F12', 'Network', '문서 요청 클릭', 'Response Headers'], what: 'x-nextjs-cache: HIT(캐시) / STALE(낡은 것 주고 뒤에서 재생성) / MISS. Vercel이면 x-vercel-cache.' },
            { where: 'JS 없이 보이는지 (hydration 전 상태)', path: ['F12', 'Ctrl+Shift+P', 'Disable JavaScript', '새로고침'], what: 'SSR/SSG 페이지는 JS를 꺼도 내용이 보이고, CSR은 빈 화면이 된다.' },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Screen title="Terminal — next build" dark>
            <pre className="p-4 font-mono leading-relaxed">{`Route (app)                    Size   Revalidate
┌ ○ /                          1.2 kB
├ ○ /about                     800 B
├ ● /blog/[slug]               2.1 kB
├ ○ /products/[id]             3.4 kB    1m
└ ƒ /search                    2.8 kB

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand`}</pre>
          </Screen>
          <Screen title="view-source: CSR vs SSR">
            <div className="grid gap-px bg-zinc-200 dark:bg-zinc-700">
              <pre className="bg-white p-3 font-mono dark:bg-zinc-900">{`<!-- CSR -->
<body>
  <div id="root"></div>
  <script src="/main.js"></script>
</body>`}</pre>
              <pre className="bg-white p-3 font-mono dark:bg-zinc-900">{`<!-- SSR / SSG -->
<body>
  <div id="__next">
    <h1>무선 이어폰 X2</h1>
    <p>89,000원 · 재고 12개</p>
  </div>
  <script src="/_next/static/chunks/..."></script>
</body>`}</pre>
            </div>
          </Screen>
        </div>
      </Section>

      <Section step={3} title="코드">
        <H3>Pages Router</H3>
        <CodeBlock
          code={`
// SSG + ISR: 빌드 때 만들고, 60초마다 백그라운드에서 다시 생성
export async function getStaticProps({ params }) {
  const product = await getProduct(params.id);
  return { props: { product }, revalidate: 60 };
}
export async function getStaticPaths() {
  return { paths: [{ params: { id: '1' } }], fallback: 'blocking' }; // 나머지는 첫 요청 때 생성
}

// SSR: 요청마다 실행
export async function getServerSideProps({ req }) {
  const user = await getUser(req.cookies.token);
  return { props: { user } };
}`}
        />
        <H3>App Router</H3>
        <CodeBlock
          code={`
// app/products/[id]/page.tsx — 서버 컴포넌트에서 바로 fetch
export const revalidate = 60;                 // ISR (60초)
// export const dynamic = 'force-dynamic';    // 매 요청 SSR
// export const dynamic = 'force-static';     // SSG

export default async function Page({ params }) {
  const { id } = await params;
  const product = await fetch(\`https://api.example.com/products/\${id}\`, {
    next: { revalidate: 60, tags: ['product'] },  // 요청 단위 캐시 설정
  }).then((r) => r.json());
  return <h1>{product.name}</h1>;
}

// 데이터가 바뀌었을 때 즉시 갱신 (On-demand ISR)
import { revalidateTag } from 'next/cache';
revalidateTag('product');`}
        />
        <H3>Edge에서 실행</H3>
        <CodeBlock
          code={`
// middleware.ts — 모든 요청 앞에서 엣지로 실행
import { NextResponse } from 'next/server';

export function middleware(request) {
  if (!request.cookies.get('token')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
export const config = { matcher: ['/mypage/:path*'] };

// 라우트 핸들러/페이지를 Edge Runtime으로
export const runtime = 'edge';`}
        />
        <Callout title="참고">
          <p>Next.js 15부터 App Router의 fetch는 기본으로 캐시하지 않습니다(이전엔 기본 캐시). 버전에 따라 기본값이 다르니 프로젝트의 Next.js 버전을 확인하세요.</p>
        </Callout>
      </Section>
    </>
  );
}
