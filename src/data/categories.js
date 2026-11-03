// 저장소의 *-questions 폴더 하나가 카테고리 하나. 순서는 README와 맞춘다.
export const categories = [
  { id: 'web', folder: 'web-questions', title: 'Web', description: '브라우저, 네트워크 등 웹·프론트엔드 전반 지식' },
  { id: 'html', folder: 'HTML-questions', title: 'HTML', description: '시맨틱 태그, 스토리지, 스크립트 로딩' },
  { id: 'css', folder: 'CSS-questions', title: 'CSS', description: '박스 모델, 선택자, 레이아웃' },
  { id: 'javascript', folder: 'javascript-questions', title: 'JavaScript', description: '실행 컨텍스트, 비동기, 이벤트 루프 등 JS 핵심' },
  { id: 'react', folder: 'react-questions', title: 'React', description: '컴포넌트, Hook, 렌더링과 최적화' },
  { id: 'ai', folder: 'ai-questions', title: 'AI', description: 'AI Agent, 하네스, LangChain·LangGraph' },
];

export const findCategory = (id) => categories.find((c) => c.id === id);
export const categoryByFolder = (folder) => categories.find((c) => c.folder === folder);
