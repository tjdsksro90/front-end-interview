# Q : LangChain과 LangGraph는 무엇이고 어떻게 다른가요?

<br />

# A : LangChain은 여러 LLM과 도구를 같은 방식으로 연결해 에이전트를 빠르게 만드는 프레임워크이고, LangGraph는 에이전트의 실행 흐름을 상태·노드·엣지로 된 그래프로 직접 설계하는 저수준 프레임워크입니다.

### LangChain

- **여러 모델을 같은 인터페이스로**: OpenAI, Anthropic, Google 등 제공자가 달라도 같은 코드로 호출한다. 모델을 바꿀 때 코드 수정이 적다.
- **도구·구조화된 출력**: 함수를 도구로 등록하고, 응답을 정해진 스키마(JSON)로 받는다.
- **`createAgent`**: 모델과 도구만 넘기면 "모델 호출 → 도구 실행 → 다시 모델" 루프가 만들어진다. middleware로 중간에 요약, 승인 같은 동작을 끼워 넣는다.

```js
import { createAgent, tool } from 'langchain';
import * as z from 'zod';

const getWeather = tool(async ({ city }) => `${city}는 맑음`, {
  name: 'get_weather',
  description: '도시의 날씨를 알려준다',
  schema: z.object({ city: z.string() }),
});

const agent = createAgent({ model: 'anthropic:claude-sonnet-5-5', tools: [getWeather] });
await agent.invoke({ messages: [{ role: 'user', content: '서울 날씨 알려줘' }] });
```

### LangGraph

- 에이전트의 흐름을 **그래프**로 짠다.
  - **State**: 노드끼리 주고받는 공유 데이터 (메시지 목록 등)
  - **Node**: 한 단계의 작업 (모델 호출, 도구 실행, 검사)
  - **Edge**: 다음 노드로 가는 길. 조건부 엣지로 분기하거나, 앞 노드로 돌아가 반복할 수 있다.
- **checkpointer**: 단계마다 상태를 저장해서, 중간에 멈췄다가 이어서 실행할 수 있다(durable execution).
- **interrupt**: 특정 단계에서 멈추고 사람의 승인이나 입력을 받은 뒤 재개한다(human-in-the-loop).

```js
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';

const graph = new StateGraph(MessagesAnnotation)
  .addNode('agent', callModel)
  .addNode('tools', runTools)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', (s) => (hasToolCall(s) ? 'tools' : END))
  .addEdge('tools', 'agent')   // 도구 실행 후 다시 모델로 (반복)
  .compile();
```

### 차이와 선택 기준

| | LangChain | LangGraph |
|---|---|---|
| 수준 | 고수준 (빨리 만들기) | 저수준 (흐름을 직접 설계) |
| 흐름 | `createAgent`가 정해진 루프를 제공 | 노드·엣지로 분기, 반복, 병렬을 직접 정의 |
| 강점 | 모델·도구 연결, 적은 코드 | 상태 저장, 중단·재개, 사람 승인 단계 |
| 관계 | `createAgent`가 내부적으로 LangGraph 위에서 동작 | LangChain의 모델·도구를 노드 안에서 그대로 사용 |

- 간단한 도구 사용 에이전트 → **LangChain `createAgent`**
- 결제 전 사람 승인, 여러 단계 검토, 실패 시 특정 단계로 되돌아가기처럼 **흐름 제어가 중요한 경우** → **LangGraph**
