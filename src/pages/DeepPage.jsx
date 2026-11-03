import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findCategory } from '../data/categories.js';
import { findQuestion } from '../data/questions.js';
import Crumbs from '../components/Crumbs.jsx';
import { deepPathOf } from '../components/QuestionCard.jsx';
import { Pager } from './QuestionPage.jsx';
import NotFound from './NotFound.jsx';

const SECTIONS = ['개념', '시각화', '코드 비교', '직접 해보기'];

export default function DeepPage() {
  const { categoryId, slug, deepSlug } = useParams();
  const category = findCategory(categoryId);
  const question = findQuestion(categoryId, slug);
  const deep = question?.deep.find((d) => d.slug === deepSlug);
  if (!category || !deep) return <NotFound />;

  const i = question.deep.indexOf(deep);
  const { Component } = deep;
  const basePath = `/${categoryId}/${slug}`;

  return (
    <article>
      <Crumbs
        items={[
          { to: '/', label: '홈' },
          { to: `/${categoryId}`, label: category.title },
          { to: basePath, label: question.title },
          { label: `심화 · ${deep.title}` },
        ]}
      />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">🔬 심화</span>
        <Link to={basePath} className="text-sm text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400">← 기본 답변 보기</Link>
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">{deep.title}</h1>
      <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">{deep.summary}</p>
      <nav className="mt-5 flex flex-wrap gap-2 text-sm">
        {SECTIONS.map((s, n) => (
          <a
            key={s}
            href={`#step-${n + 1}`}
            className="rounded-full border border-zinc-200 px-3 py-1 text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-indigo-300"
          >
            {n + 1}. {s}
          </a>
        ))}
      </nav>

      <Suspense fallback={<p className="mt-10 text-zinc-400">페이지 불러오는 중…</p>}>
        <Component />
      </Suspense>

      <Pager
        prev={question.deep[i - 1]}
        next={question.deep[i + 1]}
        prevLabel="← 이전 심화"
        nextLabel="다음 심화 →"
        pathOf={(d) => deepPathOf(question, d)}
      />
    </article>
  );
}
