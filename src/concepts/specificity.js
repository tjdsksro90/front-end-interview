// CSS 선택자 우선순위(명시도) 계산기: [a, b, c] = [id, class·속성·가상클래스, 태그·가상요소]
// :is() · :not() · :has() → 괄호 안 선택자 중 가장 높은 값, :where() → 항상 0

const LEGACY_PSEUDO_ELEMENTS = ['before', 'after', 'first-line', 'first-letter'];
const TAKES_MAX = ['is', 'not', 'has', 'matches', '-webkit-any'];

const add = (x, y) => [x[0] + y[0], x[1] + y[1], x[2] + y[2]];
export const compare = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
const max = (list) => list.reduce((m, s) => (compare(s, m) > 0 ? s : m), [0, 0, 0]);

// 괄호·대괄호·따옴표 밖의 쉼표로 나눈다
export function splitList(text) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const IDENT = /^-?[_a-zA-Z -￿][-\w -￿]*/;

// 괄호 안 내용을 읽는다. i는 '(' 위치. [내용, 닫는 괄호 다음 위치]
function readParens(s, i) {
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === '(') depth++;
    else if (s[j] === ')' && --depth === 0) return [s.slice(i + 1, j), j + 1];
  }
  throw new Error('괄호가 닫히지 않았어요');
}

// 쉼표 없는 하나의 선택자
function complexSpecificity(sel) {
  let total = [0, 0, 0];
  let i = 0;
  const s = sel.trim();
  while (i < s.length) {
    const ch = s[i];
    if (/[\s>+~*&|]/.test(ch)) {
      i++;
    } else if (ch === '#') {
      const m = s.slice(i + 1).match(IDENT);
      if (!m) throw new Error(`# 뒤에 이름이 없어요`);
      total = add(total, [1, 0, 0]);
      i += 1 + m[0].length;
    } else if (ch === '.') {
      const m = s.slice(i + 1).match(IDENT);
      if (!m) throw new Error(`. 뒤에 이름이 없어요`);
      total = add(total, [0, 1, 0]);
      i += 1 + m[0].length;
    } else if (ch === '[') {
      const end = s.indexOf(']', i);
      if (end < 0) throw new Error('[ 가 닫히지 않았어요');
      total = add(total, [0, 1, 0]);
      i = end + 1;
    } else if (ch === ':') {
      const isElement = s[i + 1] === ':';
      const start = i + (isElement ? 2 : 1);
      const m = s.slice(start).match(IDENT);
      if (!m) throw new Error(': 뒤에 이름이 없어요');
      const name = m[0].toLowerCase();
      i = start + m[0].length;
      let args = null;
      if (s[i] === '(') [args, i] = readParens(s, i);

      if (isElement || LEGACY_PSEUDO_ELEMENTS.includes(name)) total = add(total, [0, 0, 1]);
      else if (name === 'where') total = add(total, [0, 0, 0]);
      else if (TAKES_MAX.includes(name) && args != null) {
        // :has(> img)처럼 조합자로 시작하는 상대 선택자도 그대로 계산한다
        total = add(total, max(splitList(args).map(complexSpecificity)));
      } else if ((name === 'nth-child' || name === 'nth-last-child') && args && / of /.test(args)) {
        total = add(total, add([0, 1, 0], max(splitList(args.split(/ of /)[1]).map(complexSpecificity))));
      } else total = add(total, [0, 1, 0]);
    } else {
      const m = s.slice(i).match(IDENT);
      if (!m) throw new Error(`'${ch}' 를 읽을 수 없어요`);
      total = add(total, [0, 0, 1]);
      i += m[0].length;
    }
  }
  return total;
}

// 선택자 목록(쉼표 포함)이면 각각의 우선순위를 돌려준다
export function specificityList(selector) {
  return splitList(selector).map((sel) => ({ sel, value: complexSpecificity(sel) }));
}

export const specificity = (selector) => complexSpecificity(selector);
export const format = (v) => `(${v.join(', ')})`;
