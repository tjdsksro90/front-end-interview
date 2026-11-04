import { useState } from 'react';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, Demo, Segmented, Legend, ui } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function DockerPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Docker는 <u>앱과 실행 환경(OS 라이브러리, Node 버전, 설정)을 이미지 하나로 묶어서 어디서든 똑같이 실행</u>하게 해주는 도구입니다.
          프론트엔드는 주로 <u>빌드 결과물을 Nginx 이미지에 담아 배포</u>하거나, <u>백엔드·DB를 로컬에 한 번에 띄워</u> 개발 환경을 맞출 때 씁니다.
        </OneLiner>

        <H3>Dockerfile → 이미지 → 컨테이너</H3>
        <BuildRunFlow />

        <Table
          head={['용어', '뜻']}
          rows={[
            ['Dockerfile', '이미지를 만드는 순서. 한 줄(명령)마다 레이어가 하나씩 쌓인다'],
            ['이미지', '실행 환경 + 앱을 묶은 읽기 전용 파일. 태그로 버전을 붙인다 (front-study:1.2.0)'],
            ['컨테이너', '이미지를 실행한 프로세스. 지우면 안에서 바뀐 내용도 사라진다'],
            ['레지스트리', '이미지 저장소. Docker Hub, AWS ECR, GitHub GHCR'],
            ['볼륨', '컨테이너를 지워도 남는 저장 공간. DB 데이터, 개발 중 소스 연결'],
            [<>포트 연결 <Code>-p 8080:80</Code></>, '내 PC의 8080 포트로 들어온 요청을 컨테이너의 80 포트로 보낸다'],
            ['docker compose', '여러 컨테이너(프론트·API·DB)를 YAML 파일 하나로 같이 실행'],
          ]}
        />

        <H3>가상 머신과의 차이</H3>
        <VmVsContainer />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>직접 서버에 배포</b>: EC2, ECS, Kubernetes, 사내 서버에 프론트를 올릴 때 Nginx 이미지로 만든다</>,
            <><b>Next.js SSR 배포</b>: Node 서버가 필요하므로 standalone 빌드를 이미지로 만든다</>,
            <><b>로컬 개발 환경</b>: 백엔드 API·DB·Redis를 <Code>docker compose up</Code>으로 띄우고 프론트만 개발</>,
            <><b>CI와 로컬 환경 맞추기</b>: Playwright 공식 이미지로 E2E 테스트 브라우저 버전을 고정</>,
          ]}
          avoid={[
            'Vercel·Netlify에 정적 사이트 배포 — 플랫폼이 빌드·배포를 대신 해서 Docker가 필요 없다',
            <><Code>npm run dev</Code>로 하는 일상적인 프론트 개발까지 컨테이너 안에서 — 파일 감시·HMR이 느려지기 쉽다</>,
            '비밀 값(API 키)을 Dockerfile이나 이미지에 넣기 — 이미지를 받은 사람은 누구나 꺼내 볼 수 있다',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"멀티 스테이지로 빌드 단계와 실행 단계를 나눠서 최종 이미지에는 dist와 Nginx만 남겼고, package.json을 먼저 복사해 의존성 설치 레이어를 캐시했다. SPA라서 Nginx에 try_files로 index.html 폴백을 설정했다"처럼 이유와 함께 말하면 좋아요.</p>
          <p>자주 나오는 함정: <b>VITE_·NEXT_PUBLIC_ 환경 변수는 빌드할 때 JS에 박히므로</b> <Code>docker run -e</Code>로는 바뀌지 않는다.</p>
        </Callout>
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: 'Docker Desktop', path: ['Containers'], what: '실행 중인 컨테이너, 포트, CPU·메모리. 이름을 누르면 Logs·Exec(안으로 들어가기)·Files 탭' },
            { where: 'Docker Desktop', path: ['Images'], what: '이미지 목록과 크기. 이미지를 누르면 레이어별 크기와 명령어가 나온다' },
            { where: '터미널', path: ['docker ps', 'docker logs -f <이름>'], what: '실행 상태와 로그. 컨테이너가 바로 꺼지면 docker ps -a로 Exited 상태와 종료 코드를 본다' },
            { where: '터미널', path: ['docker exec -it <이름> sh'], what: '컨테이너 안에서 ls /usr/share/nginx/html로 빌드 파일이 제대로 들어갔는지 확인' },
            { where: '터미널', path: ['docker history <이미지>'], what: '어느 레이어가 용량을 많이 차지하는지 확인' },
          ]}
        />

        <H3>터미널에서 보게 되는 화면</H3>
        <TerminalScreen />

        <H3>직접 해보기 ① 레이어 캐시</H3>
        <p>
          Docker는 Dockerfile의 명령을 위에서부터 실행하고, 결과를 <b>레이어</b>로 저장합니다. 다시 빌드할 때 명령과 복사한 파일이 같으면 <b>CACHED</b>로 건너뛰고,
          한 레이어가 바뀌면 <b>그 아래 레이어는 전부 다시 실행</b>합니다. 그래서 <Code>COPY</Code> 순서가 빌드 시간을 좌우해요.
        </p>
        <LayerCacheDemo />

        <H3>직접 해보기 ② 멀티 스테이지와 이미지 크기</H3>
        <ImageSizeDemo />
      </Section>

      <Section step={3} title="코드">
        <p>
          이 사이트 저장소에 실제로 들어 있는 파일이에요(<Code>Dockerfile</Code>, <Code>nginx.conf</Code>, <Code>.dockerignore</Code>).
          실제 배포는 Vercel로 하지만, 아래 두 줄이면 같은 사이트를 Docker로 띄울 수 있어요.
        </p>
        <CodeBlock
          title="터미널"
          code={`
docker build -t front-study .
docker run --rm -p 8080:80 front-study    # http://localhost:8080`}
        />
        <CodeBlock
          title="Dockerfile — Vite(React) 정적 사이트, 멀티 스테이지"
          code={`
# 1단계: 빌드 — Node와 node_modules는 여기서만 쓰고 최종 이미지에는 넣지 않는다
FROM node:22-alpine AS build
WORKDIR /app
# 의존성 파일만 먼저 복사: package*.json이 그대로면 npm ci 레이어를 캐시로 재사용한다
COPY package.json package-lock.json ./
RUN npm ci
# 소스는 나중에 복사: md나 코드만 바뀌면 여기부터 다시 실행된다
COPY . .
RUN npm run build

# 2단계: 실행 — 빌드된 정적 파일(dist)과 Nginx만 남긴다
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80`}
        />
        <CodeBlock
          title="nginx.conf — SPA 새로고침 404 방지 + 빌드 파일 캐시"
          code={`
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # 해시가 붙은 빌드 파일은 내용이 바뀌면 이름도 바뀌므로 오래 캐시한다
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # /react/hooks 같은 주소로 바로 들어와도 index.html을 주고, 라우팅은 React Router가 한다
  location / {
    try_files $uri $uri/ /index.html;
  }
}`}
        />
        <CodeBlock
          title=".dockerignore — 빌드할 때 Docker로 보내지 않을 파일"
          code={`
node_modules    # 컨테이너 안에서 npm ci로 새로 설치 (OS가 달라 그대로 쓰면 안 되는 패키지도 있다)
dist
.git
.env*           # 비밀 값이 이미지에 들어가지 않게`}
        />

        <H3>환경 변수: 빌드 시점 vs 실행 시점</H3>
        <EnvTimingDemo />
        <CodeBlock
          title="방법 1. 환경마다 따로 빌드 (--build-arg)"
          code={`
# Dockerfile (build 단계에 추가)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# 빌드할 때 값 지정
docker build --build-arg VITE_API_URL=https://api.example.com -t front:prod .`}
        />
        <CodeBlock
          title="방법 2. 이미지 하나로 실행할 때 주입 (config.js)"
          code={`
<!-- index.html: 앱보다 먼저 불러온다 -->
<script src="/config.js"></script>

// 앱 코드
const API_URL = window.__ENV__?.API_URL ?? import.meta.env.VITE_API_URL;

# docker-entrypoint.d/env.sh — nginx 이미지는 시작할 때 이 폴더의 스크립트를 실행한다
echo "window.__ENV__ = { API_URL: '$API_URL' };" > /usr/share/nginx/html/config.js

# 실행할 때 값 지정 → 같은 이미지를 개발·운영에 그대로 쓴다
docker run -e API_URL=https://api.example.com -p 8080:80 front`}
        />

        <H3>로컬 개발: 백엔드와 DB만 컨테이너로</H3>
        <CodeBlock
          title="compose.yaml"
          code={`
services:
  api:
    image: ghcr.io/my-team/shop-api:dev   # 백엔드 팀이 올린 이미지
    ports: ['8080:8080']
    environment:
      DB_URL: postgres://app:app@db:5432/shop   # 같은 compose 안에서는 서비스 이름(db)이 주소
    depends_on: [db]
  db:
    image: postgres:17
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: shop }
    volumes: ['db-data:/var/lib/postgresql/data']   # 컨테이너를 지워도 데이터 유지
volumes:
  db-data:`}
        />
        <CodeBlock
          title="터미널"
          code={`
docker compose up -d     # api + db 실행
npm run dev              # 프론트는 평소처럼 (VITE_API_URL=http://localhost:8080)
docker compose down      # 정리 (볼륨까지 지우려면 -v)`}
        />

        <H3>Next.js (SSR)는 Node 서버 이미지</H3>
        <CodeBlock
          title="Dockerfile — Next.js standalone"
          code={`
# next.config.js 에 output: 'standalone' 설정 필요
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# standalone 폴더에 실행에 필요한 파일과 node_modules 일부만 모여 있다
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]`}
        />

        <H3>CI에서 이미지 만들어 올리기</H3>
        <CodeBlock
          title=".github/workflows/docker.yml"
          code={`
name: docker
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:\${{ github.sha }}
# 서버는 이 태그의 이미지를 받아서(docker pull) 실행만 한다`}
        />
      </Section>
    </>
  );
}

