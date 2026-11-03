/** @jsxImportSource @emotion/react */
// ↑ 이 파일의 JSX만 Emotion의 jsx로 변환해서 css prop을 쓸 수 있게 한다 (다른 파일은 그대로)
import { useEffect, useState } from 'react';
import { css, ThemeProvider, useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Toggle, Stat, ui,
} from '../components/kit.jsx';

const linkCls = 'text-indigo-600 dark:text-indigo-400';

// 문서에 Emotion이 넣은 CSS 규칙 수
function countEmotionRules() {
  let n = 0;
  for (const s of document.querySelectorAll('style[data-emotion]')) n += s.sheet?.cssRules.length ?? 0;
  return n;
}

function useEmotionRules(dep) {
  const [count, setCount] = useState(0);
  useEffect(() => setCount(countEmotionRules()), [dep]);
  return count;
}

export default function EmotionPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Emotion은 <u>JS 안에서 CSS를 쓰면, 실행 중에 그 CSS를 해시해서 클래스 이름을 만들고 &lt;style&gt; 태그에 넣어주는</u> CSS-in-JS 라이브러리입니다.
          <Code>styled.button</Code>으로 스타일 컴포넌트를 만들 수도 있고, <u><Code>css</Code> prop으로 컴포넌트 없이 요소에 바로</u> 스타일을 줄 수도 있는 것이 특징입니다.
        </OneLiner>

        <H3>패키지 구성</H3>
        <Table
          head={['패키지', '역할']}
          rows={[
            [<Code>@emotion/react</Code>, <><Code>css</Code> prop, <Code>css</Code> 함수, <Code>ThemeProvider</Code>, <Code>Global</Code>, <Code>keyframes</Code></>],
            [<Code>@emotion/styled</Code>, <>styled-components와 같은 <Code>styled.div`...`</Code> API</>],
            [<Code>@emotion/css</Code>, 'React 없이 쓰는 버전 (className 문자열을 돌려줌)'],
          ]}
        />

        <H3>동작 원리</H3>
        <List
          items={[
            <>① 템플릿 리터럴(또는 객체)을 CSS 문자열로 만든다 (props·theme 값을 채워 넣음)</>,
            <>② 문자열을 해시해서 이름을 만든다 → <Code>css-1x9f2a</Code></>,
            <>③ 이 이름의 규칙이 아직 없으면 <Code>&lt;style data-emotion&gt;</Code>에 <Code>.css-1x9f2a {'{ ... }'}</Code>를 삽입한다 (있으면 재사용)</>,
            <>④ 요소의 className에 그 이름을 붙인다</>,
            <>→ 그래서 <b>값이 바뀔 때마다 새 클래스가 계속 생긴다.</b> 자주 바뀌는 값은 CSS 변수나 style 속성으로 넘기는 게 좋다.</>,
          ]}
        />

        <H3>styled와 css prop</H3>
        <Table
          head={['', 'styled', 'css prop']}
          rows={[
            ['형태', <Code>{'const Button = styled.button`...`'}</Code>, <Code>{'<button css={css`...`}>'}</Code>],
            ['어울리는 곳', '재사용하는 디자인 시스템 컴포넌트', '한 곳에서만 쓰는 레이아웃, 조건부 스타일 조합'],
            ['조건부 스타일', 'props 함수로', <><Code>css={'{[base, active && activeStyle]}'}</Code> 배열로</>],
            ['설정', '없음', <>JSX 변환 설정 필요 (<Code>jsxImportSource: '@emotion/react'</Code> 또는 파일 위 pragma 주석)</>],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>MUI·Chakra UI를 쓰는 프로젝트</b> — 이미 Emotion이 들어 있어 같은 테마·도구로 맞출 수 있다 (MUI의 <Code>sx</Code>, <Code>styled</Code>도 Emotion 기반)</>,
            'props·테마에 따라 스타일이 복잡하게 바뀌는 컴포넌트 라이브러리',
            '이미 Emotion으로 만든 코드베이스를 유지보수할 때',
          ]}
          avoid={[
            <><b>Next.js App Router의 서버 컴포넌트</b> — 런타임에 스타일을 만들기 때문에 <Code>'use client'</Code> 컴포넌트에서만 동작한다</>,
            '마우스 위치, 스크롤, 애니메이션처럼 매 프레임 바뀌는 값을 css에 직접 넣기 — 값마다 새 규칙이 쌓인다',
            '새 프로젝트를 시작할 때 무조건 — 지금은 Tailwind·CSS Modules·vanilla-extract 같은 zero-runtime 방식을 먼저 검토하는 추세',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"Emotion은 런타임에 CSS 문자열을 해시해서 클래스를 만들고 style 태그에 삽입한다. 그래서 동적 스타일이 편한 대신 런타임 비용이 있고, 서버 컴포넌트에서는 쓸 수 없다. 자주 바뀌는 값은 CSS 변수로 넘겨서 클래스가 계속 생기지 않게 했다."</p>
          <p>styled-components와의 차이는 <Link className={linkCls} to="/react/styled-components-vs-emotion">기본 답변</Link>, 테마 전환 비교는 <Link className={linkCls} to="/react/nextjs-useTheme/deep/styling-theme">Theme Provider & 스타일링 방식 심화</Link>에 있어요.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <p>색과 여백을 바꿔 보세요. 아래 값은 <b>이 페이지에서 실제로 Emotion의 <Code>css</Code> 함수를 호출한 결과</b>입니다. CSS가 한 글자라도 바뀌면 해시(클래스 이름)가 바뀝니다.</p>
        <PipelineViz />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>styled vs css prop</H3>
        <CodeCompare
          before={{
            label: 'styled',
            code: `
import styled from '@emotion/styled';

const Card = styled.div\`
  padding: 16px;
  border-radius: 12px;
  border: 2px solid \${({ active }) => (active ? 'royalblue' : '#ddd')};
\`;

<Card active={selected}>...</Card>`,
            note: '재사용할 컴포넌트에 이름이 생겨 읽기 좋다. 한 번만 쓰는 스타일까지 전부 컴포넌트로 만들면 파일이 커진다.',
          }}
          after={{
            label: 'css prop',
            code: `
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

const base = css\`padding: 16px; border-radius: 12px; border: 2px solid #ddd;\`;
const active = css\`border-color: royalblue;\`;

<div css={[base, selected && active]}>...</div>`,
            note: '컴포넌트를 만들지 않고 요소에 바로 붙인다. 배열로 넘기면 뒤의 스타일이 앞을 덮어써서 조건부 조합이 간단하다.',
          }}
        />

        <H3>자주 바뀌는 값은 CSS 변수로</H3>
        <CodeCompare
          before={{
            label: '값을 css에 직접',
            code: `
function Bar({ width }) {
  return <div css={css\`width: \${width}px; height: 8px; background: royalblue;\`} />;
}
// width가 1px씩 바뀔 때마다 .css-xxxx 규칙이 새로 생겨 쌓인다`,
            note: '값의 종류만큼 클래스가 생긴다. 슬라이더·애니메이션이면 수백 개가 된다.',
          }}
          after={{
            label: 'CSS 변수로 넘기기',
            code: `
const bar = css\`width: var(--w); height: 8px; background: royalblue;\`;

function Bar({ width }) {
  return <div css={bar} style={{ '--w': \`\${width}px\` }} />;
}
// 클래스는 1개로 고정, 값은 style 속성으로만 바뀐다`,
            note: '스타일 문자열이 바뀌지 않으니 해시도 그대로. 새 규칙이 생기지 않는다.',
          }}
        />

        <H3>테마</H3>
        <CodeBlock
          code={`
import { ThemeProvider, useTheme } from '@emotion/react';

const light = { colors: { bg: '#fff', text: '#111', primary: 'royalblue' } };

<ThemeProvider theme={light}>
  <App />
</ThemeProvider>

// styled에서
const Button = styled.button\`
  background: \${({ theme }) => theme.colors.primary};
\`;

// css prop에서는 함수로
<div css={(theme) => ({ color: theme.colors.text })} />

// 컴포넌트에서
const theme = useTheme();`}
        />

        <H3>설정 (Vite · Next.js)</H3>
        <CodeBlock
          code={`
// vite.config.js — 프로젝트 전체에서 css prop 사용
react({ jsxImportSource: '@emotion/react' })

// 또는 파일 하나에서만 (이 페이지가 쓰는 방식)
/** @jsxImportSource @emotion/react */

// Next.js App Router: Emotion을 쓰는 컴포넌트는 클라이언트 컴포넌트여야 한다
'use client';`}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>A. 값이 바뀔 때 쌓이는 CSS 규칙</H3>
        <RuleGrowthDemo />
        <H3>B. ThemeProvider로 테마 바꾸기</H3>
        <ThemeDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

function PipelineViz() {
  const [color, setColor] = useState('#4f46e5');
  const [pad, setPad] = useState(12);
  const styles = css`
    padding: ${pad}px;
    border-radius: 12px;
    color: white;
    background: ${color};
  `;
  const rules = useEmotionRules(styles.name);
  const steps = [
    ['① CSS 문자열', styles.styles.trim().replace(/\s+/g, ' ')],
    ['② 해시', styles.name],
    ['③ 클래스 이름', `css-${styles.name}`],
    ['④ <style>에 삽입', `.css-${styles.name} { ... }`],
  ];
  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">배경색 <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        <label className="flex items-center gap-2">padding <input type="range" min={4} max={32} value={pad} onChange={(e) => setPad(Number(e.target.value))} /> <b className="tabular-nums">{pad}px</b></label>
      </div>
      <div className="mt-4 min-w-[460px] space-y-2">
        {steps.map(([label, value]) => (
          <div key={label} className="flex items-start gap-3 rounded-xl border border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
            <span className="w-32 flex-none text-sm font-semibold">{label}</span>
            <code key={value} className="animate-flash font-mono text-xs break-all text-indigo-700 dark:text-indigo-300">{value}</code>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div css={styles}>이 상자가 위 클래스를 받은 요소</div>
        <span className={`text-sm ${ui.muted}`}>페이지 전체 Emotion 규칙 수: <b>{rules}</b></span>
      </div>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const barBase = css`
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1, #a855f7);
`;
const barVar = css`
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #10b981, #14b8a6);
  width: var(--w);
`;

function RuleGrowthDemo() {
  const [direct, setDirect] = useState(30);
  const [viaVar, setViaVar] = useState(30);
  const [start] = useState(() => countEmotionRules());
  const rules = useEmotionRules(`${direct}-${viaVar}`);
  const directClass = `css-${css`width: ${direct}%;`.name}`;

  return (
    <Demo hint="두 슬라이더를 끝까지 여러 번 움직여 보세요. 위쪽은 값을 css에 직접 넣어 값마다 새 클래스가 생기고, 아래쪽은 CSS 변수로 넘겨 클래스가 그대로입니다. 오른쪽 숫자는 이 데모를 연 뒤 페이지에 추가된 Emotion 규칙 수입니다.">
      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">css에 직접: <code className="font-mono text-xs">width: {direct}%</code></span>
              <code className="font-mono text-xs text-zinc-400">{directClass}</code>
            </div>
            <input type="range" min={0} max={100} value={direct} onChange={(e) => setDirect(Number(e.target.value))} className="mt-2 w-full" />
            <div css={[barBase, css`width: ${direct}%;`]} />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">CSS 변수: <code className="font-mono text-xs">--w: {viaVar}%</code></span>
              <code className="font-mono text-xs text-zinc-400">css-{barVar.name}</code>
            </div>
            <input type="range" min={0} max={100} value={viaVar} onChange={(e) => setViaVar(Number(e.target.value))} className="mt-2 w-full" />
            <div css={barVar} style={{ '--w': `${viaVar}%` }} />
          </div>
        </div>
        <div className="grid content-start gap-2 text-center">
          <Stat label="추가된 Emotion 규칙" value={`${Math.max(0, rules - start)}개`} tone={rules - start > 20 ? 'bad' : undefined} />
          <p className={`text-xs ${ui.muted}`}>위 슬라이더만 이 숫자를 늘립니다.</p>
        </div>
      </div>
    </Demo>
  );
}

const THEMES = {
  light: { name: 'light', colors: { bg: '#ffffff', text: '#18181b', sub: '#71717a', primary: '#4f46e5', border: '#e4e4e7' } },
  dark: { name: 'dark', colors: { bg: '#18181b', text: '#fafafa', sub: '#a1a1aa', primary: '#a78bfa', border: '#3f3f46' } },
};

const ThemedCard = styled.div`
  padding: 20px;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 0.2s, color 0.2s;
`;

const ThemedButton = styled.button`
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 10px;
  color: white;
  background: ${({ theme }) => theme.colors.primary};
`;

function ThemeDemo() {
  const [dark, setDark] = useState(false);
  return (
    <Demo hint="토글을 켜면 ThemeProvider의 theme 객체가 바뀌고, 이 테마를 읽는 styled 컴포넌트들이 새 값으로 다시 스타일을 만듭니다. (사이트 전체 다크모드와는 별개)">
      <Toggle checked={dark} onChange={setDark} label="Emotion 테마: dark" />
      <div className="mt-4">
        <ThemeProvider theme={dark ? THEMES.dark : THEMES.light}>
          <ThemedCard>
            <ThemeInfo />
            <ThemedButton>theme.colors.primary</ThemedButton>
          </ThemedCard>
        </ThemeProvider>
      </div>
    </Demo>
  );
}

function ThemeInfo() {
  const theme = useTheme();
  return (
    <>
      <div css={{ fontWeight: 700 }}>useTheme()로 읽은 테마: {theme.name}</div>
      <div css={(t) => ({ marginTop: 4, fontSize: 13, color: t.colors.sub })}>
        이 문장은 css prop에 함수를 넘겨 theme을 읽었어요.
      </div>
    </>
  );
}
