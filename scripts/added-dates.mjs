// 질문 md의 "등록일"을 src/data/added.json에 기록한다.
// - 이미 기록된 파일은 건드리지 않는다 (등록일은 처음 한 번만 정해진다)
// - 새 파일은 git에서 처음 추가된 시점을 찾고, 아직 커밋 전이면 지금 시각을 쓴다
// - 지워진 파일은 목록에서 뺀다
//
// vite 플러그인(vite.config.js)이 개발 서버·빌드 때 자동으로 부르고, 개발 서버에서는 파일에도 저장한다.
// 직접 실행: npm run dates / 전체를 git 기록으로 다시 계산: npm run dates -- --rebuild
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'src/data/added.json');

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

// --follow: 폴더를 옮긴 파일도 처음 만든 날짜를 찾는다
const firstAdded = (file) =>
  git('log', '--follow', '--diff-filter=A', '--format=%cI', '--', file).split('\n').filter(Boolean).pop();

const sortByDate = (obj) =>
  Object.fromEntries(
    Object.entries(obj).sort(([a, da], [b, db]) => Date.parse(da) - Date.parse(db) || a.localeCompare(b))
  );

/** keys: ['web-questions/docker', ...] → { key: ISO 날짜 } */
export function addedDates(keys, { write = false, rebuild = false } = {}) {
  const old = !rebuild && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const now = new Date().toISOString();
  const next = {};
  for (const key of keys) next[key] = old[key] || firstAdded(`${key}.md`) || now;

  const sorted = sortByDate(next);
  if (write) {
    // 등록일 순서로 저장해서 diff에서 새 항목이 맨 아래에 보이게 한다
    const text = JSON.stringify(sorted, null, 2) + '\n';
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== text) fs.writeFileSync(OUT, text);
  }
  return sorted;
}

export const questionKeys = () =>
  fs
    .readdirSync(ROOT)
    .filter((d) => d.endsWith('-questions'))
    .flatMap((folder) =>
      fs
        .readdirSync(path.join(ROOT, folder))
        .filter((f) => f.endsWith('.md'))
        .map((f) => `${folder}/${f.replace(/\.md$/, '')}`)
    );

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dates = addedDates(questionKeys(), { write: true, rebuild: process.argv.includes('--rebuild') });
  console.log(`added.json: ${Object.keys(dates).length}개`);
}
