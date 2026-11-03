import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, FolderTree } from '../components/screens.jsx';

export default function FolderStructure() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          폴더 구조 설계는 "파일을 어디에 두고, 누가 누구를 import해도 되는가"를 정하는 일입니다.
          <u>Atomic Design은 UI 크기(원자→분자→유기체)로</u>, <u>FSD는 기능과 층(layer)으로</u> 나누고 위에서 아래로만 의존하게 합니다.
        </OneLiner>

        <H3>Atomic Design — UI 컴포넌트를 크기로 나누기</H3>
        <Table
          head={['단계', '뜻', '예']}
          rows={[
            ['atoms (원자)', '더 쪼갤 수 없는 기본 UI', 'Button, Input, Icon, Label'],
            ['molecules (분자)', '원자 몇 개의 조합', 'SearchBar = Input + Button'],
            ['organisms (유기체)', '독립적인 화면 구역', 'Header, ProductCard 목록'],
            ['templates', '데이터 없이 배치만 정한 레이아웃', '2단 레이아웃'],
            ['pages', '실제 데이터가 들어간 화면', 'ProductListPage'],
          ]}
        />
        <List
          items={[
            <>디자인 시스템·UI 라이브러리를 만들 때 잘 맞는다 (Storybook 분류와도 맞음).</>,
            <>단점: "이게 분자야 유기체야?" 기준이 모호하고, <b>비즈니스 로직(API, 상태)을 어디에 둘지</b>는 말해주지 않는다.</>,
          ]}
        />

        <H3>FSD (Feature-Sliced Design) — 기능과 층으로 나누기</H3>
        <Table
          head={['층 (위 → 아래)', '역할', '예']}
          rows={[
            ['app', '앱 초기화: 라우터, Provider, 전역 스타일', 'providers, router'],
            ['pages', '라우트 단위 화면 = 아래 층들을 조립', 'product-detail'],
            ['widgets', '여러 기능이 합쳐진 큰 블록', 'Header, ProductList'],
            ['features', <><b>사용자 행동</b> 단위 기능</>, 'add-to-cart, search-product, login'],
            ['entities', <><b>비즈니스 개체</b>: 타입, API, 기본 UI</>, 'product, user, cart'],
            ['shared', '도메인과 무관한 공용 코드', 'ui/Button, api/client, lib/format'],
          ]}
        />
        <List
          items={[
            <><b>규칙 1 — 아래로만 import</b>: features는 entities·shared를 쓸 수 있지만, entities가 features를 import하면 안 된다. 같은 층끼리도 서로 import 금지.</>,
            <><b>규칙 2 — slice 안은 segment로</b>: <Code>ui/</Code>, <Code>model/</Code>(상태), <Code>api/</Code>, <Code>lib/</Code></>,
            <><b>규칙 3 — public API</b>: 각 slice는 <Code>index.ts</Code>로 내보낼 것만 내보내고, 밖에서는 그 안쪽 파일을 직접 import하지 않는다.</>,
            <>효과: "장바구니 담기 기능"을 고칠 때 <Code>features/add-to-cart</Code>만 보면 되고, 의존 방향이 한쪽이라 순환 참조가 생기지 않는다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>Atomic</b>: 디자인 시스템, 공용 UI 컴포넌트 패키지</>,
            <><b>FSD</b>: 기능이 많고 여러 명이 함께 개발하는 중대형 서비스 — 기능별로 담당·수정 범위가 명확해진다</>,
            <><b>혼합</b>: 앱은 FSD, 그 안의 <Code>shared/ui</Code>는 Atomic처럼 — 실무에서 흔하다</>,
            '"이 코드 어디 둬요?"라는 질문이 자주 나오고, 순환 참조가 생기기 시작할 때',
          ]}
          avoid={[
            '작은 프로젝트·토이 프로젝트 — components / hooks / pages 정도로 충분하다',
            '규칙을 강제할 도구 없이 FSD 흉내만 내기 — 금방 무너진다 (아래 ESLint 규칙 참고)',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <div className="grid gap-4 lg:grid-cols-2">
          <FolderTree
            title="Atomic Design"
            lines={[
              'src/',
              '  components/',
              '    atoms/',
              '      Button.tsx',
              '      Input.tsx',
              '    molecules/',
              '      SearchBar.tsx   # Input + Button',
              '    organisms/',
              '      Header.tsx',
              '      ProductGrid.tsx',
              '    templates/',
              '      MainLayout.tsx',
              '  pages/',
              '    ProductListPage.tsx',
              '  hooks/   # 로직은 따로 모아둠',
              '  api/',
            ]}
          />
          <FolderTree
            title="FSD (Feature-Sliced Design)"
            lines={[
              'src/',
              '  app/          # Provider, 라우터',
              '  pages/',
              '    product-detail/',
              '  widgets/',
              '    header/',
              '  features/',
              '    add-to-cart/',
              '      ui/AddToCartButton.tsx',
              '      model/useAddToCart.ts',
              '      index.ts  # public API',
              '  entities/',
              '    product/',
              '      api/getProduct.ts',
              '      model/types.ts',
              '      ui/ProductCard.tsx',
              '  shared/',
              '    ui/Button.tsx',
              '    api/client.ts',
            ]}
          />
        </div>
        <WhereToCheck
          items={[
            { where: '규칙 위반 확인 (FSD)', path: ['터미널', 'npx steiger ./src'], what: 'FSD 공식 린터. 잘못된 층 간 import, public API를 거치지 않은 import를 알려준다.' },
            { where: '의존 방향 시각화', path: ['터미널', 'npx madge --circular src'], what: '순환 참조 목록. --image graph.svg로 의존성 그래프 그림도 만들 수 있다.' },
            { where: '참고 예제', path: ['feature-sliced.design', 'Examples'], what: 'FSD로 만든 실제 프로젝트 목록과 층별 설명.' },
          ]}
        />
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="features/add-to-cart/index.ts — public API"
          code={`
// 밖에서는 이 파일로만 접근한다
export { AddToCartButton } from './ui/AddToCartButton';
export { useAddToCart } from './model/useAddToCart';

// 사용하는 쪽 (widgets/product-list)
import { AddToCartButton } from '@/features/add-to-cart';          // 좋은 예
// import { AddToCartButton } from '@/features/add-to-cart/ui/...'; // 나쁜 예: 내부 파일 직접 접근`}
        />
        <CodeBlock
          title=".eslintrc — 아래 층으로만 import 하도록 강제"
          code={`
// eslint-plugin-boundaries 예시
"boundaries/element-types": ["error", {
  "default": "disallow",
  "rules": [
    { "from": "pages",    "allow": ["widgets", "features", "entities", "shared"] },
    { "from": "widgets",  "allow": ["features", "entities", "shared"] },
    { "from": "features", "allow": ["entities", "shared"] },
    { "from": "entities", "allow": ["shared"] },
    { "from": "shared",   "allow": ["shared"] }
  ]
}]`}
        />
        <Callout title="Clean Architecture와의 관계">
          <p>FSD는 "폴더를 어떻게 나눌까", Clean Architecture는 "UI·비즈니스 규칙·외부(API)를 어떤 층으로 나눌까"에 가깝습니다. 비즈니스 로직 분리는 같은 질문의 <b>Clean Architecture & 비즈니스 로직 분리</b> 심화에서 다룹니다.</p>
        </Callout>
      </Section>
    </>
  );
}
