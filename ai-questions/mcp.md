# Q : MCP(Model Context Protocol)는 무엇이고 왜 필요한가요?

<br />

# A : MCP는 AI 애플리케이션(Claude, IDE의 AI 도우미 등)을 외부 시스템(파일, DB, Figma, 캘린더, 사내 API 등)에 연결하는 **오픈 표준 프로토콜**입니다. 공식 문서는 "AI 애플리케이션을 위한 USB-C 포트"라고 비유합니다. MCP 이전에는 AI 앱마다, 연결할 서비스마다 연동 코드를 따로 만들어야 했는데(앱 N개 × 서비스 M개), MCP는 서비스 쪽이 **MCP 서버**를 한 번 만들면 MCP를 지원하는 어떤 AI 앱이든 같은 방식으로 붙일 수 있게 합니다. 서버는 AI가 실행할 수 있는 **도구(Tools)**, 읽을 수 있는 **데이터(Resources)**, 재사용할 **프롬프트(Prompts)**를 제공하고, 통신은 JSON-RPC 2.0 메시지로 합니다.

### 왜 필요한가

```
MCP 이전                              MCP 이후
Claude  ─┬─ Figma 연동 코드            Claude ─┐            ┌─ Figma MCP 서버
         ├─ GitHub 연동 코드           Cursor ─┼─ MCP ──────┼─ GitHub MCP 서버
Cursor  ─┼─ Figma 연동 코드 (또)       IDE    ─┘            └─ 사내 DB MCP 서버
         └─ GitHub 연동 코드 (또)
→ 앱 N × 서비스 M 개의 연동             → 앱 N + 서버 M 개면 끝
```

- LLM은 학습한 내용만 알고, 혼자서는 우리 회사 DB나 오늘 일정을 볼 수 없다. 도구를 연결해야 "에이전트"처럼 일할 수 있다.
- 연결 방법이 표준이 되면서 **한 번 만든 서버를 여러 AI 앱에서 재사용**할 수 있게 됐다.

### 구성 요소

| 역할 | 설명 | 예 |
|---|---|---|
| **Host** | 사용자가 쓰는 AI 애플리케이션. 하나 이상의 클라이언트를 관리 | Claude Desktop, Claude Code, VS Code |
| **Client** | Host 안에서 MCP 서버 하나와 연결을 유지하는 부분 | Host가 서버마다 하나씩 만든다 |
| **Server** | 클라이언트에 맥락(도구·데이터)을 제공하는 프로그램 | Figma MCP 서버, 파일 시스템 서버 |

### 서버가 제공하는 3가지 (primitives)

| | 무엇 | 예 |
|---|---|---|
| **Tools** | AI가 **실행**할 수 있는 함수 | `create_issue`, `query_database`, `get_design_context` |
| **Resources** | AI가 **읽을** 수 있는 데이터 | 파일 내용, DB 스키마, API 문서 |
| **Prompts** | 재사용할 수 있는 프롬프트 템플릿 | "이 PR 리뷰해 줘" 같은 정해진 작업 틀 |

- 반대로 서버가 클라이언트에 요청하는 기능도 있다. 예를 들어 **Elicitation**은 서버가 작업 중 사용자에게 추가 입력을 요청하는 기능이다.

### 통신 방식

- **메시지**: JSON-RPC 2.0. 요청에 `method`와 `params`를 담고, 응답으로 `result`나 `error`를 받는다.
- **전송 방식(Transport)**
  - **stdio**: 같은 컴퓨터에서 서버를 프로세스로 실행하고 표준 입출력으로 주고받는다. 로컬 파일·도구 연결에 쓴다.
  - **Streamable HTTP**: 클라이언트 → 서버는 HTTP POST, 스트리밍이 필요하면 SSE(Server-Sent Events)를 쓴다. 원격 서버에 쓰고, 인증은 OAuth로 토큰을 받는 방식을 권장한다.

