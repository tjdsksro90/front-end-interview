import index from 'virtual:questions';
import { categoryByFolder } from './categories.js';
import { deepDives } from '../concepts/index.js';

// 본문은 페이지에 들어갈 때만 불러온다 (파일마다 별도 청크)
const contents = import.meta.glob('/*-questions/*.md', { query: '?raw', import: 'default' });

// 아직 md 답변이 없지만 심화부터 만든 질문. 같은 폴더·이름의 md 파일을 만들면 그 md가 대신 쓰인다.
const PENDING = [
  { folder: 'ai-questions', slug: 'ai-agent', title: 'AI Agent란 무엇이고, 하네스(Harness)는 무엇인가요?', summary: '' },
  { folder: 'react-questions', slug: 'react-versions', title: 'React는 버전별로 무엇이 바뀌었나요? (16.8 · 17 · 18 · 19)', summary: '' },
  { folder: 'react-questions', slug: 'nextjs-versions', title: 'Next.js는 버전별로 무엇이 바뀌었나요? (Pages Router → App Router)', summary: '' },
  { folder: 'ai-questions', slug: 'langchain-langgraph', title: 'LangChain과 LangGraph는 무엇이고 어떻게 다른가요?', summary: '' },
].filter((p) => !index.some((q) => q.folder === p.folder && q.slug === p.slug));

export const questions = [...index, ...PENDING]
  .filter((q) => categoryByFolder(q.folder))
  .map((q) => {
    const categoryId = categoryByFolder(q.folder).id;
    return {
      ...q,
      categoryId,
      // also: 다른 질문에도 같은 심화를 보여줄 때 (예: :has()는 최신 CSS 질문과 선택자 비교 질문 둘 다)
      deep: deepDives.filter((d) =>
        [d.parent, ...(d.also ?? [])].some((p) => p.categoryId === categoryId && p.slug === q.slug)
      ),
      load: contents[`/${q.folder}/${q.slug}.md`],
    };
  });

// 질문 사이 연결: links = 이 답변이 언급한 질문, backlinks = 이 질문을 언급한 답변
const byKey = new Map(questions.map((q) => [`${q.folder}/${q.slug}`, q]));
for (const q of questions) {
  q.links = (q.links ?? []).map((k) => byKey.get(k)).filter(Boolean);
  q.backlinks = [];
}
for (const q of questions) for (const target of q.links) target.backlinks.push(q);

export const questionsOf = (categoryId) => questions.filter((q) => q.categoryId === categoryId);
export const findQuestion = (categoryId, slug) =>
  questions.find((q) => q.categoryId === categoryId && q.slug === slug);

// 검색 대상: 질문 제목·요약 + 연결된 심화 페이지의 제목·태그
export const searchText = (q) =>
  [q.title, q.summary, q.slug, ...q.deep.flatMap((d) => [d.title, ...d.tags])].join(' ');
