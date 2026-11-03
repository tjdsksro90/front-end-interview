import { createContext, memo, useContext, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, RenderBadge, useRenderCount, ui,
} from '../components/kit.jsx';

export default function StylingTheme() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Theme Provider는 색·간격·폰트 같은 <u>디자인 값(토큰)을 앱 맨 위에서 한 번 정의해 아래 모든 컴포넌트가 꺼내 쓰게 하는 패턴</u>입니다.
          그 값을 JS로 내려 스타일을 런타임에 만드는 방식이 CSS-in-JS(Emotion, styled-components)이고, CSS 변수 + 유틸리티 클래스로 처리하는 방식이 Tailwind입니다.
        </OneLiner>

        <Table
          head={['', 'CSS-in-JS (Emotion, styled-components)', 'Tailwind', 'CSS Modules / 일반 CSS']}
          rows={[
            ['작성', <Code>{'styled.button`color: ${p => p.theme.primary}`'}</Code>, <Code>{'className="bg-primary px-4"'}</Code>, '.module.css 파일에 클래스'],
            ['스타일 생성 시점', <b>런타임 (브라우저에서 JS 실행)</b>, '빌드 타임 (쓴 클래스만 CSS로)', '빌드 타임'],
            ['props에 따른 동적 스타일', '아주 쉬움', '클래스 조건부 조합 (clsx, cva)', '클래스 조건부'],
            ['테마', 'ThemeProvider로 JS 객체 전달', 'CSS 변수 + dark: 변형', 'CSS 변수'],
            ['성능', '런타임 비용, 번들에 라이브러리 포함', '런타임 비용 0, CSS 파일 작음', '런타임 비용 0'],
            ['서버 컴포넌트(RSC)', '클라이언트 컴포넌트에서만 동작', '문제 없음', '문제 없음'],
          ]}
        />

        <H3>알아둘 것</H3>
        <List
          items={[
            <><b>테마 전환은 CSS 변수로</b>: 테마 값을 React state/Context로만 내려주면 테마가 바뀔 때 모든 컴포넌트가 다시 렌더된다. CSS 변수(<Code>--color-primary</Code>)를 바꾸면 <b>React 렌더 없이</b> 브라우저가 색만 다시 칠한다. (아래 데모)</>,
            <><b>다크모드 깜빡임(FOUC)</b>: SSR/정적 페이지에서 JS가 실행되기 전 기본(라이트) 테마가 잠깐 보이는 문제 → head에 작은 인라인 스크립트로 먼저 클래스를 붙인다. (이 사이트의 index.html, next-themes가 하는 일)</>,
            <>요즘 흐름: 런타임 CSS-in-JS(styled-components는 2025년 유지보수 모드 전환)에서 <b>zero-runtime</b>(Tailwind, vanilla-extract, Panda CSS, CSS Modules)으로 이동 중.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>Theme Provider + CSS 변수</b>: 다크모드, 브랜드별 테마(화이트 라벨), 고객사별 색상 변경</>,
            <><b>Tailwind</b>: 빠른 개발, Next.js App Router(서버 컴포넌트), 디자인 토큰을 config 한곳에서 관리</>,
            <><b>CSS-in-JS</b>: props에 따라 스타일이 복잡하게 바뀌는 컴포넌트 라이브러리, 기존 Emotion/MUI 기반 프로젝트</>,
          ]}
          avoid={[
            '자주 바뀌는 값(마우스 좌표, 스크롤)을 styled props로 — 매번 새 클래스가 생성된다. style 속성이나 CSS 변수로',
            '서버 컴포넌트 위주의 새 Next.js 프로젝트에 런타임 CSS-in-JS 도입',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>테마를 바꿀 때 각 방식에서 브라우저가 하는 일을 비교합니다.</p>
        <ThemeFlowViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: 'Emotion / styled-components',
            code: `
import { ThemeProvider } from '@emotion/react';
import styled from '@emotion/styled';

const theme = { colors: { primary: '#4f46e5' }, radius: '8px' };

const Button = styled.button\`
  background: \${(p) => p.theme.colors.primary};
  border-radius: \${(p) => p.theme.radius};
  padding: 8px 16px;
\`;

<ThemeProvider theme={isDark ? darkTheme : theme}>
  <App />
</ThemeProvider>`,
            note: '테마 객체가 바뀌면 이를 쓰는 모든 styled 컴포넌트가 다시 렌더되고, 새 CSS 클래스가 런타임에 만들어진다.',
          }}
          after={{
            label: 'Tailwind + CSS 변수',
            code: `
/* globals.css */
:root      { --color-primary: #4f46e5; --radius: 8px; }
.dark      { --color-primary: #818cf8; }

/* Tailwind v4 */
@theme { --color-primary: var(--color-primary); }

// 컴포넌트
<button className="rounded-[var(--radius)] bg-primary px-4 py-2">저장</button>

// 테마 전환: React 렌더 없이 클래스 하나만
document.documentElement.classList.toggle('dark');`,
            note: '테마가 바뀌어도 컴포넌트는 그대로이고 CSS 변수 값만 바뀐다. 스타일은 빌드 때 이미 만들어져 있다.',
          }}
        />
        <Callout title="직접 Theme Provider 만들기 (Context + CSS 변수)">
          <CodeBlock
            code={`
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;   // CSS가 [data-theme="dark"]로 반응
    localStorage.setItem('theme', theme);
  }, [theme]);
  // 값을 쓰는 곳은 토글 버튼 정도라 리렌더 범위가 작다
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <ThemeDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화 ---------- */

const FLOW = {
  cssinjs: {
    steps: ['ThemeProvider의 theme 객체 교체', '이 테마를 쓰는 styled 컴포넌트 전부 리렌더', '바뀐 값으로 새 CSS 문자열 생성 + 해시', '<style> 태그에 새 클래스 삽입 (.css-1x9f2a)', '요소의 className 교체 → 다시 칠하기'],
    css: `.css-8ka21b { background: #4f46e5; }   /* 라이트 */\n.css-1x9f2a { background: #818cf8; }   /* 다크로 바꾸면 새 클래스 추가 */`,
  },
  vars: {
    steps: ['<html class="dark"> 클래스 토글', 'CSS 변수 값만 바뀜 (--color-primary)', '브라우저가 그 변수를 쓰는 곳만 다시 칠하기', 'React 컴포넌트 렌더 0회'],
    css: `:root { --color-primary: #4f46e5; }\n.dark { --color-primary: #818cf8; }\n.bg-primary { background: var(--color-primary); }   /* 클래스는 그대로 */`,
  },
};