/* ---------------------------------- 시각화 ---------------------------------- */

function BuildRunFlow() {
  const steps = [
    { name: 'Dockerfile', sub: '만드는 순서', cmd: null },
    { name: '이미지', sub: '읽기 전용 묶음', cmd: 'docker build' },
    { name: '레지스트리', sub: 'Docker Hub · ECR · GHCR', cmd: 'docker push' },
    { name: '컨테이너', sub: '실행 중인 프로세스', cmd: 'docker run' },
  ];
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      {steps.map((s, i) => (
        <div key={s.name} className="flex flex-col items-center gap-2 sm:flex-1 sm:flex-row">
          {i > 0 && (
            <div className="flex flex-none flex-col items-center text-xs text-zinc-400">
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{s.cmd}</span>
              <span className="sm:hidden">↓</span>
              <span className="hidden sm:inline">→</span>
            </div>
          )}
          <div className={`${ui.box} w-full text-center sm:flex-1`}>
            <div className="font-semibold">{s.name}</div>
            <div className={`text-xs ${ui.muted}`}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VmVsContainer() {
  const Stack = ({ title, layers, note }) => (
    <div className={ui.box}>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="space-y-1 text-center text-xs">
        {layers.map(([label, cls], i) => (
          <div key={i} className={`rounded-md px-2 py-1.5 ${cls}`}>{label}</div>
        ))}
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>{note}</p>
    </div>
  );
  const app = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200';
  const os = 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200';
  const base = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  const engine = 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200';
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Stack
        title="가상 머신"
        layers={[
          ['앱 A · 앱 B', app],
          ['게스트 OS (커널 포함) × 2', os],
          ['하이퍼바이저', engine],
          ['호스트 OS · 하드웨어', base],
        ]}
        note="OS를 통째로 하나씩 띄운다. 수 GB, 켜는 데 수십 초."
      />
      <Stack
        title="컨테이너"
        layers={[
          ['앱 A · 앱 B', app],
          ['필요한 라이브러리만 (alpine 등)', os],
          ['Docker 엔진', engine],
          ['호스트 OS 커널 · 하드웨어', base],
        ]}
        note="호스트 커널을 같이 쓰고 프로세스만 격리한다. 수십 MB, 1초 안팎."
      />
    </div>
  );
}

function TerminalScreen() {
  return (
    <Screen title="Terminal" dark caption="docker build / run / ps 를 실행했을 때 나오는 출력을 줄여서 재현했어요">
      <pre className="p-4 font-mono leading-relaxed whitespace-pre">
        <span className="text-emerald-400">$</span> docker build -t front-study .{'\n'}
        <span className="text-zinc-400">{` => [build 2/6] WORKDIR /app                          CACHED
 => [build 3/6] COPY package.json package-lock.json   CACHED
 => [build 4/6] RUN npm ci                            CACHED
 => [build 5/6] COPY . .                              0.4s
 => [build 6/6] RUN npm run build                     7.9s
 => [stage-1 3/3] COPY --from=build /app/dist ...     0.1s
 => naming to docker.io/library/front-study:latest`}</span>
        {'\n\n'}
        <span className="text-emerald-400">$</span> docker run -d -p 8080:80 --name front front-study{'\n'}
        <span className="text-zinc-400">3f2a9c1b7e4d...</span>
        {'\n\n'}
        <span className="text-emerald-400">$</span> docker ps{'\n'}
        <span className="text-sky-300">{`CONTAINER ID   IMAGE         STATUS         PORTS                  NAMES`}</span>
        {'\n'}
        {`3f2a9c1b7e4d   front-study   Up 5 seconds   0.0.0.0:8080->80/tcp   front`}
      </pre>
    </Screen>
  );
}

const SECONDS = { npmci: 38, build: 8, copySrc: 0.4, copyPkg: 0.1, nginx: 0.2 };

function layersFor(order) {
  // trigger: 이 레이어를 무효로 만드는 변경
  const head = [
    { id: 'from', text: 'FROM node:22-alpine AS build', sec: 0, trigger: [] },
    { id: 'wd', text: 'WORKDIR /app', sec: 0, trigger: [] },
  ];
  const body =
    order === 'good'
      ? [
          { id: 'cpPkg', text: 'COPY package.json package-lock.json ./', sec: SECONDS.copyPkg, trigger: ['pkg'] },
          { id: 'ci', text: 'RUN npm ci', sec: SECONDS.npmci, trigger: [] },
          { id: 'cpAll', text: 'COPY . .', sec: SECONDS.copySrc, trigger: ['src', 'pkg'] },
          { id: 'build', text: 'RUN npm run build', sec: SECONDS.build, trigger: [] },
        ]
      : [
          { id: 'cpAll', text: 'COPY . .', sec: SECONDS.copySrc, trigger: ['src', 'pkg'] },
          { id: 'ci', text: 'RUN npm ci', sec: SECONDS.npmci, trigger: [] },
          { id: 'build', text: 'RUN npm run build', sec: SECONDS.build, trigger: [] },
        ];
  return [...head, ...body];
}

function LayerCacheDemo() {
  const [order, setOrder] = useState('good');
  const [change, setChange] = useState('src');

  // 한 번 무효가 되면 그 아래(같은 스테이지)는 전부 다시 실행
  let broken = change === 'first';
  const rows = layersFor(order).map((l) => {
    if (!broken && l.trigger.includes(change)) broken = true;
    return { ...l, rebuilt: broken && l.id !== 'from' };
  });
  const buildRebuilt = rows.find((r) => r.id === 'build').rebuilt;
  const stage2 = [
    { id: 'n1', text: 'FROM nginx:1.27-alpine', sec: 0, rebuilt: change === 'first' },
    { id: 'n2', text: 'COPY nginx.conf /etc/nginx/conf.d/default.conf', sec: SECONDS.nginx, rebuilt: change === 'first' },
    { id: 'n3', text: 'COPY --from=build /app/dist /usr/share/nginx/html', sec: SECONDS.nginx, rebuilt: change === 'first' || buildRebuilt },
  ];
  const all = [...rows, ...stage2];
  const total = all.filter((r) => r.rebuilt).reduce((s, r) => s + r.sec, 0);

  return (
    <Demo hint="Dockerfile 순서와 바뀐 파일을 골라 보세요. 다시 실행되는 레이어와 걸리는 시간(예시)이 바뀝니다.">
      <div className="flex flex-wrap gap-3">
        <Segmented
          value={order}
          onChange={setOrder}
          options={[
            { value: 'good', label: 'package.json 먼저 복사' },
            { value: 'bad', label: 'COPY . . 먼저 (흔한 실수)' },
          ]}
        />
        <Segmented
          value={change}
          onChange={setChange}
          options={[
            { value: 'first', label: '처음 빌드' },
            { value: 'src', label: '코드·md 수정' },
            { value: 'pkg', label: '패키지 추가' },
            { value: 'none', label: '변경 없음' },
          ]}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-[#1e1f24] p-3 font-mono text-[12.5px] text-zinc-200">
        {all.map((r, i) => (
          <div key={r.id}>
            {r.id === 'n1' && <div className="my-1.5 border-t border-dashed border-zinc-700" />}
            <div className="flex items-center gap-3 rounded px-2 py-1">
              <span className="w-5 flex-none text-right text-zinc-500">{i + 1}</span>
              <span className="flex-1 whitespace-pre">{r.text}</span>
              <span
                className={`flex-none rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                  r.rebuilt ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                }`}
              >
                {r.rebuilt ? (r.sec ? `실행 ${r.sec}s` : '실행') : 'CACHED'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Legend items={[['bg-emerald-500/40', 'CACHED: 이전 결과 재사용'], ['bg-amber-500/50', '다시 실행']]} />

      <p className="mt-3 text-sm">
        다시 실행한 시간 합계 약 <b className={total > 30 ? ui.bad : ui.good}>{total.toFixed(1)}초</b>
        {order === 'bad' && change === 'src' && (
          <span className={ui.bad}> — 코드 한 줄만 고쳐도 <Code>COPY . .</Code>가 바뀌어서 그 아래 <Code>npm ci</Code>까지 매번 다시 설치해요.</span>
        )}
        {order === 'good' && change === 'src' && (
          <span className={ui.good}> — 의존성 레이어는 그대로라서 <Code>npm ci</Code>를 건너뛰고 빌드만 다시 해요.</span>
        )}
        {change === 'pkg' && <span className={ui.muted}> — 패키지가 바뀌면 어느 순서든 설치부터 다시 해야 해요.</span>}
      </p>
    </Demo>
  );
}

const SIZES = [
  { id: 'node', label: 'node:22 한 단계 (node_modules 포함, vite preview로 실행)', mb: 1150 },
  { id: 'alpine', label: 'node:22-alpine 한 단계', mb: 420 },
  { id: 'multi', label: '멀티 스테이지 → nginx:alpine + dist', mb: 52 },
];

function ImageSizeDemo() {
  const [pick, setPick] = useState('multi');
  const max = SIZES[0].mb;
  return (
    <Demo hint="최종 이미지에 무엇이 남는지에 따라 크기가 크게 달라집니다. (대략적인 크기 예시)">
      <div className="space-y-2.5">
        {SIZES.map((s) => (
          <button key={s.id} onClick={() => setPick(s.id)} className="block w-full text-left">
            <div className={`mb-1 text-sm ${pick === s.id ? 'font-semibold' : ui.muted}`}>{s.label}</div>
            <div className="flex items-center gap-2">
              <div className="h-5 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-5 rounded transition-all ${pick === s.id ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                  style={{ width: `${Math.max(2, (s.mb / max) * 100)}%` }}
                />
              </div>
              <span className="w-20 flex-none text-right text-sm tabular-nums">약 {s.mb >= 1000 ? `${(s.mb / 1000).toFixed(1)} GB` : `${s.mb} MB`}</span>
            </div>
          </button>
        ))}
      </div>
      <div className={`${ui.box} mt-4 text-sm`}>
        {pick === 'node' && 'Debian 기반 Node 이미지 + 개발용 의존성까지 전부 들어간다. 배포·다운로드가 느리고, 쓰지 않는 패키지만큼 보안 취약점 검사 대상도 늘어난다.'}
        {pick === 'alpine' && 'OS를 작은 alpine으로 바꿔 줄었지만, 여전히 Node와 node_modules가 들어 있다. 정적 사이트를 띄우는 데는 필요 없는 것들이다.'}
        {pick === 'multi' && (
          <>
            빌드 단계(Node, node_modules, 소스)는 버리고, <Code>COPY --from=build</Code>로 <b>dist 폴더만</b> Nginx 이미지에 옮긴다.
            정적 사이트라면 이 방식이 기본이다.
          </>
        )}
      </div>
    </Demo>
  );
}

function EnvTimingDemo() {
  const [mode, setMode] = useState('build');
  return (
    <Demo>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'build', label: 'docker run -e VITE_API_URL=...' },
          { value: 'arg', label: '--build-arg로 빌드' },
          { value: 'runtime', label: 'config.js로 주입' },
        ]}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className={ui.box}>
          <div className={`mb-1 text-xs ${ui.muted}`}>빌드된 JS (dist/assets/index-a1b2.js)</div>
          <pre className="overflow-x-auto font-mono text-xs whitespace-pre">
            {mode === 'runtime'
              ? 'fetch(`${window.__ENV__.API_URL}/users`)'
              : mode === 'arg'
                ? 'fetch(`https://api.example.com/users`)'
                : 'fetch(`http://localhost:8080/users`)  // 빌드할 때 값'}
          </pre>
        </div>
        <div className={ui.box}>
          <div className={`mb-1 text-xs ${ui.muted}`}>결과</div>
          <p className={`text-sm ${mode === 'build' ? ui.bad : ui.good}`}>
            {mode === 'build' && '바뀌지 않는다. 이미 JS 파일 안에 글자로 박혀 있어서, 컨테이너 환경 변수는 브라우저 코드에 전달되지 않는다.'}
            {mode === 'arg' && '바뀐다. 대신 개발·운영 이미지를 따로 만들어야 한다.'}
            {mode === 'runtime' && '바뀐다. 컨테이너가 시작할 때 config.js를 만들고, 브라우저가 그 값을 읽는다. 이미지 하나를 모든 환경에 쓸 수 있다.'}
          </p>
        </div>
      </div>
      <List
        items={[
          <>Vite의 <Code>import.meta.env.VITE_*</Code>, Next.js의 <Code>NEXT_PUBLIC_*</Code> 모두 빌드 시점에 치환된다.</>,
          'Next.js 서버 코드(서버 컴포넌트, API Route)에서 읽는 process.env는 실행 시점 값이라 docker run -e로 바뀐다.',
        ]}
      />
    </Demo>
  );
}
