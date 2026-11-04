// md 사이의 링크를 다룬다. Obsidian에서 쓴 링크 두 가지를 모두 읽는다.
//   위키 링크:   [[docker]], [[react-questions/hooks|훅 정리]], [[cors#preflight]]
//   일반 링크:   [Docker](docker.md), [CORS](./cors.md), [훅](../react-questions/hooks.md)
// vite.config.js(빌드 시점, Node)와 Markdown.jsx(브라우저)에서 같이 쓰므로 순수 함수만 둔다.

// 코드 블록·인라인 코드 안의 [[...]]는 링크가 아니다 → 코드가 아닌 부분만 바꾼다
const CODE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/;
const mapOutsideCode = (text, fn) =>
  text
    .split(CODE)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join('');

const WIKI = /(!?)\[\[([^\]|#\n]+)(#[^\]|\n]*)?(?:\|([^\]\n]+))?\]\]/g;
const MD_LINK = /\]\(<?([^)\s>]+?\.md)(#[^)\s>]*)?>?\)/g;

// [[target#hash|label]] → [label](target.md#hash). 이미지 임베드(![[...]])는 그대로 둔다
export function wikiToMarkdown(text = '') {
  return mapOutsideCode(text, (part) =>
    part.replace(WIKI, (all, bang, target, hash = '', label) => {
      if (bang) return all;
      const t = target.trim();
      const shown = (label ?? t.split('/').pop()).trim();
      return `[${shown}](${encodeURI(t)}.md${hash})`;
    })
  );
}

// 본문에서 다른 md를 가리키는 링크 대상만 뽑는다 (빌드 시점에 백링크 계산용)
export function extractTargets(text = '') {
  const out = [];
  mapOutsideCode(text, (part) => {
    for (const m of part.matchAll(WIKI)) if (!m[1]) out.push(m[2].trim());
    for (const m of part.matchAll(MD_LINK)) out.push(m[1]);
    return part;
  });
  return out;
}

// 링크 대상 → { folder, slug }. entries: [{ folder, slug }]
// 폴더가 적혀 있으면 그 폴더에서, 없으면 같은 폴더 → 전체에서 이름이 하나뿐인 파일 순으로 찾는다.
// (Obsidian의 "가장 짧은 경로" 설정은 다른 폴더 파일도 [[docker]]처럼 이름만 쓰기 때문)
export function resolveLink(raw, fromFolder, entries) {
  if (!raw || /^[a-z]+:/i.test(raw)) return null; // http:, mailto: 등
  let path;
  try {
    path = decodeURI(raw);
  } catch {
    path = raw;
  }
  path = path.split('#')[0].replace(/\.md$/, '');
  const parts = path.split('/').filter((p) => p && p !== '.' && p !== '..');
  const slug = parts.pop();
  if (!slug) return null;
  const folder = parts.reverse().find((p) => p.endsWith('-questions'));

  const same = (e) => e.slug === slug;
  if (folder) return entries.find((e) => same(e) && e.folder === folder) ?? null;
  const local = entries.find((e) => same(e) && e.folder === fromFolder);
  if (local) return local;
  const all = entries.filter(same);
  return all.length === 1 ? all[0] : null;
}

export const linkKey = (e) => `${e.folder}/${e.slug}`;
