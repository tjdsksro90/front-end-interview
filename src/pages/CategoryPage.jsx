import { useParams } from 'react-router-dom';
import { findCategory } from '../data/categories.js';
import { questionsOf, searchText, sortQuestions } from '../data/questions.js';
import { matches } from '../data/search.js';
import SearchInput, { useQueryParam } from '../components/SearchInput.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import Crumbs from '../components/Crumbs.jsx';
import { Toggle } from '../components/kit.jsx';
import NotFound from './NotFound.jsx';

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [query, setQuery] = useQueryParam();
  const [deep, setDeep] = useQueryParam('deep');
  const [sort, setSort] = useQueryParam('sort');
  const deepOnly = deep === '1';
  const order = sort === 'old' ? 'old' : 'new'; // 기본은 최신 등록순
  const category = findCategory(categoryId);
  if (!category) return <NotFound />;

  const all = questionsOf(categoryId);
  const hasDeep = all.some((q) => q.deep.length);
  const filtered = sortQuestions(
    all.filter((q) => matches(searchText(q), query) && (!deepOnly || q.deep.length)),
    order
  );

  return (
    <>
      <Crumbs items={[{ to: '/', label: '홈' }, { label: category.title }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {category.title}
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">{category.description}</p>

      <SearchInput value={query} onChange={setQuery} placeholder={`${category.title} 질문 검색`} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-400">{filtered.length === all.length ? `전체 ${all.length}개` : `${filtered.length} / ${all.length}개`}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            checked={deepOnly}
            onChange={(on) => setDeep(on ? '1' : '')}
            label={<span className="text-sm text-violet-600 dark:text-violet-300">심화 있는 것만</span>}
          />
          {/* 최신 등록순(기본)은 URL에 남기지 않는다 */}
          <select
            aria-label="정렬"
            value={order}
            onChange={(e) => setSort(e.target.value === 'old' ? 'old' : '')}
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="new">최신 등록순</option>
            <option value="old">등록순</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.map((q) => <QuestionCard key={q.slug} question={q} index={all.indexOf(q)} />)}
      </div>
      {!filtered.length && (
        <p className="py-12 text-center text-zinc-400">
          {deepOnly && !hasDeep ? `${category.title}에는 아직 심화가 있는 질문이 없어요.` : '조건에 맞는 질문이 없어요.'}
        </p>
      )}
    </>
  );
}
