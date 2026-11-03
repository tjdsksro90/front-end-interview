import index from 'virtual:questions';
import { categoryByFolder } from './categories.js';
import { deepDives } from '../concepts/index.js';

// 본문은 페이지에 들어갈 때만 불러온다 (파일마다 별도 청크)
const contents = import.meta.glob('/*-questions/*.md', { query: '?raw', import: 'default' });

export const questions = index
  .filter((q) => categoryByFolder(q.folder))
  .map((q) => {
    const categoryId = categoryByFolder(q.folder).id;
    return {
      ...q,
      categoryId,
      deep: deepDives.filter((d) => d.parent.categoryId === categoryId && d.parent.slug === q.slug),
      load: contents[`/${q.folder}/${q.slug}.md`],
    };
  });

export const questionsOf = (categoryId) => questions.filter((q) => q.categoryId === categoryId);
export const findQuestion = (categoryId, slug) =>
  questions.find((q) => q.categoryId === categoryId && q.slug === slug);

// 검색 대상: 질문 제목·요약 + 연결된 심화 페이지의 제목·태그
export const searchText = (q) =>
  [q.title, q.summary, q.slug, ...q.deep.flatMap((d) => [d.title, ...d.tags])].join(' ');
