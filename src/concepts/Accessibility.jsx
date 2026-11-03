import { useEffect, useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, ui,
} from '../components/kit.jsx';
import { WhereToCheck } from '../components/screens.jsx';

export default function Accessibility() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          웹 접근성은 <u>마우스 없이 키보드로만, 화면 없이 스크린리더로만 써도 모든 기능을 쓸 수 있게</u> 만드는 것입니다.
          핵심은 시맨틱 HTML을 쓰는 것이고, 부족한 부분만 ARIA로 보완하고, 포커스를 관리하는 것입니다.
        </OneLiner>

        <H3>꼭 지킬 것</H3>
        <Table
          head={['항목', '이유', '방법']}
          rows={[
            ['시맨틱 태그', 'button은 키보드 포커스·Enter/Space·"버튼" 읽기를 기본 제공', <>클릭되는 건 <Code>{'<button>'}</Code>, 이동은 <Code>{'<a href>'}</Code>. div onClick 금지</>],
            ['이름(라벨)', '아이콘만 있으면 스크린리더가 "버튼"이라고만 읽음', <><Code>{'<label htmlFor>'}</Code>, <Code>aria-label="닫기"</Code>, 이미지 <Code>alt</Code></>],
            ['상태 알리기', '펼침/선택/로딩 상태가 시각적으로만 보이면 모름', <><Code>aria-expanded</Code>, <Code>aria-selected</Code>, <Code>aria-busy</Code>, <Code>aria-live</Code></>],
            ['포커스 표시', '키보드 사용자가 지금 어디인지 알아야 함', <><Code>outline: none</Code> 금지, <Code>:focus-visible</Code> 스타일</>],
            ['포커스 관리', '모달이 열렸는데 포커스가 뒤에 있으면 탭이 뒤 화면을 돌아다님', '열 때 모달 안으로 이동, 안에서만 순환(focus trap), Esc로 닫고 원래 위치로 복귀'],
            ['명도 대비', '저시력 사용자', '본문 4.5:1 이상 (WCAG AA)'],
          ]}
        />
        <Callout type="tip" title="ARIA 첫 번째 규칙">
          <p>"네이티브 HTML 요소로 할 수 있으면 ARIA를 쓰지 마라." <Code>{'<div role="button" tabIndex={0} onKeyDown=...>'}</Code>를 정성껏 만드는 것보다 <Code>{'<button>'}</Code> 하나가 낫습니다. 잘못된 ARIA는 없는 것보다 나쁩니다.</p>
        </Callout>

        <H3>그래서 언제 신경 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>항상</b> — 하지만 특히 <b>직접 만드는 인터랙티브 컴포넌트</b>: 드롭다운, 모달, 탭, 토글, 자동완성, 캐러셀</>,
            '공공기관·금융·대기업 서비스: 법적 의무(국내 웹 접근성 인증, 미국 ADA, 유럽 EAA 2025)',
            '아이콘만 있는 버튼, 색으로만 상태를 표시하는 UI를 만들 때',
            '디자인 시스템 컴포넌트 — 한 번 제대로 만들면 앱 전체가 접근성을 얻는다 (Radix, React Aria 같은 headless 라이브러리 활용)',
          ]}
          avoid={[
            '모든 요소에 role, aria-label 덧붙이기 — 시맨틱 태그가 이미 주는 정보와 충돌한다',
            '장식용 이미지에 설명 alt — alt=""로 비워서 건너뛰게 한다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>겉보기엔 같은 버튼 두 개를 스크린리더가 어떻게 읽는지 비교합니다. 아래 요소를 Tab 키로 이동하거나 클릭해 보세요.</p>
        <ReaderViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '접근성 없음',
            code: `
<div className="btn" onClick={addToCart}>
  <img src="cart.svg" />
</div>

<div onClick={() => setOpen(!open)}>메뉴 ▾</div>
{open && <div className="menu">...</div>}

<input placeholder="이메일" />`,
            note: 'Tab으로 갈 수 없고, 스크린리더는 "이미지", "메뉴"라고만 읽고, 열렸는지 모르고, 입력칸 이름도 없다.',
          }}
          after={{
            label: '접근성 있음',
            code: `
<button type="button" onClick={addToCart} aria-label="장바구니에 담기">
  <img src="cart.svg" alt="" />          {/* 장식용: 버튼 이름이 대신 */}
</button>

<button aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen(!open)}>
  메뉴
</button>
<ul id="main-menu" hidden={!open}>...</ul>

<label htmlFor="email">이메일</label>
<input id="email" type="email" autoComplete="email" />

{/* 결과를 화면 갱신 없이 읽어주기 */}
<p aria-live="polite">{cartCount}개 담김</p>`,
            note: 'Tab·Enter·Space가 기본으로 되고, "장바구니에 담기, 버튼", "메뉴, 버튼, 축소됨"처럼 읽힌다.',
          }}
        />
      </Section>

      <Section step={4} title="직접 해보기">
        <KeyboardDemo />
        <H3>확인 경로</H3>
        <WhereToCheck
          items={[
            { where: '자동 검사', path: ['F12', 'Lighthouse', 'Accessibility 체크', 'Analyze'], what: '대비 부족, 이름 없는 버튼, alt 없는 이미지 등을 점수와 함께. 자동 검사로는 문제의 30~40% 정도만 잡힌다.' },
            { where: '스크린리더가 받는 정보', path: ['F12', 'Elements', '요소 선택', 'Accessibility 패널'], what: 'Name(읽히는 이름), Role, 상태. "Enable full-page accessibility tree"로 전체 트리 보기.' },
            { where: '더 자세한 검사', path: ['Chrome 확장', 'axe DevTools', 'Scan'], what: '규칙별 위반과 고치는 방법. 개발 중엔 eslint-plugin-jsx-a11y로 코드 단계에서.' },
            { where: '직접 들어보기', path: ['Windows: NVDA (무료)', 'Mac: Cmd+F5 VoiceOver'], what: '마우스를 치우고 Tab·화살표만으로 주요 흐름(로그인, 결제)을 끝까지 해보는 게 가장 확실하다.' },
          ]}
        />
      </Section>
    </>
  );
}

