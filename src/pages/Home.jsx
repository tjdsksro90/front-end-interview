import { Link } from 'react-router-dom';
import { categories, findCategory } from '../data/categories.js';
import { questions, questionsOf, searchText, recentQuestions, isNew, NEW_DAYS } from '../data/questions.js';
import { matches } from '../data/search.js';
import SearchInput, { useQueryParam } from '../components/SearchInput.jsx';
import QuestionCard, { cardClass, NewBadge, formatAdded } from '../components/QuestionCard.jsx';

export default function Home() {
  const [query, setQuery] = useQueryParam();
  const filteredCategories = categories.filter((c) => matches(`${c.title} ${c.description} ${c.id}`, query));
  const matched = query ? questions.filter((q) => matches(searchText(q), query)) : [];

  return (
    <>
      <section className="pt-6 pb-2">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">총 {questions.length}개 질문</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          프론트엔드 면접 질문
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">카테고리를 고르거나, 질문을 바로 검색하세요.</p>
      </section>

      <SearchInput value={query} onChange={setQuery} placeholder="카테고리 또는 질문 검색 (예: 클로저, useMemo, 박스 모델)" />

      {!query && <Recent />}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filteredCategories.map((c) => {
          const list = questionsOf(c.id);
          const deepCount = list.reduce((n, q) => n + q.deep.length, 0);
          return (
            <Link key={c.id} to={`/${c.id}`} className={`${cardClass} block hover:-translate-y-0.5`}>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{c.title}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c.description}</p>
              <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                질문 {list.length}개{deepCount > 0 && <span className="text-violet-600 dark:text-violet-300"> · 심화 {deepCount}개</span>} →
              </p>
            </Link>
          );
        })}
      </div>

      {query && (
        <>
          <h2 className="mt-10 mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
            질문 검색 결과 <span className="text-zinc-400">{matched.length}</span>
          </h2>
          <div className="grid gap-3">
            {matched.map((q) => <QuestionCard key={`${q.categoryId}/${q.slug}`} question={q} showCategory />)}
          </div>
          {!filteredCategories.length && !matched.length && (
            <p className="py-12 text-center text-zinc-400">"{query}"에 해당하는 항목이 없어요.</p>
          )}
        </>
      )}
    </>
  );
}

// 검색창 아래: 최근에 추가된 질문. 등록 후 NEW_DAYS일 동안은 NEW 라벨이 붙는다.
function Recent() {
  const list = recentQuestions(5);
  if (!list.length) return null;
  const newCount = questions.filter((q) => isNew(q)).length;
  return (
    <section className="mt-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">최근 추가된 질문</h2>
        <p className="text-xs text-zinc-400">
          {newCount > 0 ? `최근 ${NEW_DAYS}일 동안 ${newCount}개 추가` : `최근 ${NEW_DAYS}일 동안 추가된 질문이 없어요`}
        </p>
      </div>
      <ul className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        {list.map((q) => (
          <li key={`${q.categoryId}/${q.slug}`}>
            <Link to={`/${q.categoryId}/${q.slug}`} className="group flex items-center gap-3 py-2 text-sm">
              <span className="w-20 flex-none text-xs text-zinc-400 tabular-nums">{formatAdded(q.added)}</span>
              <span className="min-w-0 flex-1 text-zinc-700 group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400">
                {q.title}
                {isNew(q) && <NewBadge />}
              </span>
              <span className="hidden flex-none text-xs text-zinc-400 sm:inline">{findCategory(q.categoryId)?.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
