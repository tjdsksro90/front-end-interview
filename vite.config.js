import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { extractTargets, resolveLink, linkKey } from './src/data/links.js';
import { addedDates } from './scripts/added-dates.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const VIRTUAL_ID = 'virtual:questions';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

// 제목·요약용: "# Q :" 접두어, HTML 태그, 마크다운 강조(**, `)를 걷어낸다
const clean = (line = '') =>
  line.replace(/^#+\s*[QA]\s*:\s*/, '').replace(/<[^>]+>/g, '').replace(/\*\*|`/g, '').trim();

// *-questions/*.md 파일의 목록(제목, 한 줄 요약)만 빌드 시점에 뽑아서 가상 모듈로 제공한다.
// 본문은 페이지에 들어갈 때 import.meta.glob으로 따로 불러온다.
function questionsIndex() {
  const read = () => {
    const folders = fs.readdirSync(ROOT).filter((d) => d.endsWith('-questions'));
    return folders.flatMap((folder) =>
      fs
        .readdirSync(path.join(ROOT, folder))
        .filter((f) => f.endsWith('.md'))
        .sort()
        .map((file) => {
          const lines = fs.readFileSync(path.join(ROOT, folder, file), 'utf8').split(/\r?\n/);
          const q = lines.find((l) => /^#+\s*Q\s*:/.test(l)) ?? lines.find((l) => l.startsWith('#'));
          const a = lines.find((l) => /^#+\s*A\s*:/.test(l));
          return {
            folder,
            slug: file.replace(/\.md$/, ''),
            title: clean(q) || file.replace(/\.md$/, ''),
            summary: clean(a).slice(0, 120),
            targets: extractTargets(lines.join('\n')),
          };
        })
    );
  };

  // 본문의 링크([[docker]], [CORS](./cors.md))를 실제 질문으로 풀어서 links에 담는다 → 백링크 계산용
  const withLinks = (entries) =>
    entries.map(({ targets, ...e }) => {
      const keys = targets
        .map((t) => resolveLink(t, e.folder, entries))
        .filter(Boolean)
        .map(linkKey)
        .filter((k) => k !== linkKey(e));
      return { ...e, links: [...new Set(keys)] };
    });

  // 등록일(added): src/data/added.json에 없으면 git 기록 → 그래도 없으면 지금 시각.
  // 개발 서버에서는 새 md의 등록일을 added.json에 저장해서 커밋에 같이 들어가게 한다.
  let isDev = false;
  const withAdded = (entries) => {
    const dates = addedDates(entries.map(linkKey), { write: isDev });
    return entries.map((e) => ({ ...e, added: dates[linkKey(e)] }));
  };

  return {
    name: 'questions-index',
    configResolved(config) {
      isDev = config.command === 'serve' && config.mode !== 'test';
    },
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(withAdded(withLinks(read())))};`;
    },
    // md 파일을 추가·수정하면 목록도 새로고침
    configureServer(server) {
      const reload = (file) => {
        if (!/-questions[\\/].+\.md$/.test(file)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
      server.watcher.on('change', reload);
    },
  };
}

export default defineConfig({
  plugins: [
    react({
      // React Compiler 심화 데모용: "use memo"를 적은 함수만 컴파일한다 (나머지 코드는 그대로)
      babel: { plugins: [['babel-plugin-react-compiler', { compilationMode: 'annotation' }]] },
    }),
    tailwindcss(),
    questionsIndex(),
  ],
  test: { environment: 'jsdom' },
});