/* ---------- 시각화: 스크린리더 읽기 ---------- */

// 요소의 접근 가능한 이름/역할을 아주 단순하게 계산 (실제 알고리즘의 일부)
function announce(el) {
  if (!el) return '';
  const role = el.getAttribute('role') || { BUTTON: '버튼', A: '링크', INPUT: '편집창' }[el.tagName] || '';
  const name = el.getAttribute('aria-label') || (el.labels?.[0]?.textContent) || el.textContent.trim() || el.querySelector('img')?.getAttribute('alt') || '';
  const expanded = el.getAttribute('aria-expanded');
  const state = expanded == null ? '' : expanded === 'true' ? ', 확장됨' : ', 축소됨';
  return [name || '(이름 없음)', role || '(역할 없음: 그냥 글자)'].join(', ') + state;
}

function ReaderViz() {
  const [spoken, setSpoken] = useState('Tab 키를 눌러 보세요');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    const onFocus = (e) => setSpoken(announce(e.target));
    root.addEventListener('focusin', onFocus);
    return () => root.removeEventListener('focusin', onFocus);
  }, []);

  const read = (e) => setSpoken(announce(e.currentTarget));

  return (
    <Viz>
      <div ref={ref} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">div로 만든 것</p>
          <div className={`${ui.btnPrimary} inline-block cursor-pointer select-none`} onClick={read}>장바구니</div>
          <div className={`${ui.btn} ml-2 inline-block cursor-pointer`} onClick={read}><XIcon /></div>
          <p className="text-xs text-zinc-400">→ Tab으로 갈 수 없어서 키보드 사용자는 존재 자체를 모릅니다. (클릭하면 읽는 내용 표시)</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">시맨틱 + ARIA</p>
          <button className={ui.btnPrimary} onClick={read}>장바구니</button>
          <button className={`${ui.btn} ml-2`} aria-label="닫기" onClick={read}><XIcon /></button>
          <button className={`${ui.btn} ml-2`} aria-expanded={open} onClick={(e) => { setOpen((o) => !o); setTimeout(() => setSpoken(announce(e.target.closest('button'))), 0); }}>메뉴</button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-3 font-mono text-sm text-emerald-300">
        <span className="text-xs text-zinc-400">스크린리더:</span> "{spoken}"
      </div>
    </Viz>
  );
}

/* ---------- 데모: 키보드만으로 드롭다운 쓰기 ---------- */

const OPTIONS = ['서울', '부산', '대구', '광주'];

function KeyboardDemo() {
  const [mode, setMode] = useState('bad');
  const [focused, setFocused] = useState('-');

  useEffect(() => {
    const onFocus = () => {
      const el = document.activeElement;
      setFocused(el && el !== document.body ? `<${el.tagName.toLowerCase()}> ${announce(el)}` : '-');
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);

  return (
    <Demo hint="마우스를 놓고 Tab, Enter, 화살표, Esc만으로 지역을 골라 보세요. 나쁜 예는 키보드로 열 수 없습니다.">
      <Segmented value={mode} onChange={setMode} options={[{ value: 'bad', label: '나쁜 예 (div)' }, { value: 'good', label: '좋은 예 (button + ARIA + 키보드)' }]} />
      <div className="mt-4 flex flex-wrap items-start gap-4">
        <input className={ui.input} placeholder="여기서 Tab 시작" aria-label="시작 지점" />
        {mode === 'bad' ? <BadSelect /> : <GoodSelect />}
        <button className={ui.btn}>다음 요소</button>
      </div>
      <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs dark:bg-zinc-800">현재 포커스: {focused}</p>
    </Demo>
  );
}

function BadSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('지역 선택');
  return (
    <div className="relative">
      <div className={`${ui.btn} cursor-pointer`} onClick={() => setOpen((o) => !o)}>{value} ▾</div>
      {open && (
        <div className="absolute z-10 mt-1 w-32 rounded-lg bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700">
          {OPTIONS.map((o) => <div key={o} className="cursor-pointer px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { setValue(o); setOpen(false); }}>{o}</div>)}
        </div>
      )}
    </div>
  );
}

function GoodSelect() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [active, setActive] = useState(0);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (open) listRef.current?.focus(); }, [open]);

  const choose = (i) => {
    setValue(OPTIONS[i]);
    setOpen(false);
    buttonRef.current.focus(); // 닫으면 원래 버튼으로 포커스 복귀
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % OPTIONS.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + OPTIONS.length) % OPTIONS.length); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    if (e.key === 'Escape') { setOpen(false); buttonRef.current.focus(); }
    if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={ui.btn}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`지역 선택, 현재 ${value ?? '없음'}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); } }}
      >
        {value ?? '지역 선택'} ▾
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label="지역"
          aria-activedescendant={`opt-${active}`}
          onKeyDown={onKeyDown}
          className="absolute z-10 mt-1 w-32 rounded-lg bg-white shadow-lg ring-1 ring-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-900 dark:ring-zinc-700"
        >
          {OPTIONS.map((o, i) => (
            <li
              key={o}
              id={`opt-${i}`}
              role="option"
              aria-selected={i === active}
              onClick={() => choose(i)}
              className={`cursor-pointer px-3 py-1.5 text-sm ${i === active ? 'bg-indigo-100 dark:bg-indigo-500/20' : ''}`}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="inline h-4 w-4">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}
