import { Section, H3, List, Code, OneLiner, WhenToUse, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function E2ETest() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          E2E(End-to-End) 테스트는 <u>실제 브라우저를 띄워 사용자가 하는 것처럼 클릭·입력하며 로그인부터 결제까지 전체 흐름이 되는지</u> 검사하는 테스트입니다.
          Playwright와 Cypress가 대표 도구입니다.
        </OneLiner>

        <Table
          head={['테스트 종류', '대상', '속도', '도구']}
          rows={[
            ['단위(Unit)', '함수 하나, 컴포넌트 하나', '매우 빠름 (ms)', 'Vitest, Jest'],
            ['통합(Integration)', '컴포넌트 + Hook + Mock API', '빠름', 'Testing Library + MSW'],
            ['E2E', '실제 브라우저 + 실제(또는 staging) 서버', '느림 (초~분)', 'Playwright, Cypress'],
          ]}
        />
        <Table
          head={['', 'Playwright', 'Cypress']}
          rows={[
            ['브라우저', 'Chromium, Firefox, WebKit(Safari)', 'Chromium 계열, Firefox (WebKit은 실험적)'],
            ['병렬 실행', '기본 지원, 빠름', '유료(Cloud) 또는 설정 필요'],
            ['여러 탭·도메인', '자연스럽게 지원', '제약 있음'],
            ['디버깅', 'UI 모드, Trace Viewer(실패 시점 DOM·네트워크 되감기)', '시간여행 UI가 직관적'],
            ['언어', 'JS/TS, Python, Java, C#', 'JS/TS'],
          ]}
        />
        <List
          items={[
            <><b>선택자 원칙</b>: CSS 클래스(<Code>.btn-primary</Code>)는 디자인이 바뀌면 깨진다. 사용자가 보는 것(<Code>getByRole('button', {'{ name: \'결제하기\' }'})</Code>, 라벨) 기준으로 찾는다 → 접근성도 같이 좋아진다.</>,
            <><b>Staging에서 실행</b>: 운영과 같은 구성의 테스트 환경에 배포 → E2E 통과 → 운영 배포. 결제는 테스트 모드로.</>,
            <><b>불안정(flaky) 테스트</b>를 줄이려면: 고정 sleep 대신 자동 대기(Playwright는 기본), 테스트끼리 데이터 공유 금지.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>깨지면 돈·신뢰를 잃는 핵심 흐름</b>: 회원가입, 로그인, 장바구니 → 결제, 예약</>,
            '배포 전 staging에서 "주요 시나리오가 다 되는지" 자동 확인 (QA 회귀 테스트 자동화)',
            '여러 브라우저(특히 Safari)에서만 생기는 문제를 잡아야 할 때',
          ]}
          avoid={[
            '모든 경우의 수를 E2E로 — 느리고 깨지기 쉽다. 세부 분기는 단위·통합 테스트로 (테스트 피라미드)',
            '자주 바뀌는 초기 화면 — 유지보수 비용이 더 크다',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: '테스트 작성 보조 (녹화)', path: ['터미널', 'npx playwright codegen localhost:3000'], what: '브라우저에서 클릭하면 그대로 테스트 코드가 생성된다.' },
            { where: '눈으로 보며 실행', path: ['터미널', 'npx playwright test --ui'], what: '단계별 스냅샷, 실패한 줄, 그 시점의 DOM을 확인.' },
            { where: '실패 결과 보고서', path: ['터미널', 'npx playwright show-report'], what: 'HTML 보고서: 실패 스크린샷, 동영상, trace.' },
            { where: 'CI에서', path: ['GitHub', 'Actions', '실행', 'Artifacts', 'playwright-report'], what: 'CI에서 실패한 테스트의 보고서를 내려받아 trace로 원인 확인.' },
          ]}
        />
        <Screen title="Playwright Report">
          <div className="space-y-1.5 p-4">
            <div className="mb-2 flex gap-3"><span className="font-semibold text-emerald-600">passed 11</span><span className="font-semibold text-rose-600">failed 1</span><span className="text-zinc-400">flaky 0 · 34.2s</span></div>
            {[['로그인 › 이메일로 로그인한다', 'chromium', true], ['장바구니 › 상품을 담고 수량을 변경한다', 'chromium', true], ['결제 › 쿠폰을 적용해 결제한다', 'webkit', false], ['결제 › 쿠폰을 적용해 결제한다', 'chromium', true]].map(([n, b, ok], i) => (
              <div key={i} className="flex items-center justify-between rounded border border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
                <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />{n}</span>
                <span className="rounded bg-zinc-100 px-1.5 text-zinc-500 dark:bg-zinc-800">{b}</span>
              </div>
            ))}
            <div className="mt-2 rounded bg-rose-50 p-2 font-mono text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              Error: expect(locator).toHaveText(expected)<br />Expected: "결제 금액 84,000원"<br />Received: "결제 금액 89,000원"
            </div>
          </div>
        </Screen>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="e2e/checkout.spec.ts (Playwright)"
          code={`
import { test, expect } from '@playwright/test';

test('쿠폰을 적용해 결제한다', async ({ page }) => {
  await page.goto('/products/42');
  await page.getByRole('button', { name: '장바구니 담기' }).click();
  await page.getByRole('link', { name: '장바구니' }).click();

  await page.getByLabel('쿠폰 코드').fill('WELCOME5000');
  await page.getByRole('button', { name: '적용' }).click();
  await expect(page.getByText('결제 금액 84,000원')).toBeVisible();   // 나타날 때까지 자동 대기

  await page.getByRole('button', { name: '결제하기' }).click();
  await expect(page).toHaveURL(/\\/orders\\/\\d+/);
});`}
        />
        <CodeBlock
          title="Cypress로 쓰면"
          code={`
it('쿠폰을 적용해 결제한다', () => {
  cy.visit('/products/42');
  cy.findByRole('button', { name: '장바구니 담기' }).click();   // @testing-library/cypress
  cy.findByLabelText('쿠폰 코드').type('WELCOME5000');
  cy.contains('결제 금액 84,000원').should('be.visible');
});`}
        />
        <CodeBlock
          title=".github/workflows/e2e.yml (일부)"
          code={`
- run: npx playwright install --with-deps
- run: npx playwright test
  env: { BASE_URL: \${{ vars.STAGING_URL }} }
- uses: actions/upload-artifact@v4
  if: failure()
  with: { name: playwright-report, path: playwright-report }`}
        />
      </Section>
    </>
  );
}
