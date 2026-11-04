import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findCategory } from '../data/categories.js';
import { findQuestion, questionsOf } from '../data/questions.js';
import Crumbs from '../components/Crumbs.jsx';
import { cardClass, deepPathOf } from '../components/QuestionCard.jsx';
import NotFound from './NotFound.jsx';

// 마크다운 렌더러 + 코드 하이라이트는 무거워서 질문 페이지에 들어올 때만 받는다
const Markdown = lazy(() => import('../components/Markdown.jsx'));

// 제목은 목록에서 이미 보여주므로 본문 첫 "# Q :" 줄은 뺀다
const stripQuestion = (md) => md.replace(/^\s*#+\s*Q\s*:.*\r?\n/, '');

export default function QuestionPage() {
  const { categoryId, slug } = useParams();
  const category = findCategory(categoryId);
  const question = findQuestion(categoryId, slug);
  const [source, setSource] = useState(null);

  useEffect(() => {
    if (!question?.load) return; // md 답변이 아직 없는 질문
    let alive = true;
    setSource(null);
    question.load().then((md) => alive && setSource(stripQuestion(md)));
    return () => {
      alive = false;
    };
  }, [question]);

  if (!category || !question) return <NotFound />;

  const siblings = questionsOf(categoryId);
  const i = siblings.indexOf(question);

  return (
    <article>
      <Crumbs
        items={[{ to: '/', label: '홈' }, { to: `/${categoryId}`, label: category.title }, { label: question.title }]}
      />
      <p className="mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-400">Q.</p>
      <h1 className="mt-1 text-2xl leading-snug font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
        {question.title}
      </h1>

      {question.deep.length > 0 && <DeepLinks question={question} />}

      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {question.load ? (
          <>
            <Suspense fallback={<p className="text-zinc-400">불러오는 중…</p>}>
              {source != null && <Markdown source={source} folder={question.folder} />}
            </Suspense>
            {source == null && <p className="text-zinc-400">불러오는 중…</p>}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            아직 직접 쓴 답변(md)이 없어요.{' '}
            <code className="font-mono">
              {question.folder}/{question.slug}.md
            </code>{' '}
            파일을 만들면 여기에 보입니다.
          </p>
        )}
      </div>

      {(question.links.length > 0 || question.backlinks.length > 0) && <Connections question={question} />}

      <Pager categoryId={categoryId} prev={siblings[i - 1]} next={siblings[i + 1]} />
    </article>
  );
}

function DeepLinks({ question }) {
  return (
    <div className="mt-6 rounded-2xl bg-violet-50 p-4 sm:p-5 dark:bg-violet-500/10">
      <p className="text-sm font-bold text-violet-700 dark:text-violet-300">이 질문은 심화 학습이 있어요</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {question.deep.map((d) => (
          <Link
            key={d.slug}
            to={deepPathOf(question, d)}
            className="rounded-xl bg-white px-4 py-3 ring-1 ring-violet-200 transition hover:ring-violet-400 dark:bg-zinc-900 dark:ring-violet-500/30 dark:hover:ring-violet-400"
          >
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">심화 · {d.title} →</span>
            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{d.summary}</span>
            <span className="mt-1.5 block text-[11px] text-violet-600/80 dark:text-violet-300/70">
              {d.light ? '개념 · 확인 경로·화면 예시 · 코드' : '개념 · 시각화 · 코드 비교 · 직접 해보기'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// md 안의 링크로 이어진 질문들 (Obsidian의 링크·백링크와 같은 개념)
function Connections({ question }) {
  const groups = [
    { title: '이 답변에서 언급한 질문', items: question.links },
    { title: '이 질문을 언급한 답변', items: question.backlinks },
  ].filter((g) => g.items.length > 0);

  return (
    <section className="mt-12 rounded-2xl border border-zinc-200 p-4 sm:p-5 dark:border-zinc-800">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">연결된 질문</h2>
      <div className={`mt-3 grid gap-5 ${groups.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {g.title} <span className="tabular-nums">{g.items.length}</span>
            </p>
            <ul className="mt-2 space-y-1">
              {g.items.map((q) => (
                <li key={`${q.categoryId}/${q.slug}`}>
                  <Link
                    to={`/${q.categoryId}/${q.slug}`}
                    className="group flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  >
                    <span className="flex-none rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                      {q.categoryId}
                    </span>
                    <span className="text-zinc-700 group-hover:text-indigo-600 dark:text-zinc-300 dark:group-hover:text-indigo-400">{q.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Pager({
  prev,
  next,
  categoryId,
  prevLabel = '← 이전 질문',
  nextLabel = '다음 질문 →',
  pathOf = (q) => `/${categoryId}/${q.slug}`,
}) {
  return (
    <nav className="mt-16 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link to={pathOf(prev)} className={`${cardClass} flex flex-col gap-1`}>
          <span className="text-xs text-zinc-400">{prevLabel}</span>
          <span className="font-semibold">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={pathOf(next)} className={`${cardClass} flex flex-col gap-1 items-end text-right`}>
          <span className="text-xs text-zinc-400">{nextLabel}</span>
          <span className="font-semibold">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
