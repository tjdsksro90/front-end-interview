import { useEffect, useRef, useState } from 'react';
import { Code, ui } from '../components/kit.jsx';
import { format, specificityList } from './specificity.js';

// :is() · :where() · :not() · :has() 심화에서 같이 쓰는 "선택자 놀이터".
// 아래 작은 페이지(실제 DOM)에 선택자를 적용해서, 고른 요소를 강조하고 우선순위를 보여준다.

const SANDBOX_CSS = `
.sp-root { font-size: 12px; line-height: 1.3; }
.sp-root * { box-sizing: border-box; }
.sp-root :where(header, main, footer, nav, article, section, ul, li, form, label, h1, h2, p, a, button, img, input, span) {
  position: relative; display: block; margin: 0; padding: 3px 6px 6px; border-radius: 8px;
  border: 1.5px solid rgb(161 161 170 / .45); background: transparent; color: inherit;
  font: inherit; text-decoration: none; text-align: left; min-height: 0; width: auto; transition: background .15s, outline-color .15s;
}
.sp-root :where(main, article, ul, form, nav, header, footer) { display: flex; flex-wrap: wrap; gap: 6px; align-items: flex-start; }
.sp-root :where(main) > * { flex: 1 1 200px; }
.sp-root :where(a, li, button, input, img, h1, h2, p, span, label) { flex: 0 1 auto; }
.sp-root :where(input) { appearance: none; width: 96px; height: 38px; padding: 0 6px; font-family: ui-monospace, monospace; font-size: 10.5px; }
.sp-root :where(input)::placeholder { color: rgb(113 113 122); }
.sp-root :where(img) { width: 64px; height: 38px; padding: 0; background: repeating-linear-gradient(45deg, rgb(161 161 170 / .15) 0 6px, transparent 6px 12px); }
.sp-root [data-tag]::before {
  /* 이름표도 상자 안에서 자리를 차지하게 해서 상자가 이름표보다 좁아지지 않게 */
  content: attr(data-tag); display: block; flex-basis: 100%; margin-bottom: 2px; font-family: ui-monospace, monospace; font-size: 10.5px;
  color: rgb(113 113 122); white-space: nowrap; pointer-events: none;
}
.sp-root .sp-hit { outline: 2.5px solid rgb(245 158 11); outline-offset: 1px; background: rgb(245 158 11 / .14); }
.sp-root .sp-hit[data-tag]::before { color: rgb(180 83 9); font-weight: 700; }
:root.dark .sp-root .sp-hit[data-tag]::before { color: rgb(252 211 77); }
`;

// data-tag: 화면에 보이는 이름표 (태그.클래스)
function Sandbox() {
  return (
    <div className="sp-root">
      <header data-tag="header.site">
        <h1 data-tag="h1">로고</h1>
        <nav data-tag="nav">
          <a href="#" onClick={(e) => e.preventDefault()} className="active" data-tag="a.active">홈</a>
          <a href="#" onClick={(e) => e.preventDefault()} data-tag="a">글</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="disabled" data-tag="a.disabled">준비중</a>
        </nav>
      </header>
      <main data-tag="main">
        <article className="card featured" data-tag="article.card.featured">
          <h2 data-tag="h2">제목</h2>
          <img alt="" data-tag="img" />
          <p data-tag="p">본문 <a href="#" onClick={(e) => e.preventDefault()} data-tag="a">링크</a></p>
        </article>
        <article className="card" data-tag="article.card">
          <h2 data-tag="h2">제목</h2>
          <p data-tag="p">본문</p>
          <button type="button" disabled data-tag="button:disabled">구매</button>
        </article>
        <ul className="list" data-tag="ul.list">
          <li data-tag="li">1</li>
          <li data-tag="li">2</li>
          <li className="sold-out" data-tag="li.sold-out">3</li>
          <li data-tag="li">4</li>
        </ul>
        <form data-tag="form">
          {/* input·img는 ::before를 못 그려서 이름표를 placeholder로 대신 보여준다 */}
          <input type="email" required aria-label="이메일" placeholder="input:required" data-tag="input:required" />
          <input type="checkbox" defaultChecked aria-label="동의" data-tag="input:checked" />
          <button type="button" data-tag="button">보내기</button>
        </form>
      </main>
      <footer data-tag="footer">
        <h2 data-tag="h2">문의</h2>
        <a href="#" onClick={(e) => e.preventDefault()} data-tag="a">메일</a>
      </footer>
    </div>
  );
}

