import { Section, H3, List, Code, OneLiner, WhenToUse, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function CiAutomation() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          코드 품질 검사를 사람이 기억해서 하지 않고 자동으로 돌리는 장치입니다.
          <u>Husky + lint-staged는 커밋하기 직전 내 컴퓨터에서, GitHub Actions는 push·PR 때 서버에서</u> 린트·타입 검사·테스트·빌드를 실행하고, 통과하면 Vercel 같은 곳으로 배포까지 이어집니다.
        </OneLiner>

        <Table
          head={['도구', '언제', '하는 일']}
          rows={[
            ['Husky', 'git commit / push 직전', <>Git hook(<Code>pre-commit</Code>, <Code>commit-msg</Code>)을 팀 전체가 같이 쓰게 저장소에 등록</>],
            ['lint-staged', 'pre-commit 안에서', <><b>이번에 커밋할(staged) 파일만</b> ESLint·Prettier 실행 → 전체 검사보다 훨씬 빠름</>],
            ['commitlint', 'commit-msg', '커밋 메시지 규칙 검사 (feat:, fix: …)'],
            ['GitHub Actions', 'push, PR, 스케줄', '깨끗한 서버에서 install → lint → type check → test → build. 실패하면 PR에 빨간 X'],
            ['Vercel', 'push 시 자동', 'PR마다 미리보기 URL, main 병합 시 프로덕션 배포 (이 사이트가 이렇게 배포됨)'],
          ]}
        />
        <List
          items={[
            <><b>왜 둘 다?</b> 로컬 훅은 <Code>--no-verify</Code>로 건너뛸 수 있고 사람마다 환경이 다르다. CI는 우회할 수 없는 최종 관문이다. 로컬은 빠른 피드백, CI는 보증.</>,
            <><b>Branch protection</b>: GitHub 설정에서 "CI 통과 + 리뷰 1명 승인" 없이는 main에 병합 못 하게 막는다.</>,
            <>Jenkins는 직접 서버를 운영하는 CI 도구(사내망, 복잡한 파이프라인), GitHub Actions는 GitHub에 내장된 관리형 CI.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>2명 이상이 같은 저장소에서 작업</b>할 때 — 코드 스타일 논쟁과 "제 컴퓨터에선 되는데요"를 없앤다</>,
            '테스트가 있는 프로젝트: PR마다 자동 실행',
            '배포 전 빌드 실패를 미리 잡고 싶을 때 (타입 에러가 프로덕션에 가는 것 방지)',
          ]}
          avoid={[
            'pre-commit에서 전체 테스트·빌드 — 커밋이 너무 느려져 다들 --no-verify를 쓰게 된다. 무거운 건 CI로',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: 'CI 실행 결과', path: ['GitHub 저장소', 'Actions 탭', '실행(run) 클릭', 'job 클릭'], what: '단계별 로그. 실패한 단계가 빨갛게 펼쳐진다.' },
            { where: 'PR에서', path: ['Pull request', '아래 Checks 영역'], what: '각 검사의 통과/실패, Vercel 미리보기 URL 댓글.' },
            { where: '병합 규칙', path: ['Settings', 'Branches(Rules)', 'main', 'Require status checks to pass'], what: 'CI 통과와 리뷰 승인을 병합 조건으로 강제.' },
            { where: '로컬 훅 동작', path: ['터미널', 'git commit'], what: '커밋할 때 lint-staged 진행 상황이 출력되고, 에러가 있으면 커밋이 취소된다.' },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Screen title="Terminal — git commit" dark>
            <pre className="p-4 font-mono leading-relaxed">{`$ git commit -m "feat: 장바구니 수량 변경"
✔ Preparing lint-staged...
❯ Running tasks for staged files...
  ❯ *.{ts,tsx} — 2 files
    ✖ eslint --fix
      src/cart/Cart.tsx
        12:7  error  'total' is assigned a value
                     but never used  no-unused-vars
husky - pre-commit script failed (code 1)`}</pre>
          </Screen>
          <Screen title="GitHub — Pull request Checks">
            <div className="space-y-2 p-4">
              {[['CI / lint', '23s', true], ['CI / typecheck', '41s', true], ['CI / test', '1m 12s', false], ['Vercel – Preview', 'Ready', true]].map(([n, t, ok]) => (
                <div key={n} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
                  <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />{n}</span>
                  <span className="text-zinc-400">{ok ? t : 'Failing after 1m 12s'}</span>
                </div>
              ))}
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">Merging is blocked — required status check "CI / test" failed</div>
            </div>
          </Screen>
        </div>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="설치"
          code={`
npm i -D husky lint-staged
npx husky init               # .husky/pre-commit 생성 + package.json에 "prepare": "husky"`}
        />
        <CodeBlock
          title="package.json + .husky/pre-commit"
          code={`
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{css,md,json}": "prettier --write"
  }
}

# .husky/pre-commit
npx lint-staged`}
        />
        <CodeBlock
          title=".github/workflows/ci.yml"
          code={`
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --run
      - run: npm run build`}
        />
      </Section>
    </>
  );
}
