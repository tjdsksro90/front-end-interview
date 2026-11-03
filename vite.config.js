import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const VIRTUAL_ID = 'virtual:questions';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const clean = (line = '') => line.replace(/^#+\s*[QA]\s*:\s*/, '').replace(/<[^>]+>/g, '').trim();

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
          };
        })
    );
  };

  return {
    name: 'questions-index',
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(read())};`;
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
  plugins: [react(), tailwindcss(), questionsIndex()],
});
