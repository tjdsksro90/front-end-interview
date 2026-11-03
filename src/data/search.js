// 대소문자/공백 무시하고 포함 여부로 검색한다.
const normalize = (s) => s.toLowerCase().replace(/\s+/g, '');

export function matches(text, query) {
  const q = normalize(query);
  return !q || normalize(text).includes(q);
}