// presets: [{ sel, note }]
export function SelectorPlayground({ presets, initial = 0 }) {
  const root = useRef(null);
  const [text, setText] = useState(presets[initial].sel);
  const [result, setResult] = useState({ count: 0, error: null });

  useEffect(() => {
    const el = root.current;
    el.querySelectorAll('.sp-hit').forEach((n) => n.classList.remove('sp-hit'));
    if (!text.trim()) return setResult({ count: 0, error: null });
    try {
      // 놀이터 안 요소만 검사한다
      const hits = [...el.querySelectorAll('.sp-root *')].filter((n) => n.matches(text));
      hits.forEach((n) => n.classList.add('sp-hit'));
      setResult({ count: hits.length, error: null });
    } catch {
      setResult({ count: 0, error: '브라우저가 읽을 수 없는 선택자예요' });
    }
  }, [text]);

  let spec = null;
  try {
    spec = text.trim() ? specificityList(text) : null;
  } catch {
    spec = null;
  }
  const note = presets.find((p) => p.sel === text)?.note;

  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <style>{SANDBOX_CSS}</style>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.sel}
            onClick={() => setText(p.sel)}
            className={`${p.sel === text ? ui.btnPrimary : ui.btn} px-2.5 py-1 font-mono text-xs`}
          >
            {p.sel}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2">
        <span className={`text-sm ${ui.muted}`}>선택자</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className={`${ui.input} flex-1 font-mono`}
          aria-label="CSS 선택자 직접 입력"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {result.error ? (
          <span className={ui.bad}>{result.error}</span>
        ) : (
          <span>
            고른 요소 <b className="tabular-nums text-amber-600 dark:text-amber-400">{result.count}</b>개
          </span>
        )}
        {spec && !result.error && (
          <span className={ui.muted}>
            우선순위{' '}
            {spec.map((s, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                {spec.length > 1 && <Code>{s.sel}</Code>} <b className="font-mono text-zinc-800 dark:text-zinc-200">{format(s.value)}</b>
              </span>
            ))}
          </span>
        )}
      </div>
      {note && <p className={`mt-1 text-sm ${ui.muted}`}>→ {note}</p>}
      <div ref={root} className={`${ui.box} mt-3 overflow-x-auto`}>
        <Sandbox />
      </div>
      <p className={`mt-2 text-xs ${ui.muted}`}>버튼을 누르거나 직접 선택자를 입력해 보세요. 이름표는 태그.클래스, 노란 테두리가 선택된 요소입니다. 우선순위는 (id, class, 태그) 순서예요.</p>
    </div>
  );
}

// 같은 요소를 두 규칙이 꾸밀 때 어느 쪽이 이기는지 보여주는 표
export function SpecificityBattle({ rules }) {
  const scored = rules.map((r) => ({ ...r, value: specificityList(r.sel)[0].value }));
  const winner = scored.reduce((w, r) => {
    const c = r.value[0] - w.value[0] || r.value[1] - w.value[1] || r.value[2] - w.value[2];
    return c >= 0 ? r : w; // 같으면 나중에 쓴 규칙이 이긴다
  });
  return (
    <div className="space-y-1.5">
      {scored.map((r) => (
        <div
          key={r.sel}
          className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm ${
            r === winner ? 'bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/40' : 'bg-zinc-50 dark:bg-zinc-800/50'
          }`}
        >
          <code className="font-mono">{r.sel} {'{ '}{r.decl}{' }'}</code>
          <span className="ml-auto font-mono tabular-nums">{format(r.value)}</span>
          {r === winner && <span className={`text-xs font-bold ${ui.good}`}>적용</span>}
        </div>
      ))}
    </div>
  );
}
