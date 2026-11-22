# Q : GraphQL이란 무엇이고, REST API와 어떻게 다른가요?

<br />

# A : GraphQL은 클라이언트가 **필요한 데이터의 모양을 쿼리로 직접 적어서 요청**하고, 서버는 정확히 그 모양대로 응답하는 API 방식입니다. 서버는 어떤 데이터와 필드가 있는지를 **스키마(타입 시스템)**로 정의해 두고, 보통 `/graphql` **하나의 엔드포인트**로 조회(query), 변경(mutation), 실시간 구독(subscription)을 모두 처리합니다. REST가 리소스마다 URL을 나누고 서버가 응답 모양을 정하는 것과 달리, GraphQL은 화면에 필요한 필드만 골라 한 번에 받아서 **덜 받거나(over-fetching) 여러 번 요청하는(under-fetching) 문제**를 줄입니다. 대신 HTTP 캐시를 그대로 쓰기 어렵고, 서버에서 N+1 쿼리 문제와 너무 복잡한 쿼리를 막는 장치(깊이·복잡도 제한)가 필요합니다.

### REST와 비교

```
REST: 화면 하나에 요청 여러 번, 필요 없는 필드도 함께 옴
GET /users/1            → { id, name, email, address, createdAt, ... }
GET /users/1/posts      → [{ id, title, body, ... }, ...]
GET /posts/10/comments  → ...

GraphQL: 필요한 모양을 한 번에
POST /graphql
{ user(id: 1) { name  posts(first: 3) { title  commentCount } } }
```

| | REST | GraphQL |
|---|---|---|
| 엔드포인트 | 리소스마다 여러 개 (`/users`, `/posts`) | 보통 하나 (`/graphql`) |
| 응답 모양 | 서버가 정함 | **클라이언트가 쿼리로 정함** |
| 과다·과소 요청 | 생기기 쉬움 | 필요한 필드만, 한 번에 |
| 타입·문서 | OpenAPI 등 별도 | 스키마가 곧 문서 (introspection) |
| 버전 관리 | `/v1`, `/v2` | 필드 추가·deprecated로 버전 없이 진화 |
| HTTP 캐시 | GET + URL로 쉽게 | 대부분 POST라 어려움 → 클라이언트 캐시 |
| 에러 | HTTP 상태 코드 | 부분 성공 가능: `data`와 `errors`를 함께, 상태는 200인 경우가 많음 |
| 서버 부담 | 엔드포인트별 최적화 쉬움 | N+1, 복잡한 쿼리 방어 필요 |

### 스키마와 세 가지 작업

```graphql
# 서버의 스키마: 어떤 타입과 필드가 있는지
type User {
  id: ID!
  name: String!
  posts(first: Int): [Post!]!
}
type Post { id: ID!  title: String! }

type Query    { user(id: ID!): User }
type Mutation { createPost(title: String!): Post }
type Subscription { postAdded: Post }
```

```graphql
# 조회: 변수는 $로 선언하고 값은 따로 보낸다
query UserPage($id: ID!) {
  user(id: $id) {
    name
    posts(first: 3) { title }
  }
}

# 변경: 쓰기는 mutation으로. 여러 필드는 순서대로 실행된다
mutation { createPost(title: "GraphQL 정리") { id title } }

# 구독: 실시간 업데이트 (보통 WebSocket이나 SSE로 전달)
subscription { postAdded { id title } }
```

- query 필드들은 병렬로, mutation 필드들은 **순서대로** 실행된다. 단, mutation 여러 개가 트랜잭션처럼 묶이지는 않아서 중간에 실패해도 앞의 변경이 되돌려지지 않는다.
- **사용자 입력은 문자열로 쿼리에 끼워 넣지 않고 변수로 보낸다.** (SQL 인젝션과 같은 이유)
- 프래그먼트(fragment)로 자주 쓰는 필드 묶음을 재사용하고, `@include(if:)`, `@skip(if:)`로 조건부 필드를 받는다.

