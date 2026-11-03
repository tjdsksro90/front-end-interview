import { useRef } from 'react';

// 개념 페이지에서 공통으로 쓰는 블록들. 모든 개념 페이지는
// 1. 개념 → 2. 시각화 → 3. 코드 비교 → 4. 직접 해보기 순서로 구성한다.

export const ui = {
  btn: 'rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-default disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:text-indigo-300',
  btnPrimary: 'rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-default disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400',
  input: 'min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100',
  box: 'rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900',
  muted: 'text-zinc-500 dark:text-zinc-400',
  good: 'text-emerald-600 dark:text-emerald-400',
  bad: 'text-rose-600 dark:text-rose-400',
  warn: 'text-amber-600 dark:text-amber-400',
};

export function Section({ step, title, children }) {
  return (
    <section id={`step-${step}`} className="mt-14 scroll-mt-20">
      <h2 className="flex items-center gap-3 border-b border-zinc-200 pb-3 text-xl font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
        <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-indigo-600 text-sm text-white dark:bg-indigo-500">{step}</span>
        {title}
      </h2>
      <div className="mt-5 space-y-4 leading-relaxed">{children}</div>
    </section>
  );
}

export function H3({ children }) {
  return <h3 className="pt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{children}</h3>;
}

export function List({ items }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-zinc-400">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

export function Code({ children }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700 dark:bg-zinc-800 dark:text-indigo-300">
      {children}
    </code>
  );
}

// 면접에서 그대로 말할 수 있는 한두 문장
export function OneLiner({ children }) {
  return (
    <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 px-5 py-4 dark:bg-indigo-500/10">
      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300">🎤 한 줄로 설명하면</p>
      <p className="mt-1 text-[1.05rem] font-semibold text-zinc-900 dark:text-zinc-50">{children}</p>
    </div>
  );
}

// 언제 쓰는지 / 쓰지 않아도 되는지
export function WhenToUse({ use, avoid }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl bg-emerald-50 p-5 dark:bg-emerald-500/10">
        <h3 className="font-bold text-emerald-700 dark:text-emerald-300">✅ 이럴 때 쓴다</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm marker:text-emerald-500">
          {use.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      </div>
      <div className="rounded-xl bg-zinc-100 p-5 dark:bg-zinc-800/60">
        <h3 className="font-bold text-zinc-700 dark:text-zinc-300">🚫 굳이 안 써도 된다</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm marker:text-zinc-400">
          {avoid.map((u, i) => <li key={i}>{u}</li>)}
        </ul>
      </div>
    </div>
  );
}

const CALLOUT = {
  info: 'border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900',
  warn: 'bg-amber-50 dark:bg-amber-500/10',
  tip: 'bg-emerald-50 dark:bg-emerald-500/10',
};

export function Callout({ type = 'info', title, children }) {
  return (
    <div className={`rounded-xl px-5 py-4 text-sm ${CALLOUT[type]}`}>
      {title && <p className="mb-1 font-bold text-zinc-900 dark:text-zinc-50">{title}</p>}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
          <tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => <td key={j} className={`px-4 py-2.5 align-top ${j === 0 ? 'font-medium whitespace-nowrap' : ''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOKEN =
  /(\/\/.*$|\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\})|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|export|default|const|let|function|return|if|else|for|while|new|async|await|true|false|null|undefined|of)\b|\b(use[A-Z]\w*|memo|lazy|startTransition)\b|(<\/?[A-Z][\w.]*|<\/?[a-z][\w-]*(?=[\s>/]))|\b(\d[\d_]*)\b/gm;
const CLASSES = [null, 'tk-comment', 'tk-string', 'tk-keyword', 'tk-hook', 'tk-tag', 'tk-number'];

export function highlight(code) {
  const out = [];
  let last = 0;
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const group = m.findIndex((g, i) => i > 0 && g !== undefined);
    out.push(<span key={m.index} className={CLASSES[group]}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, title }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#1e1f24] ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-white/10">
      {title && <div className="border-b border-white/10 px-4 py-2 text-xs text-zinc-400">{title}</div>}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-zinc-200">
        <code className="font-mono">{highlight(code.trim())}</code>
      </pre>
    </div>
  );
}

// 안 썼을 때 / 썼을 때 코드를 나란히 보여준다
export function CodeCompare({ before, after }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        ['bad', '❌', before.label ?? '안 썼을 때', before],
        ['good', '✅', after.label ?? '썼을 때', after],
      ].map(([kind, icon, label, side]) => (
        <div key={kind} className="min-w-0 space-y-2">
          <span
            className={`inline-block rounded-lg px-3 py-1 text-sm font-bold ${
              kind === 'bad'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            }`}
          >
            {icon} {label}
          </span>
          <CodeBlock code={side.code} />
          <p className={`text-sm ${ui.muted}`}>{side.note}</p>
        </div>
      ))}
    </div>
  );
}

export function Demo({ children, hint }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
      {hint && <p className={`mb-4 text-sm ${ui.muted}`}>👉 {hint}</p>}
      {children}
    </div>
  );
}

export function Viz({ children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {children}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className={`mt-4 flex flex-wrap gap-4 text-xs ${ui.muted}`}>
      {items.map(([cls, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <i className={`inline-block h-3 w-3 rounded ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold select-none">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-[22px] w-10 flex-none rounded-full bg-zinc-300 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 after:absolute after:top-[3px] after:left-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:left-[21px] dark:bg-zinc-700" />
      {label}
    </label>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${
            value === o.value
              ? 'bg-white font-semibold text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 렌더될 때마다 숫자가 올라가는 카운터. "이 컴포넌트가 다시 그려졌나?"를 눈으로 확인하는 용도.
export function useRenderCount() {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// key가 바뀌면 다시 마운트되면서 노란색으로 깜빡인다
export function RenderBadge({ count }) {
  return (
    <span key={count} className="inline-block animate-flash rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-500 tabular-nums dark:bg-zinc-800 dark:text-zinc-400">
      렌더 {count}회
    </span>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-800/60">
      <div className={`text-lg font-bold tabular-nums ${tone ? ui[tone] : ''}`}>{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}
