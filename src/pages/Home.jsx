import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { categories } from '../data/categories.js';
import { questions, questionsOf, searchText, isNew, sortQuestions } from '../data/questions.js';
import { matches } from '../data/search.js';
import SearchInput, { useQueryParam } from '../components/SearchInput.jsx';
import QuestionCard, { cardClass, NewBadge } from '../components/QuestionCard.jsx';
import { recall, remember } from '../components/historyMemory.js';

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

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filteredCategories.map((c) => {
          const list = questionsOf(c.id);
          const deepCount = list.reduce((n, q) => n + q.deep.length, 0);
          return (
            <Link key={c.id} to={`/${c.id}`} className={`${cardClass} block hover:-translate-y-0.5`}>
              <h3 className="flex items-center justify-between gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                {c.title}
                {/* 최근 7일 안에 새 질문이 추가된 카테고리 */}
                {list.some((q) => isNew(q)) && <NewBadge />}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c.description}</p>
              <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                질문 {list.length}개{deepCount > 0 && <span className="text-violet-600 dark:text-violet-300"> · 심화 {deepCount}개</span>} →
              </p>
            </Link>
          );
        })}
      </div>

      {!query && <AllQuestions />}

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

// 검색 전: 전체 질문을 최신 등록순으로 10개씩. 목록 끝이 화면에 들어오면 다음 10개를 붙인다.
// 몇 개까지 불러왔는지는 방문 기록(location.key)마다 기억한다. 질문을 보고 뒤로 가기로 돌아오면
// 첫 렌더부터 그 개수만큼 그려서, Layout이 예전 스크롤 위치로 돌려놓을 수 있게 한다.
const PAGE = 10;
const latest = sortQuestions(questions, 'new');

function AllQuestions() {
  const { key } = useLocation();
  const [count, setCount] = useState(() => recall(key, 'home-count') ?? PAGE);
  useEffect(() => remember(key, 'home-count', count), [key, count]);
  const sentinel = useRef(null);
  const hasMore = count < latest.length;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return;
    // 끝에 닿기 조금 전(400px)부터 미리 붙인다
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setCount((c) => Math.min(c + PAGE, latest.length)),
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, count]);

  return (
    <>
      <h2 className="mt-10 mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
        전체 질문 <span className="text-zinc-400">{latest.length}</span>
        <span className="ml-2 text-xs font-normal text-zinc-400">최신 등록순</span>
      </h2>
      <div className="grid gap-3">
        {latest.slice(0, count).map((q) => <QuestionCard key={`${q.categoryId}/${q.slug}`} question={q} showCategory />)}
      </div>
      <div ref={sentinel} className="py-6 text-center">
        {hasMore ? (
          <button
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400"
            onClick={() => setCount((c) => Math.min(c + PAGE, latest.length))}
          >
            더 보기 ({count} / {latest.length})
          </button>
        ) : (
          <p className="text-sm text-zinc-400">모든 질문을 다 봤어요.</p>
        )}
      </div>
    </>
  );
}
