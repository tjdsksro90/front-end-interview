# Q : RAG(검색 증강 생성)는 무엇이고, 프론트엔드 개발자는 어디까지 알아야 하나요?

<br />

# A : RAG(Retrieval-Augmented Generation)는 LLM이 답하기 전에 **우리 문서에서 질문과 관련된 부분을 먼저 검색해서, 그 내용을 프롬프트에 함께 넣어 답하게 하는 방식**입니다. 모델은 학습하지 않은 사내 문서나 최신 정보를 모르기 때문에, 모델을 다시 학습시키는 대신 "참고 자료를 찾아서 같이 건네주는" 것입니다. 준비 단계에서는 문서를 불러와(Load) 작은 조각으로 나누고(Split) 임베딩(의미를 숫자 벡터로 바꾼 것)으로 만들어 벡터 DB에 저장(Store)하고, 질문이 오면 비슷한 조각을 찾아(Retrieve) 답을 생성(Generate)합니다. 프론트엔드 개발자는 이 흐름과 함께, **답변의 출처를 보여 주는 UI, 스트리밍, 사용자 권한에 맞는 문서만 검색되게 하는 것, 품질 문제(조각이 맥락을 잃는 문제)**를 이해하고 있으면 충분합니다.

### 왜 필요한가

| 문제 | RAG로 |
|---|---|
| 모델은 우리 회사 문서·최신 정보를 모른다 | 검색한 문서를 함께 넣어 준다 |
| 모델이 그럴듯하게 지어낸다 | 근거 문서 안에서 답하게 하고 출처를 보여 준다 |
| 문서가 바뀔 때마다 모델을 다시 학습시키기 어렵다 | 벡터 DB만 갱신하면 된다 |
| 문서 전체를 매번 프롬프트에 넣기엔 너무 길다 | 관련 있는 조각만 골라 넣는다 |

- 이름은 2020년 논문(NeurIPS 2020)에서 나왔다. 사전 학습된 생성 모델(파라미터 속 지식)에 Wikipedia 벡터 인덱스(외부 지식)를 검색기로 연결한 구조였다.

### 흐름

```
[준비: 인덱싱]  문서 ─Load→ 불러오기 ─Split→ 조각(chunk) ─Embed→ 벡터 ─Store→ 벡터 DB

[질문할 때]     질문 ─Embed→ 벡터 ─Retrieve→ 비슷한 조각 4~20개
                                        └→ "다음 자료를 참고해 답하라: [조각들] 질문: ..." ─Generate→ 답변
```

```js
// LangChain(JS) 튜토리얼의 핵심 부분을 줄인 예
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
const chunks = await splitter.splitDocuments(docs);      // 1000자씩, 200자 겹치게

const vectorStore = new MemoryVectorStore(embeddings);    // 실무에선 pgvector, Pinecone 등
await vectorStore.addDocuments(chunks);

const related = await vectorStore.similaritySearch(question, 4); // 비슷한 조각 4개
```

- **Split**: 너무 크면 관련 없는 내용이 섞이고, 너무 작으면 맥락이 끊긴다. 조각끼리 조금 겹치게(overlap) 자르는 이유다.
- **Embed**: 같은 의미면 비슷한 벡터가 나오는 모델로 바꾼다. "환불"과 "반품 규정"처럼 단어가 달라도 찾을 수 있다.
- **Retrieve**: 의미 검색(벡터)과 키워드 검색(BM25)을 섞으면 고유명사·에러 코드 같은 것도 잘 찾는다.

### 품질 문제: 조각이 맥락을 잃는다

- "매출이 전 분기보다 3% 늘었다"라는 조각만 보면 **어느 회사, 어느 분기**인지 알 수 없다. 자르면서 맥락이 사라져서 검색이 빗나간다.
- Anthropic의 **Contextual Retrieval**은 각 조각 앞에 "이 조각은 OO사 2023년 2분기 보고서의 일부다" 같은 설명(50~100토큰)을 LLM으로 만들어 붙인 뒤 임베딩·BM25 인덱스를 만든다.
- Anthropic 실험에서 상위 20개 검색 실패율이 5.7%에서
  - Contextual Embeddings만: 3.7% (35% 감소)
  - \+ Contextual BM25: 2.9% (49% 감소)
  - \+ 재정렬(reranking, 150개를 가져와 다시 순위 매겨 20개 선택): 1.9% (67% 감소)
