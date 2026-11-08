# Q : 빠르게 검색 조건을 바꿨을 때 이전 응답이 덮어쓰면 어떻게 하나요?

<br />

# A : 요청은 보낸 순서대로 돌아온다는 보장이 없어서, 나중에 보낸 요청보다 먼저 보낸 요청의 응답이 늦게 도착하면 화면이 예전 검색 결과로 덮어써집니다. 이런 문제를 경쟁 상태(race condition)라고 합니다. 해결 방법은 이전 요청을 취소하거나(AbortController), 응답이 "지금 조건에 대한 응답"인지 확인하고 아니면 버리는 것입니다. TanStack Query처럼 검색 조건을 queryKey로 쓰는 라이브러리는 조건마다 캐시를 따로 두기 때문에 이 문제를 구조적으로 막아줍니다.

### 어떤 상황인가

```txt
입력: "re" → "rea" → "react"

요청 1  q=re     ─────────────────────────────▶ 응답 (늦게 도착, 결과 500개)
요청 2  q=rea    ──────────▶ 응답
요청 3  q=react  ─────▶ 응답 (결과 20개)

화면: react 결과(20개) → 잠시 후 re 결과(500개)로 덮어씀
```

- 검색어는 "react"인데 화면에는 "re" 결과가 남는다. 필터·탭·페이지를 빠르게 바꿀 때도 똑같이 생긴다.
- 원인은 **응답이 도착하는 순서 ≠ 요청한 순서**라는 것. 서버 처리 시간, 캐시 여부, 네트워크 상황이 요청마다 다르다. 짧은 검색어일수록 결과가 많아 더 느린 경우가 흔하다.

### 문제가 되는 코드

```tsx
useEffect(() => {
  fetch(`/api/search?q=${query}`)
    .then((r) => r.json())
    .then((data) => setResults(data)); // 어떤 요청의 응답이든 무조건 반영
}, [query]);
```

### 해결 1: 이전 요청 취소 (AbortController)

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setResults)
    .catch((e) => {
      if (e.name !== 'AbortError') setError(e); // 취소는 에러가 아니다
    });

  return () => controller.abort(); // query가 바뀌면 이전 요청 취소
}, [query]);
```

- `abort()`를 호출하면 그 `fetch`의 Promise가 `AbortError`로 reject된다. 그래서 늦게 온 응답이 `setResults`까지 가지 못한다.
- 네트워크 요청 자체를 끊어서 **대역폭도 아낀다**. 다만 서버는 이미 처리를 시작했을 수 있다. 취소는 "클라이언트가 결과를 안 받는다"는 의미다.
- `AbortController`는 한 번 abort하면 다시 쓸 수 없다. 요청마다 새로 만든다.

### 해결 2: 오래된 응답은 무시 (ignore 플래그 / 요청 번호)

```tsx
useEffect(() => {
  let ignore = false;

  search(query).then((data) => {
    if (!ignore) setResults(data); // 이 effect가 아직 "현재"일 때만 반영
  });

  return () => { ignore = true; }; // 다음 query로 바뀌면 이전 응답은 무시
}, [query]);
```

- 취소를 지원하지 않는 API(SDK 등)에도 쓸 수 있다. 요청은 끝까지 가지만 결과를 화면에 반영하지 않는다.
- effect 밖(이벤트 핸들러 등)이라면 **요청 번호**로 같은 일을 한다.

```ts
const latestId = useRef(0);

async function onSearch(q) {
  const id = ++latestId.current;
  const data = await search(q);
  if (id === latestId.current) setResults(data); // 가장 마지막 요청의 응답만 반영
}
```

### 해결 3: TanStack Query에 맡기기

```tsx
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['search', query],                 // 검색 조건 = 캐시 키
  queryFn: ({ signal }) =>
    fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal }).then((r) => r.json()),
  enabled: query.length > 1,
  placeholderData: keepPreviousData,           // 새 결과가 올 때까지 이전 결과를 흐리게 유지
});
```

- 응답은 **그 응답을 요청한 key의 캐시**에 저장되고, 화면은 **현재 key**의 데이터만 보여준다. "re" 응답이 늦게 와도 `['search', 're']` 캐시에 들어갈 뿐 "react" 화면을 덮지 않는다.
- `queryFn`에서 `signal`을 `fetch`에 넘기면, 쿼리가 더 이상 쓰이지 않게 될 때 요청이 취소된다. 넘기지 않으면 요청은 끝까지 진행되고 결과는 캐시에 남는다(다시 그 검색어로 돌아오면 바로 보여줄 수 있다).

### 요청 수 자체를 줄이기: 디바운스

- 경쟁 상태를 **막는** 방법은 아니지만, 한 글자마다 요청하지 않고 입력이 멈춘 뒤(예: 300ms) 요청하면 겹치는 요청이 크게 줄어든다.
- 디바운스만으로는 부족하다. 300ms 뒤에 보낸 두 요청끼리도 순서가 뒤바뀔 수 있으므로 **취소/무시와 함께** 쓴다.

```tsx
const debouncedQuery = useDebounce(query, 300);
const { data } = useQuery({ queryKey: ['search', debouncedQuery], queryFn: ... });
```

### 정리

| 방법 | 하는 일 | 특징 |
|---|---|---|
| AbortController | 이전 요청을 끊는다 | 네트워크도 아낌. fetch가 signal을 지원해야 함 |
| ignore 플래그 / 요청 번호 | 늦게 온 응답을 버린다 | 어떤 비동기 함수에도 적용 가능 |
| TanStack Query (queryKey) | 조건별로 캐시를 분리한다 | 구조적으로 덮어쓰기가 안 생김, signal로 취소도 가능 |
| 디바운스 | 요청 횟수를 줄인다 | 단독으로는 해결이 아님, 위 방법과 함께 |

- 면접 답변 요약: "응답 순서가 요청 순서와 같다는 보장이 없어서 생기는 경쟁 상태입니다. useEffect의 cleanup에서 AbortController로 이전 요청을 취소하거나 ignore 플래그로 늦은 응답을 무시하고, TanStack Query를 쓴다면 검색 조건을 queryKey에 넣어 조건별 캐시로 분리합니다. 디바운스는 요청 수를 줄이는 보조 수단으로 함께 씁니다."

### 관련 질문

- [TanStack Query의 setQueryData와 invalidateQueries는 언제 사용하나요?](../react-questions/setquerydata-invalidatequeries.md)
- [예약·결제 버튼을 두 번 누르면 어떻게 막나요?](./double-submit.md)

### 참고

- [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [AbortSignal (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [Query Cancellation (TanStack Query)](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
