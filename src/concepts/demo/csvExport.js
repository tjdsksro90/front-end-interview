// Dynamic Import 데모용: 버튼을 눌렀을 때만 불러오는 "무거운 기능" 모듈.
// 실제 서비스라면 xlsx 같은 큰 라이브러리가 여기에 들어간다.
export function toCSV(rows) {
  const header = Object.keys(rows[0]);
  const escape = (v) => `"${String(v).replaceAll('"', '""')}"`;
  return [header.join(','), ...rows.map((r) => header.map((h) => escape(r[h])).join(','))].join('\n');
}

export default toCSV;