- 즉 RAG 품질은 모델보다 **어떻게 자르고, 무엇을 찾아 넣느냐**에 크게 좌우된다.

### 프론트엔드 개발자가 챙길 것

| 영역 | 할 일 |
|---|---|
| **출처 표시** | 답변 아래 참고한 문서 제목·링크·해당 부분을 보여 준다. 사용자가 검증할 수 있고 신뢰가 올라간다 |
| **스트리밍** | 검색(수백 ms) + 생성 시간이 길다. "문서 찾는 중 → 답변 작성 중" 단계를 보여 주고 답은 스트리밍 |
| **권한** | 검색 단계에서 **사용자가 볼 수 있는 문서만** 걸러야 한다. 그렇지 않으면 모델이 권한 없는 문서 내용을 답에 섞는다 (OWASP LLM08) |
| **모를 때** | 관련 문서가 없으면 "찾지 못했어요"라고 답하게 하고 UI도 그 경우를 준비 |
| **피드백** | 좋아요/싫어요, "이 출처가 틀렸어요" 버튼으로 품질 개선 데이터 수집 |
| **문서 업로드** | 사용자가 문서를 올리는 기능이면 업로드 → 인덱싱 진행 상태를 보여 주기 |
| **보안** | 검색된 문서 안의 숨은 지시(간접 프롬프트 인젝션)에 주의, 출력은 sanitize |

- 벡터 DB 구성·임베딩 모델 선택·청크 전략은 보통 백엔드·AI 엔지니어의 영역이다. 프론트엔드는 **흐름을 이해하고, 사용자에게 근거와 진행 상태를 보여 주고, 권한 문제를 놓치지 않는 것**이 핵심이다.
- 최근에는 고정된 "검색 1번 → 생성" 대신, 에이전트가 **스스로 검색어를 정하고 필요하면 다시 검색**하는 방식(agentic RAG)도 많이 쓴다. LangChain 튜토리얼도 검색을 도구로 주고 에이전트가 판단하게 하는 구조다.

- 면접 답변 요약: "RAG는 LLM이 답하기 전에 우리 문서에서 관련 부분을 검색해 프롬프트에 함께 넣는 방식입니다. 문서를 조각으로 나눠 임베딩해 벡터 DB에 저장해 두고, 질문이 오면 비슷한 조각을 찾아 답을 생성합니다. 모델을 다시 학습하지 않고 최신·사내 정보를 쓰고, 근거를 보여 줄 수 있는 게 장점입니다. 프론트엔드에서는 출처 표시, 검색·생성 단계의 스트리밍 UI, 사용자 권한에 맞는 문서만 검색되게 하는 것, 관련 문서가 없을 때의 처리를 챙깁니다. 품질은 조각을 자르는 방식에 크게 좌우되는데, Anthropic의 Contextual Retrieval처럼 조각에 맥락을 붙이면 검색 실패가 크게 줄어듭니다."

### 관련 질문

- [LangChain과 LangGraph는 무엇이고 어떻게 다른가요?](./langchain-langgraph.md)
- [AI가 만든 코드와 LLM 기능의 보안 문제는 어떻게 막나요?](./ai-code-security.md)
- [프론트엔드에서 LLM 응답을 스트리밍으로 보여 주려면 어떻게 하나요?](./llm-streaming.md)

### 참고

- [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (arXiv)](https://arxiv.org/abs/2005.11401)
- [Retrieval Augmented Generation (RAG) (LangChain 문서)](https://docs.langchain.com/oss/javascript/langchain/rag)
- [Introducing Contextual Retrieval (Anthropic)](https://www.anthropic.com/news/contextual-retrieval)
- [OWASP Top 10 for LLM Applications 2025 (OWASP GenAI)](https://genai.owasp.org/llm-top-10/)