function ThemeFlowViz() {
  const [mode, setMode] = useState('cssinjs');
  const f = FLOW[mode];
  return (
    <Viz>
      <Segmented value={mode} onChange={setMode} options={[{ value: 'cssinjs', label: 'CSS-in-JS ThemeProvider' }, { value: 'vars', label: 'CSS 변수 (Tailwind 등)' }]} />
      <ol className="mt-4 space-y-2">
        {f.steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            <span className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold text-white ${mode === 'cssinjs' && (i === 1 || i === 2) ? 'bg-rose-500' : 'bg-indigo-500'}`}>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-4"><CodeBlock code={f.css} title="만들어지는 CSS" /></div>
      <p className={`mt-3 text-sm ${ui.muted}`}>→ {mode === 'cssinjs' ? '빨간 단계(리렌더, CSS 생성)가 브라우저에서 JS로 일어나는 비용입니다.' : '스타일은 빌드 때 이미 있고, 바뀌는 건 변수 값 하나뿐입니다.'}</p>
    </Viz>
  );
}

/* ---------- 데모 ---------- */

const PALETTE = { indigo: '#4f46e5', emerald: '#059669', rose: '#e11d48', amber: '#d97706' };

function ThemeDemo() {
  const [color, setColor] = useState('indigo');
  const [radius, setRadius] = useState(8);
  return (
    <Demo hint="색과 모서리를 바꿔 보세요. 왼쪽은 테마 값을 Context(JS)로 내려서 모든 컴포넌트가 다시 렌더되고, 오른쪽은 CSS 변수만 바꿔서 렌더 횟수가 그대로입니다. 두 쪽 모두 컴포넌트는 memo로 감쌌습니다.">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={color} onChange={setColor} options={Object.keys(PALETTE).map((k) => ({ value: k, label: k }))} />
        <label className="flex items-center gap-2 text-sm">
          radius
          <input type="range" min={0} max={20} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-32 accent-indigo-600" />
          <span className="w-10 font-mono">{radius}px</span>
        </label>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold">Context로 테마 값 전달</p>
          <ThemeContext.Provider value={{ primary: PALETTE[color], radius }}>
            <ContextCard />
            <ContextButton />
          </ThemeContext.Provider>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">CSS 변수로 전달</p>
          <div style={{ '--demo-primary': PALETTE[color], '--demo-radius': `${radius}px` }}>
            <VarCard />
            <VarButton />
          </div>
        </div>
      </div>
    </Demo>
  );
}

const ThemeContext = createContext(null);

const ContextCard = memo(function ContextCard() {
  const theme = useContext(ThemeContext);
  const renders = useRenderCount();
  return (
    <div className="mb-2 border-2 p-3 text-sm" style={{ borderColor: theme.primary, borderRadius: theme.radius }}>
      <div className="flex justify-between"><span>카드</span><RenderBadge count={renders} /></div>
      <code className="text-[11px] text-zinc-400">useContext(ThemeContext).primary</code>
    </div>
  );
});
const ContextButton = memo(function ContextButton() {
  const theme = useContext(ThemeContext);
  const renders = useRenderCount();
  return (
    <div className="flex items-center gap-2">
      <button className="px-4 py-2 text-sm font-semibold text-white" style={{ background: theme.primary, borderRadius: theme.radius }}>버튼</button>
      <RenderBadge count={renders} />
    </div>
  );
});
const VarCard = memo(function VarCard() {
  const renders = useRenderCount();
  return (
    <div className="mb-2 border-2 border-[var(--demo-primary)] p-3 text-sm" style={{ borderRadius: 'var(--demo-radius)' }}>
      <div className="flex justify-between"><span>카드</span><RenderBadge count={renders} /></div>
      <code className="text-[11px] text-zinc-400">border-color: var(--demo-primary)</code>
    </div>
  );
});
const VarButton = memo(function VarButton() {
  const renders = useRenderCount();
  return (
    <div className="flex items-center gap-2">
      <button className="bg-[var(--demo-primary)] px-4 py-2 text-sm font-semibold text-white" style={{ borderRadius: 'var(--demo-radius)' }}>버튼</button>
      <RenderBadge count={renders} />
    </div>
  );
});
