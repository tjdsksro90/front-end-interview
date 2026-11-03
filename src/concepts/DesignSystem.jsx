import { Section, H3, List, Code, OneLiner, WhenToUse, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function DesignSystem() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          디자인 시스템은 색·글꼴·간격 같은 <u>디자인 결정(Design Token)과 그걸로 만든 컴포넌트(Component Library)를 한 벌로 정리해 디자이너와 개발자가 같은 기준을 쓰게 하는 것</u>이고,
          Storybook은 그 컴포넌트를 앱과 분리해 상태별로 보여주고 문서화하는 도구입니다.
        </OneLiner>

        <H3>구성 요소</H3>
        <Table
          head={['층', '뜻', '예']}
          rows={[
            ['Design Token', '디자인 값에 이름을 붙인 것. 원시값(primitive) → 의미값(semantic)', <><Code>blue-600: #2563eb</Code> → <Code>color-primary: blue-600</Code></>],
            ['기본 컴포넌트', '토큰으로 만든 재사용 UI', 'Button, Input, Modal, Toast'],
            ['패턴·가이드', '언제 어떤 컴포넌트를 쓰는지, 접근성 규칙', '"위험한 동작은 danger 버튼 + 확인 모달"'],
            ['도구', '토큰 동기화, 문서화, 시각 테스트', 'Figma Variables, Style Dictionary, Storybook, Chromatic'],
          ]}
        />
        <List
          items={[
            <><b>토큰이 왜 중요?</b> 다크모드·브랜드 변경 시 컴포넌트 수백 개를 고치는 대신 의미 토큰의 값만 바꾼다. Figma Variables와 코드 토큰 이름을 맞추면 디자이너와 "primary"라는 같은 단어로 대화한다.</>,
            <><b>Storybook의 story</b> = 컴포넌트의 한 가지 상태 (Primary, Disabled, Loading). 앱을 띄워 그 화면까지 가지 않아도 모든 상태를 바로 확인한다.</>,
            <>Storybook은 문서(Docs 탭 자동 생성), 인터랙션 테스트, 접근성 검사(a11y addon), 시각 회귀 테스트(Chromatic)까지 이어진다.</>,
            <>Headless UI(Radix, React Aria)를 바탕으로 스타일만 입히면 접근성과 키보드 동작을 직접 다 짤 필요가 없다. (shadcn/ui가 이 방식)</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>여러 화면·여러 서비스가 같은 UI를 써야 할 때</b>: 사용자 웹 + 관리자 + 앱 웹뷰</>,
            '디자이너와 개발자 사이에 "이 버튼 색이 왜 달라요?"가 반복될 때',
            '같은 컴포넌트를 여러 명이 비슷하게 다시 만들고 있을 때',
            'Storybook: 공용 컴포넌트를 만들거나, 상태가 많은 컴포넌트를 독립적으로 개발할 때',
          ]}
          avoid={[
            '화면이 몇 개 없는 초기 서비스 — 기존 라이브러리(MUI, shadcn/ui)로 충분',
            '쓰는 사람이 없는데 문서만 쌓기 — 실제 화면에서 쓰이는 컴포넌트부터',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: 'Storybook 실행', path: ['터미널', 'npx storybook@latest init', 'npm run storybook', 'localhost:6006'], what: '왼쪽 트리에서 컴포넌트·story 선택, 아래 Controls 탭에서 props를 바꿔보며 확인.' },
            { where: '공개 디자인 시스템 둘러보기', path: ['storybook.js.org/showcase'], what: 'GitHub Primer, Shopify Polaris, IBM Carbon 등 실제 기업 디자인 시스템의 Storybook.' },
            { where: 'Figma의 토큰', path: ['Figma', '오른쪽 패널 Local variables'], what: '색·간격 변수를 모드(Light/Dark)별로 관리. Dev Mode에서 코드용 이름을 확인.' },
          ]}
        />
        <Screen title="Storybook — localhost:6006">
          <div className="grid min-w-[560px] grid-cols-[160px_1fr]">
            <div className="space-y-1 border-r border-zinc-200 p-3 dark:border-zinc-700">
              <div className="text-[10px] font-bold text-zinc-400">COMPONENTS</div>
              <div>▾ Button</div>
              <div className="ml-3 rounded bg-indigo-500 px-2 py-0.5 text-white">Primary</div>
              <div className="ml-3 px-2">Secondary</div>
              <div className="ml-3 px-2">Disabled</div>
              <div className="ml-3 px-2">Loading</div>
              <div>▸ Input</div>
              <div>▸ Modal</div>
            </div>
            <div>
              <div className="grid h-28 place-items-center border-b border-zinc-200 dark:border-zinc-700">
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">결제하기</button>
              </div>
              <div className="flex gap-4 border-b border-zinc-200 px-3 py-1.5 text-zinc-500 dark:border-zinc-700"><span className="font-semibold text-indigo-600">Controls</span><span>Actions</span><span>Accessibility</span></div>
              <table className="w-full text-left">
                <tbody>
                  {[['variant', 'primary ▾'], ['size', 'md ▾'], ['disabled', '○ false'], ['children', '결제하기']].map(([k, v]) => (
                    <tr key={k} className="border-b border-zinc-100 dark:border-zinc-800"><td className="px-3 py-1.5 font-mono">{k}</td><td className="px-3 py-1.5">{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Screen>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="tokens — 원시 토큰 → 의미 토큰"
          code={`
/* primitive: 팔레트 그대로 */
:root {
  --blue-600: #2563eb;
  --gray-900: #18181b;
  --space-2: 8px;
  --radius-md: 8px;
}
/* semantic: 용도에 이름을 붙임 → 컴포넌트는 이것만 사용 */
:root {
  --color-primary: var(--blue-600);
  --color-text: var(--gray-900);
}
[data-theme='dark'] {
  --color-primary: #60a5fa;
  --color-text: #f4f4f5;
}`}
        />
        <CodeBlock
          title="Button.stories.tsx"
          code={`
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  args: { children: '결제하기' },
  tags: ['autodocs'],                 // Docs 페이지 자동 생성
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };`}
        />
        <CodeBlock
          title="Button.tsx — 토큰 + variant (cva)"
          code={`
import { cva } from 'class-variance-authority';

const button = cva('rounded-[var(--radius-md)] font-semibold', {
  variants: {
    variant: { primary: 'bg-[var(--color-primary)] text-white', ghost: 'bg-transparent' },
    size: { sm: 'px-3 py-1 text-sm', md: 'px-4 py-2' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

export function Button({ variant, size, ...props }) {
  return <button className={button({ variant, size })} {...props} />;
}`}
        />
      </Section>
    </>
  );
}
