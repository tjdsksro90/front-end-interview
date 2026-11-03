// 용어·도구 정리 위주 심화(light)에서 쓰는 블록.
// 실제 도구 화면을 캡처하는 대신, 자주 보게 되는 화면을 단순화해서 HTML로 재현한다.

// 확인 경로: [{ where: 'Chrome DevTools', path: ['F12', 'Network', ...], what: '무엇을 보면 되는지' }]
export function WhereToCheck({ items }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{it.where}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {it.path.map((p, j) => (
              <span key={j} className="flex items-center gap-1.5">
                {j > 0 && <span className="text-zinc-400">›</span>}
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{p}</span>
              </span>
            ))}
          </div>
          {it.what && <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{it.what}</p>}
        </div>
      ))}
    </div>
  );
}

// 앱/브라우저 창 모양 프레임
export function Screen({ title, caption, children, dark }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-zinc-300 shadow-sm dark:border-zinc-700">
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate text-xs text-zinc-500 dark:text-zinc-400">{title}</span>
      </div>
      <div className={`overflow-x-auto text-xs ${dark ? 'bg-[#1e1f24] text-zinc-200' : 'bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'}`}>{children}</div>
      <figcaption className="border-t border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        화면 예시 · {caption ?? '실제 화면을 단순화해서 재현했어요'}
      </figcaption>
    </figure>
  );
}

// 폴더 트리. lines: ['src/', '  app/', ...] 처럼 들여쓰기로 깊이를 표현하고, '# 설명'은 주석으로 표시
export function FolderTree({ lines, title }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-[#1e1f24] p-4 font-mono text-[13px] leading-relaxed text-zinc-200">
      {title && <div className="mb-2 text-xs text-zinc-400">{title}</div>}
      {lines.map((l, i) => {
        const [path, comment] = l.split(/\s+#\s/);
        const isDir = path.trim().endsWith('/');
        return (
          <div key={i} className="whitespace-pre">
            <span className={isDir ? 'text-sky-300' : ''}>{path}</span>
            {comment && <span className="tk-comment">  # {comment}</span>}
          </div>
        );
      })}
    </div>
  );
}
