import { Section, H3, List, Code, OneLiner, WhenToUse, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen, FolderTree } from '../components/screens.jsx';

export default function Monorepo() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Monorepo는 <u>여러 앱과 공유 패키지를 하나의 저장소</u>에서 관리하는 방식입니다.
          pnpm workspace가 패키지끼리 서로 import할 수 있게 연결해주고, Turborepo가 빌드·테스트를 의존 순서대로, 바뀐 것만, 캐시로 빠르게 돌려줍니다.
        </OneLiner>

        <Table
          head={['', 'Polyrepo (저장소 여러 개)', 'Monorepo']}
          rows={[
            ['공통 UI·유틸 공유', 'npm에 배포 → 각 저장소에서 버전 올리기', '같은 저장소의 패키지를 바로 import'],
            ['여러 곳에 걸친 수정', 'PR 여러 개, 배포 순서 맞추기', 'PR 하나로 원자적으로'],
            ['설정 (ESLint, TS, Prettier)', '저장소마다 복붙, 점점 달라짐', '공용 config 패키지 하나'],
            ['단점', '-', '저장소가 커짐 → 빌드 도구(캐시, 영향 범위 계산)가 필수, 권한 분리가 어려움'],
          ]}
        />

        <H3>역할 나누기</H3>
        <List
          items={[
            <><b>pnpm workspace</b> (패키지 매니저): <Code>pnpm-workspace.yaml</Code>에 폴더를 등록하면 <Code>"@repo/ui": "workspace:*"</Code>로 내부 패키지를 의존성에 넣을 수 있다. 실제 파일을 링크해서 수정이 바로 반영된다. (npm/yarn workspaces도 같은 개념, pnpm은 디스크를 덜 쓰고 빠름)</>,
            <><b>Turborepo</b> (작업 실행기): <Code>turbo build</Code> 하나로 모든 패키지를 의존 순서대로 병렬 빌드. 입력 파일이 안 바뀐 패키지는 <b>캐시에서 결과를 그대로 꺼냄</b>. 원격 캐시를 켜면 CI와 팀원끼리 캐시 공유.</>,
            <>비슷한 도구: Nx(기능 많음, 코드 생성기), Lerna(구형, 지금은 Nx가 관리).</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>앱이 여러 개인데 같은 디자인 시스템·API 클라이언트를 공유</b>할 때: 사용자 웹, 관리자 웹, 랜딩 페이지</>,
            '프론트와 백엔드(Node)가 타입을 공유해야 할 때',
            '공용 설정(ESLint, tsconfig, Tailwind preset)을 여러 프로젝트에 같게 유지하고 싶을 때',
          ]}
          avoid={[
            '앱 하나뿐인 프로젝트 — 구조만 복잡해진다',
            '팀·배포 주기·권한이 완전히 분리된 서비스들 — 오히려 각자 저장소가 편하다',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <div className="grid gap-4 lg:grid-cols-2">
          <FolderTree
            title="Turborepo 기본 구조 (npx create-turbo)"
            lines={[
              'my-monorepo/',
              '  apps/',
              '    web/        # 사용자 사이트 (Next.js)',
              '    admin/      # 관리자 (Vite)',
              '  packages/',
              '    ui/         # @repo/ui 공용 컴포넌트',
              '    api-client/ # @repo/api-client',
              '    eslint-config/',
              '    typescript-config/',
              '  pnpm-workspace.yaml',
              '  turbo.json',
              '  package.json',
            ]}
          />
          <Screen title="Terminal — turbo build (두 번째 실행)" dark>
            <pre className="p-4 font-mono leading-relaxed">{`$ turbo build
• Packages in scope: @repo/ui, @repo/api-client, web, admin
• Running build in 4 packages

@repo/ui:build: cache hit, replaying logs 8f2c1a
@repo/api-client:build: cache hit, replaying logs 3b9e0d
web:build: cache miss, executing 51ab77
admin:build: cache hit, replaying logs c04f12

 Tasks:    4 successful, 4 total
Cached:    3 cached, 4 total
  Time:    6.2s`}</pre>
          </Screen>
        </div>
        <WhereToCheck
          items={[
            { where: '어떤 패키지가 캐시됐는지', path: ['터미널', 'turbo build', '각 줄의 cache hit / cache miss'], what: '바뀐 패키지(web)만 다시 빌드하고 나머지는 캐시에서 꺼낸다. 전부 hit면 ">>> FULL TURBO".' },
            { where: '작업 의존 그래프', path: ['터미널', 'turbo build --graph'], what: '어떤 패키지를 먼저 빌드해야 하는지 그래프로 출력.' },
            { where: '워크스페이스 패키지 목록', path: ['터미널', 'pnpm ls -r --depth -1'], what: '등록된 모든 패키지와 버전.' },
          ]}
        />
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="pnpm-workspace.yaml"
          code={`
packages:
  - 'apps/*'
  - 'packages/*'`}
        />
        <CodeBlock
          title="apps/web/package.json — 내부 패키지 사용"
          code={`
{
  "name": "web",
  "dependencies": {
    "@repo/ui": "workspace:*",          // 같은 저장소의 packages/ui
    "@repo/api-client": "workspace:*"
  }
}

// apps/web/app/page.tsx
import { Button } from '@repo/ui';`}
        />
        <CodeBlock
          title="turbo.json"
          code={`
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],        // 내가 의존하는 패키지를 먼저 빌드
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]   // 캐시할 결과물
    },
    "lint": {},
    "dev": { "cache": false, "persistent": true }
  }
}

// 실행
// pnpm turbo build                 전체
// pnpm turbo build --filter=web    web과 그 의존성만`}
        />
      </Section>
    </>
  );
}