```json
// 개념 예시: 클라이언트가 서버의 도구를 호출
{ "jsonrpc": "2.0", "id": 1, "method": "tools/call",
  "params": { "name": "create_issue", "arguments": { "title": "로그인 버튼 깨짐" } } }
```

- 흐름: Host가 서버에서 쓸 수 있는 도구 목록을 받아 → LLM에게 "이런 도구가 있다"고 알려 주고 → LLM이 도구를 쓰겠다고 하면 → 클라이언트가 서버에 호출 → 결과를 다시 LLM에게 전달.
- 최신 버전(2026-07-28) 프로토콜은 요청마다 프로토콜 버전을 함께 보내는 상태 없는(stateless) 방식으로 바뀌었고, 서버 정보는 `server/discover` 요청으로 확인한다.

### 프론트엔드 개발자에게 어떤 의미인가

- **디자인 → 코드**: Figma MCP 서버를 연결하면 AI 코딩 도구가 Figma 디자인의 구조·스타일 정보를 직접 읽어 코드를 만든다. (공식 문서도 "Figma 디자인으로 웹 앱을 만드는 Claude Code"를 예로 든다)
- **브라우저 확인**: 브라우저를 조작하는 MCP 서버를 붙이면 에이전트가 페이지를 열고, 콘솔 에러를 보고, 스크린샷으로 결과를 확인할 수 있다.
- **사내 도구 연결**: 디자인 시스템 문서, API 스키마, 이슈 트래커를 MCP 서버로 열어 두면 팀의 AI 도구가 같은 맥락으로 일한다.
- **직접 만들기**: 공식 SDK(TypeScript 등)로 서버를 만들 수 있다. 우리 서비스 API를 도구로 감싸 MCP 서버로 제공하는 것도 프론트엔드·풀스택 개발자가 할 수 있는 일이다.

### 보안 주의점

- 명세는 "Host는 도구를 실행하기 전에 사용자의 명시적인 동의를 받아야 한다"고 정한다. 도구는 실제로 파일을 지우거나 메시지를 보낼 수 있기 때문이다.
- 신뢰할 수 없는 MCP 서버는 설치하지 않는다. 서버가 돌려준 내용(웹페이지, 이슈 본문 등)에 숨은 지시문이 들어 있을 수 있다(간접 프롬프트 인젝션).
- 서버에는 필요한 최소 권한만 준다. 읽기만 필요하면 읽기 전용 토큰을 쓴다.

- 면접 답변 요약: "MCP는 AI 애플리케이션을 외부 도구·데이터에 연결하는 오픈 표준입니다. 예전에는 AI 앱마다 서비스별 연동을 따로 만들어야 했는데, MCP에서는 서비스가 MCP 서버를 한 번 만들면 Claude, IDE 등 MCP를 지원하는 어떤 앱에서든 같은 방식으로 쓸 수 있습니다. 서버는 실행할 수 있는 Tools, 읽을 수 있는 Resources, 프롬프트 템플릿인 Prompts를 제공하고, JSON-RPC 2.0으로 stdio나 Streamable HTTP를 통해 통신합니다. 프론트엔드에서는 Figma MCP로 디자인을 읽어 코드를 만들거나 브라우저를 조작해 결과를 확인하는 데 쓰고, 도구 실행 전 사용자 동의와 최소 권한이 중요합니다."

### 관련 질문

- [AI Agent란 무엇이고, 하네스(Harness)는 무엇인가요?](./ai-agent.md)
- [브라우저 내장 AI(Prompt API)는 무엇이고, 서버의 LLM API와 언제 다르게 쓰나요?](./browser-built-in-ai.md)

### 참고

- [What is the Model Context Protocol (MCP)? (MCP 공식 문서)](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Architecture overview (MCP 공식 문서)](https://modelcontextprotocol.io/docs/learn/architecture)
- [Specification (MCP 공식 문서)](https://modelcontextprotocol.io/specification/latest)
