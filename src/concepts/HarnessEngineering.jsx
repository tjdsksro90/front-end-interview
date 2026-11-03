import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen, FolderTree } from '../components/screens.jsx';

export default function HarnessEngineering() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          하네스(Harness)는 <u>에이전트에서 모델을 뺀 나머지 전부</u>입니다. 지시문, 도구와 권한, 컨텍스트 관리, 메모리, 검증, 피드백 루프를 가리켜요.
          LangChain 문서의 표현대로 "Agent = Model + Harness"이고, 하네스 엔지니어링은 이 주변 장치를 설계해서 같은 모델로도 에이전트가 <b>믿을 만하게</b> 일하게 만드는 일입니다.
        </OneLiner>

        <H3>하네스를 이루는 것</H3>
        <Table
          head={['구성', '하는 일', '예']}
          rows={[
            ['지시문 · 규칙 파일', '프로젝트 규칙과 작업 방식을 매 세션 알려줌', <><Code>CLAUDE.md</Code>, <Code>AGENTS.md</Code>, 시스템 프롬프트</>],
            ['도구 (Tools)', '에이전트가 세상에 영향을 주는 손발. 설명·입력 형식이 곧 인터페이스', '파일 읽기/쓰기, 터미널, 브라우저, MCP 서버'],
            ['권한 · 가드레일', '무엇을 허락 없이 해도 되는지, 무엇은 승인받아야 하는지', '읽기는 자동, 배포·삭제·결제는 사람 승인, 샌드박스'],
            ['컨텍스트 관리', '긴 작업에서 무엇을 기억하고 무엇을 요약·버릴지', '압축(compaction), 진행 기록 파일, 하위 에이전트로 분리'],
            ['검증 · 피드백', '에이전트가 "됐다"고 말하는 대신 스스로 확인하게', '테스트, 타입 검사, 린터 메시지, 브라우저로 실제 확인'],
            ['관찰 · 평가', '무엇을 했는지 추적하고, 바꾼 게 나아졌는지 측정', 'trace(LangSmith 등), 평가 세트(eval)'],
          ]}
        />

        <H3>프롬프트 · 컨텍스트 · 하네스 엔지니어링</H3>
        <Table
          head={['', '다루는 범위', '질문']}
          rows={[
            ['프롬프트 엔지니어링', '한 번의 요청 문구', '"어떻게 말해야 잘 답할까?"'],
            ['컨텍스트 엔지니어링', '매 순간 모델에 들어가는 정보 전체', '"지금 무엇을 보여줘야 할까?"'],
            ['하네스 엔지니어링', '모든 턴에 걸친 시스템: 도구·권한·검증·루프', '"무엇을 막고, 측정하고, 스스로 고치게 할까?"'],
          ]}
        />

        <H3>공식 글에서 나온 실천법</H3>
        <List
          items={[
            <><b>Anthropic 「Effective harnesses for long-running agents」</b>: 세션이 바뀌면 에이전트는 이전 기억이 없다. 그래서 첫 세션(initializer)이 기능 목록(JSON, 처음엔 전부 실패 상태), 진행 기록 파일, 실행 스크립트를 만들고, 이후 세션은 그것들과 git 기록을 읽고 <b>한 번에 기능 하나</b>만 끝낸 뒤 깔끔한 상태로 커밋한다. 단위 테스트만으로 "완료"라고 하지 않게 <b>사용자처럼 브라우저로 끝까지 테스트</b>하라고 시키니 품질이 크게 올랐다.</>,
            <><b>Anthropic 「Building effective agents」</b>: 단순하게 시작하고, 에이전트의 계획을 투명하게 드러내고, 도구 설명·테스트(agent-computer interface)에 공을 들여라.</>,
            <><b>OpenAI 「Harness engineering」(2026.2, 보도 요약)</b>: 사람이 코드를 직접 쓰지 않고 에이전트가 만든 제품 사례. 엔지니어의 일은 환경을 설계하고 의도를 명확히 하고 피드백 루프를 만드는 것. AGENTS.md는 백과사전이 아니라 문서로 가는 지도로 짧게, 아키텍처 규칙은 린터·구조 테스트로 기계적으로 강제하고, 린터 에러 메시지에 고치는 방법을 넣어 에이전트가 읽고 스스로 고치게 한다.</>,
            <><b>개선 루프</b>: 실제 작업을 시킨다 → 실패한 곳을 관찰한다 → 모델 탓이 아니라 하네스(지시·도구·검증) 문제로 분류한다 → 하네스를 고친다 → 반복.</>,
          ]}
        />
        <Callout type="warn" title="참고">
          <p>"하네스 엔지니어링"은 2025~2026년에 퍼진 새 용어라 회사·글마다 범위가 조금씩 다릅니다. 면접에서는 "모델이 아니라 모델을 둘러싼 시스템(도구, 컨텍스트, 권한, 검증, 피드백)을 설계해 에이전트의 신뢰성을 높이는 것"으로 설명하면 무난합니다.</p>
        </Callout>

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>코딩 에이전트(Claude Code, Codex, Cursor)를 팀 프로젝트에 쓸 때</b>: 규칙 파일, 허용 명령, 테스트·린트 자동 실행</>,
            '여러 세션에 걸친 긴 작업: 진행 기록·기능 목록·커밋으로 다음 세션에 넘겨주기',
            '에이전트를 제품에 넣을 때: 위험한 도구는 승인 필요, 실행 기록 추적, 평가 세트로 회귀 확인',
            '"모델을 바꿔야 하나?" 싶을 때 — 대부분은 지시·도구·검증을 고치는 게 먼저다',
          ]}
          avoid={[
            'LLM 한 번 호출로 끝나는 기능에 복잡한 하네스 — 단순한 프롬프트로 충분',
            '규칙 파일에 모든 걸 길게 쓰기 — 컨텍스트만 차지한다. 짧은 지도 + 필요한 문서 링크로',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <div className="grid gap-4 lg:grid-cols-2">
          <FolderTree
            title="에이전트가 일하기 좋게 준비한 저장소"
            lines={[
              'my-app/',
              '  AGENTS.md            # 짧은 지도: 구조, 명령어, 규칙, 문서 위치',
              '  CLAUDE.md            # Claude Code용 (AGENTS.md를 가리켜도 됨)',
              '  docs/',
              '    architecture.md    # 층 구조와 의존 규칙',
              '    conventions.md',
              '  .claude/',
              '    settings.json      # 허용/금지 명령, hooks',
              '  feature_list.json    # 기능별 통과 여부 (긴 작업용)',
              '  progress.md          # 세션마다 한 일 기록',
              '  scripts/check.sh     # lint + typecheck + test 한 번에',
            ]}
          />
          <Screen title="에이전트 실행 기록 (trace)" dark>
            <pre className="p-4 font-mono leading-relaxed">{`▸ read  AGENTS.md, progress.md, feature_list.json
▸ bash  git log --oneline -5
▸ bash  ./scripts/check.sh          ✓ 기존 상태 정상
▸ think 실패 중인 기능 하나: "장바구니 수량 변경"
▸ edit  src/features/cart/useCart.ts
▸ bash  ./scripts/check.sh
        ✖ eslint: features/cart → widgets import 금지
          (해결: 공용 로직은 entities/cart로 옮기세요)
▸ edit  src/entities/cart/model.ts
▸ bash  ./scripts/check.sh          ✓
▸ browser  /cart 에서 수량 + 클릭 → 합계 갱신 확인
▸ edit  feature_list.json  "cart-qty": passes=true
▸ bash  git commit -m "feat: 장바구니 수량 변경"`}</pre>
          </Screen>
        </div>
        <WhereToCheck
          items={[
            { where: 'Claude Code의 하네스 설정', path: ['프로젝트 루트', 'CLAUDE.md', '.claude/settings.json (permissions, hooks)'], what: '규칙 파일, 허용/금지 명령, 도구 실행 전후 자동으로 돌릴 검사(hooks).' },
            { where: 'Codex·여러 에이전트 공용 규칙', path: ['프로젝트 루트', 'AGENTS.md'], what: '여러 코딩 에이전트가 읽는 공통 지시 파일 형식.' },
            { where: '에이전트가 실제로 한 일', path: ['LangSmith / Claude Console', 'Traces'], what: '도구 호출 순서, 입력·출력, 걸린 시간, 토큰 사용량. 실패한 지점을 찾는 출발점.' },
            { where: '읽어볼 원문', path: ['anthropic.com/engineering', 'Building effective agents · Effective harnesses for long-running agents'], what: '에이전트 설계 원칙과 긴 작업용 하네스 사례.' },
          ]}
        />
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          title="AGENTS.md — 백과사전이 아니라 지도"
          code={`
# my-app

## 명령어
- 검사: \`./scripts/check.sh\` (lint + typecheck + test) — 커밋 전에 반드시 통과
- 개발 서버: \`npm run dev\` (port 3000)

## 구조 (자세한 건 docs/architecture.md)
- FSD 구조. 아래 층으로만 import (pages → widgets → features → entities → shared)

## 규칙
- 한 번에 기능 하나. 끝나면 feature_list.json의 passes를 true로, progress.md에 한 줄 기록
- 단위 테스트만으로 완료 처리 금지: 브라우저로 실제 동작 확인
- DB 마이그레이션, 배포 명령은 실행하지 말고 사람에게 요청`}
        />
        <CodeBlock
          title="feature_list.json — 에이전트는 passes만 바꾼다"
          code={`
[
  { "id": "cart-qty", "desc": "장바구니에서 수량을 바꾸면 합계가 갱신된다", "passes": false },
  { "id": "coupon",   "desc": "쿠폰 코드를 입력하면 할인 금액이 표시된다", "passes": false }
]`}
        />
        <CodeBlock
          title="린터 메시지에 고치는 방법을 넣기 (에이전트가 읽고 스스로 수정)"
          code={`
// eslint no-restricted-imports
'no-restricted-imports': ['error', { patterns: [{
  group: ['@/widgets/*'],
  message: 'features에서 widgets를 import할 수 없습니다. 공용 로직은 entities/로 옮기세요. (docs/architecture.md)',
}] }]`}
        />
        <CodeBlock
          title=".claude/settings.json — 권한과 hook"
          code={`
{
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm test:*)", "Bash(./scripts/check.sh)"],
    "deny": ["Bash(git push --force:*)", "Bash(rm -rf:*)"]
  },
  "hooks": {
    "PostToolUse": [{ "matcher": "Edit|Write",
      // hook은 도구 정보를 stdin JSON으로 받는다 → 방금 고친 파일만 린트
      "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs npx eslint --fix" }] }]
  }
}`}
        />
        <Callout title="LangChain에서는">
          <p>LangChain v1 문서는 <Code>createAgent</Code>를 "설정 가능한 하네스"로 설명하고, 승인 대기(<Code>humanInTheLoopMiddleware</Code>), 재시도(<Code>modelRetryMiddleware</Code>), 개인정보 가리기(<Code>piiMiddleware</Code>) 같은 middleware로 하네스를 조립합니다. 같은 질문의 LangChain 심화를 참고하세요.</p>
        </Callout>
      </Section>
    </>
  );
}
