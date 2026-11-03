import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen, FolderTree } from '../components/screens.jsx';

export default function AppRouter() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          App Router는 <Code>app/</Code> 폴더 구조가 곧 URL이 되는 Next.js의 라우팅 방식입니다.
          <u>폴더 = 경로, page.tsx = 화면, layout.tsx = 감싸는 틀</u>이고, layout이 중첩되며 페이지를 이동해도 바깥 layout은 다시 그려지지 않습니다.
        </OneLiner>

        <H3>특수 파일</H3>
        <Table
          head={['파일', '역할']}
          rows={[
            [<Code>page.tsx</Code>, '그 경로의 화면. 이 파일이 있어야 URL로 접근 가능'],
            [<Code>layout.tsx</Code>, <>하위 페이지를 <Code>children</Code>으로 감싸는 틀. <b>이동해도 상태가 유지</b>되고 다시 렌더되지 않음</>],
            [<Code>loading.tsx</Code>, '자동으로 Suspense 경계가 됨 → 페이지 데이터 로딩 중 보여줄 UI'],
            [<Code>error.tsx</Code>, '자동으로 Error Boundary가 됨 (클라이언트 컴포넌트여야 함)'],
            [<Code>not-found.tsx</Code>, '404 화면'],
            [<Code>route.ts</Code>, 'API 엔드포인트 (GET, POST 함수 export)'],
            [<Code>template.tsx</Code>, 'layout과 같지만 이동할 때마다 새로 마운트'],
          ]}
        />

        <H3>Dynamic Routing과 폴더 규칙</H3>
        <Table
          head={['폴더 이름', 'URL 예', '설명']}
          rows={[
            [<Code>[id]</Code>, '/products/42', '동적 세그먼트 → params.id = "42"'],
            [<Code>[...slug]</Code>, '/docs/a/b/c', 'catch-all → params.slug = ["a","b","c"]'],
            [<Code>[[...slug]]</Code>, '/docs, /docs/a', 'optional catch-all (없어도 매칭)'],
            [<Code>(group)</Code>, 'URL에 안 나옴', 'Route Group: 폴더 정리, 그룹별로 다른 layout 적용'],
            [<Code>_components</Code>, 'URL에 안 나옴', 'private 폴더: 라우트가 아닌 파일 보관'],
            [<Code>@modal</Code>, '-', 'Parallel Route: 한 화면에 여러 페이지 동시 렌더 (모달, 대시보드 패널)'],
          ]}
        />

        <H3>Layout Composition · Route-based Split · SSR/SSG Hybrid</H3>
        <List
          items={[
            <><b>Layout Composition</b>: 루트 layout(html, 헤더) → (shop) layout(카테고리 사이드바) → page. 공통 UI를 중복 없이 쌓고, 이동 시 바뀌는 부분만 다시 그린다.</>,
            <><b>Route-based Split</b>: 라우트(page)마다 JS 청크가 자동으로 나뉜다. 직접 lazy를 쓸 필요가 없다. (<Link className="text-indigo-600 dark:text-indigo-400" to="/project/project-opti/deep/code-splitting">Code Splitting 심화</Link>)</>,
            <><b>SSR/SSG Hybrid</b>: 페이지마다 <Code>revalidate</Code>, <Code>dynamic</Code> 설정이나 사용하는 함수(cookies() 등)에 따라 정적/동적이 따로 정해진다. (<Link className="text-indigo-600 dark:text-indigo-400" to="/web/spa/deep/rendering-strategy">SSR·SSG·ISR 심화</Link>)</>,
            <><b>서버 컴포넌트가 기본</b>: 파일 맨 위에 <Code>'use client'</Code>가 없으면 서버에서만 실행되고 JS가 브라우저로 안 간다. useState·onClick이 필요한 컴포넌트만 'use client'.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>새 Next.js 프로젝트</b> — 기본값이며, 서버 컴포넌트·스트리밍·중첩 layout을 쓸 수 있다</>,
            '공통 틀(사이드바, 탭)이 있고 그 안만 바뀌는 화면 구조 — 중첩 layout이 딱 맞음',
            '페이지마다 정적/동적 렌더링을 섞어야 하는 서비스 (커머스: 메인 SSG, 상품 ISR, 마이페이지 SSR)',
          ]}
          avoid={[
            '이미 Pages Router로 안정적으로 운영 중인 큰 프로젝트를 한 번에 전환 — 두 방식은 공존할 수 있으니 점진적으로',
            '모든 컴포넌트에 \'use client\' — 서버 컴포넌트의 장점(JS 감소)이 사라진다',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <div className="grid gap-4 lg:grid-cols-2">
          <FolderTree
            title="app/ 폴더 → URL"
            lines={[
              'app/',
              '  layout.tsx            # 모든 페이지의 틀 (html, body, 헤더)',
              '  page.tsx              # /',
              '  (shop)/               # URL에 안 나옴',
              '    layout.tsx          # 쇼핑 영역 공통 사이드바',
              '    products/',
              '      page.tsx          # /products',
              '      loading.tsx       # 목록 로딩 UI',
              '      [id]/',
              '        page.tsx        # /products/42',
              '        error.tsx',
              '  (auth)/',
              '    login/page.tsx      # /login (사이드바 없음)',
              '  api/',
              '    cart/route.ts       # GET/POST /api/cart',
            ]}
          />
          <Screen title="/products/42 일 때 렌더되는 구조">
            <div className="space-y-2 p-4">
              <div className="rounded-lg border-2 border-indigo-400 p-2">
                <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-300">app/layout.tsx — 헤더 (이동해도 유지)</div>
                <div className="mt-2 rounded-lg border-2 border-sky-400 p-2">
                  <div className="font-mono text-[11px] text-sky-600 dark:text-sky-300">(shop)/layout.tsx — 사이드바 (유지)</div>
                  <div className="mt-2 rounded-lg border-2 border-dashed border-amber-400 p-2">
                    <div className="font-mono text-[11px] text-amber-600 dark:text-amber-300">loading.tsx → Suspense 경계</div>
                    <div className="mt-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                      <div className="font-mono text-[11px]">products/[id]/page.tsx — 이것만 교체됨</div>
                      <div className="mt-1 text-sm font-semibold">무선 이어폰 X2 · params.id = "42"</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Screen>
        </div>
        <WhereToCheck
          items={[
            { where: '라우트별 렌더링 방식·크기', path: ['터미널', 'next build', 'Route (app) 표'], what: '○ Static / ● SSG / ƒ Dynamic 기호와 페이지별 JS 크기.' },
            { where: '어떤 컴포넌트가 서버/클라이언트인지', path: ['F12', 'Components (React DevTools)'], what: '서버 컴포넌트는 Server 배지가 붙어 표시된다(최신 DevTools).' },
            { where: '페이지 이동 시 받는 데이터', path: ['F12', 'Network', 'Fetch/XHR', '?_rsc= 요청'], what: '링크 이동 때 HTML 대신 RSC payload(서버 컴포넌트 결과)를 받아 바뀐 부분만 교체한다.' },
          ]}
        />
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="app/(shop)/layout.tsx — 중첩 layout"
          code={`
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <CategorySidebar />      {/* 상품 사이를 이동해도 다시 렌더되지 않음 */}
      <main>{children}</main>
    </div>
  );
}`}
        />
        <CodeBlock
          title="app/(shop)/products/[id]/page.tsx — 동적 라우트 + 정적 생성"
          code={`
// 빌드 때 미리 만들 id 목록 (getStaticPaths 대체)
export async function generateStaticParams() {
  const products = await getPopularProducts();
  return products.map((p) => ({ id: String(p.id) }));
}
export const revalidate = 60;  // ISR

export async function generateMetadata({ params }) {   // SEO 메타 태그
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product.name };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;              // Next.js 15+: params는 Promise
  const product = await getProduct(id);     // 서버에서 바로 데이터 요청
  return (
    <>
      <h1>{product.name}</h1>
      <AddToCartButton id={id} />           {/* 'use client' 컴포넌트 */}
    </>
  );
}`}
        />
        <CodeBlock
          title="app/(shop)/products/loading.tsx · error.tsx"
          code={`
export default function Loading() {
  return <ProductListSkeleton />;   // 자동으로 <Suspense fallback>이 된다
}

'use client';
export default function Error({ error, reset }) {
  return <button onClick={reset}>다시 시도</button>;  // 자동으로 Error Boundary
}`}
        />
        <Callout title="Pages Router와 비교">
          <p><Code>pages/products/[id].tsx</Code> + <Code>getStaticProps</Code> 방식은 Pages Router입니다. App Router에서는 컴포넌트가 async 함수로 직접 데이터를 받고, <Code>_app.tsx</Code> 대신 <Code>layout.tsx</Code>를 씁니다.</p>
        </Callout>
      </Section>
    </>
  );
}
