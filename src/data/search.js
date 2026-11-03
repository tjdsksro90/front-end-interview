// 대소문자/공백 무시하고 포함 여부로 검색한다.
// null·undefined가 들어와도 빈 문자열로 처리한다 (검색어가 없으면 전체 매칭)
const normalize = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

export function matches(text, query) {
  const q = normalize(query);
  return !q || normalize(text).includes(q);
}
