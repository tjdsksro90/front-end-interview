import { Link } from 'react-router-dom';

export const cardClass =
  'rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-400/60';

export function Tag({ children, strong }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs ${
        strong
          ? 'bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300'
          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
      }`}
    >
      {children}
    </span>
  );
}

const pathOf = (q) => `/${q.categoryId}/${q.slug}`;
export const deepPathOf = (q, d) => `${pathOf(q)}/deep/${d.slug}`;

// 기본 답변(md)은 카드 전체, 심화가 있으면 아래에 선택지가 추가로 붙는다.
export default function QuestionCard({ question, index, showCategory }) {
  return (
    <div className={`${cardClass} group relative`}>
      <div className="flex gap-4">
        {index != null && (
          <span className="pt-0.5 font-mono text-sm font-bold text-zinc-400 tabular-nums group-hover:text-indigo-500">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {/* after:absolute로 카드 전체를 클릭 영역으로 만들고, 심화 링크는 그 위(z-10)에 올린다 */}
          <Link to={pathOf(question)} className="font-semibold text-zinc-900 after:absolute after:inset-0 after:rounded-2xl dark:text-zinc-50">
            {question.title}
          </Link>
          {question.summary && <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{question.summary}</p>}
          {(showCategory || question.deep.length > 0) && (
            <div className="relative z-10 mt-3 flex flex-wrap items-center gap-1.5">
              {showCategory && <Tag strong>{question.categoryId}</Tag>}
              {question.deep.length > 0 && (
                <>
                  <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">📄 기본</span>
                  {question.deep.map((d) => (
                    <Link
                      key={d.slug}
                      to={deepPathOf(question, d)}
                      className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30 dark:hover:bg-violet-500/25"
                    >
                      🔬 심화 · {d.title}
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