### 프론트엔드에서 요청하기

```js
// HTTP로 보면 그냥 JSON POST다
const res = await fetch('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `query UserPage($id: ID!) { user(id: $id) { name } }`,
    variables: { id: '1' },
  }),
});
const { data, errors } = await res.json(); // 일부 필드만 실패해도 data와 errors가 함께 올 수 있다
```

- 실무에서는 Apollo Client, urql, Relay 같은 GraphQL 클라이언트를 쓴다. 응답을 타입·ID 기준으로 정규화해 캐시하므로, 한 곳에서 글 제목을 바꾸면 같은 글을 보여 주는 다른 화면도 함께 갱신된다.
- 스키마에서 TypeScript 타입을 자동 생성(GraphQL Code Generator 등)하면 쿼리 결과까지 타입이 맞춰진다.
- **에러 처리 주의**: REST처럼 `res.ok`만 보면 안 된다. 상태가 200이어도 `errors`가 있을 수 있다.

### 서버 쪽 문제와 대응 (알고 있으면 좋은 것)

| 문제 | 설명 | 대응 |
|---|---|---|
| **N+1** | 글 10개를 받고 글마다 작성자를 따로 조회 → DB 쿼리 1 + 10번 | DataLoader로 한 번에 모아(batching) 조회 |
| 너무 무거운 쿼리 | 깊게 중첩된 쿼리 하나로 서버를 괴롭힐 수 있음 | 깊이·폭 제한, 쿼리 복잡도 분석, 페이지네이션, 요청 제한 |
| 캐싱 | POST 위주라 CDN 캐시가 어려움 | GET 쿼리 허용, persisted query(쿼리 대신 해시를 보냄) |
| 노출 범위 | 스키마로 모든 구조가 보임 | 운영에서 상세 에러 숨기기, 신뢰한 쿼리만 허용(trusted documents). introspection을 끄는 것만으로는 부족 |

### 언제 GraphQL을 쓰나

- **잘 맞는 곳**: 화면마다 필요한 데이터 조합이 다양할 때, 모바일·웹 등 클라이언트가 여러 종류일 때, 여러 서비스의 데이터를 하나의 API로 모을 때(BFF).
- **REST가 나은 곳**: 리소스 구조가 단순한 CRUD, HTTP·CDN 캐시가 중요한 공개 API, 파일 업로드·다운로드 위주.

- 면접 답변 요약: "GraphQL은 서버가 스키마로 데이터 타입을 정의해 두고, 클라이언트가 필요한 필드의 모양을 쿼리로 적어 하나의 엔드포인트에 요청하는 API 방식입니다. REST처럼 리소스마다 여러 번 요청하거나 필요 없는 필드까지 받는 문제를 줄이고, 스키마가 곧 문서이자 타입이라 프론트에서 타입을 자동 생성하기 좋습니다. 대신 POST 위주라 HTTP 캐시가 어려워 Apollo 같은 클라이언트 캐시를 쓰고, 상태 200이어도 errors가 올 수 있어 에러 처리를 따로 하며, 서버에서는 DataLoader로 N+1을 막고 쿼리 깊이·복잡도를 제한해야 합니다."

### 관련 질문

- [REST API란 무엇인가요?](./rest-api.md)

### 참고

- [Learn GraphQL (graphql.org)](https://graphql.org/learn/)
- [Queries (graphql.org)](https://graphql.org/learn/queries/)
- [Mutations (graphql.org)](https://graphql.org/learn/mutations/)
- [Subscriptions (graphql.org)](https://graphql.org/learn/subscriptions/)
- [Serving over HTTP (graphql.org)](https://graphql.org/learn/serving-over-http/)
- [Performance (graphql.org)](https://graphql.org/learn/performance/)
- [Security (graphql.org)](https://graphql.org/learn/security/)
