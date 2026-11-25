# Q : 검색창처럼 요청이 연달아 나갈 때 응답 순서가 뒤바뀌는 문제(race condition)는 어떻게 막나요?

<br />

# A : 검색창에 `r`, `re`, `rea`, `react`를 차례로 입력하면 요청도 네 번 나갑니다. 그런데 **응답은 보낸 순서대로 오지 않기 때문에**, 늦게 끝난 `re`의 결과가 마지막에 도착하면 입력창에는 `react`가 있는데 목록에는 `re`의 결과가 보입니다. 이것이 경쟁 상태(race condition)입니다. 핵심 원칙은 **"가장 최근 요청의 응답만 화면에 반영한다"**입니다. 방법은 세 가지를 겹쳐 씁니다. 새 요청을 보낼 때 **이전 요청을 `AbortController`로 취소**하거나, 요청마다 번호를 붙여 **최신 번호가 아닌 응답은 버립니다.** 그리고 **debounce**로 입력이 멈춘 뒤에만 요청해서 요청 수 자체를 줄입니다. TanStack Query를 쓰면 검색어를 `queryKey`에 넣는 것만으로 검색어별 캐시가 나뉘어 이 문제가 거의 사라집니다.

### 무슨 일이 생기나

```
입력  r ── re ── rea ── react
요청  #1   #2    #3     #4
응답        #1  #3  #4       #2(느림)
화면        r → rea → react → re   ← 입력은 react인데 결과는 re
```

- debounce만으로는 해결되지 않는다. 요청 수를 줄일 뿐, 이미 나간 두 요청의 순서가 바뀌는 건 막지 못한다.
- 같은 문제가 탭 전환, 페이지 이동, 필터 변경, 상세 페이지 ID 변경에서도 생긴다.

### 방법 1: 이전 요청 취소 (AbortController)

```jsx
function useSearch(keyword) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!keyword) return;
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(keyword)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then(setResults)
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });

    return () => controller.abort(); // 다음 keyword로 바뀌면 이전 요청을 끊는다
  }, [keyword]);

  return results;
}
```

- `abort()`된 요청의 `fetch`는 `AbortError`로 거부되므로, 결과가 `setResults`까지 가지 않는다.
- 네트워크도 아낀다. 서버에서는 이미 처리가 시작됐을 수 있지만 조회 요청이라 문제없다.

### 방법 2: 요청 번호로 최신 응답만 반영

```jsx
const latestId = useRef(0);

async function search(keyword) {
  const id = ++latestId.current; // 이번 요청의 번호
  const data = await api.search(keyword);
  if (id !== latestId.current) return; // 그 사이에 더 새로운 요청이 나갔다면 버린다
  setResults(data);
}
```

- 이벤트 핸들러에서 요청할 때처럼 Effect의 cleanup을 쓸 수 없는 곳에서 유용하다.
- `signal`을 받지 않는 API, 직접 만든 비동기 함수에도 쓸 수 있다.
- useEffect 안이라면 `ignore` 플래그가 같은 역할을 한다.

### 방법 3: debounce로 요청 줄이기

```jsx
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // 입력이 계속되면 이전 타이머를 지운다
  }, [value, delay]);
  return debounced;
}

const debouncedKeyword = useDebounce(keyword);
const results = useSearch(debouncedKeyword); // 입력이 300ms 멈춘 뒤에만 요청
```

- 서버 부하와 요청 수를 줄인다. **순서 문제를 막는 건 방법 1·2의 몫**이므로 함께 쓴다.

### 방법 4: TanStack Query에 맡기기

```jsx
const { data, isFetching } = useQuery({
  queryKey: ['search', debouncedKeyword],
  queryFn: ({ signal }) =>
    fetch(`/api/search?q=${encodeURIComponent(debouncedKeyword)}`, { signal }).then((r) => r.json()),
  enabled: debouncedKeyword.length > 0,
  placeholderData: (prev) => prev, // 새 결과가 올 때까지 이전 결과를 보여 줌 (깜빡임 방지)
});
```

- 캐시가 검색어(`queryKey`)별로 따로 있다. 화면은 **지금 키**의 캐시만 보므로, `re`의 응답이 늦게 와도 `['search', 're']` 캐시에 들어갈 뿐 `react` 화면을 덮지 않는다.
- `signal`을 fetch에 넘기면 쿼리가 더 이상 쓰이지 않을 때 요청이 취소된다.
- 같은 검색어로 돌아가면 캐시에서 바로 보여 준다.

### 정리

| 방법 | 막는 것 | 쓰는 곳 |
|---|---|---|
| AbortController | 이전 응답 반영 + 네트워크 낭비 | `signal`을 받는 요청 |
| 요청 번호 / ignore | 이전 응답 반영 | 어떤 비동기 작업이든 |
| debounce | 요청 횟수 | 입력 기반 요청 (순서 문제는 못 막음) |
| queryKey별 캐시 | 다른 키의 응답이 화면을 덮는 것 | TanStack Query, SWR |

- 면접 답변 요약: "요청을 연달아 보내면 응답이 보낸 순서대로 오지 않아서, 늦게 끝난 이전 검색어의 결과가 최신 결과를 덮어쓰는 경쟁 상태가 생깁니다. 원칙은 가장 최근 요청의 응답만 반영하는 것이고, AbortController로 이전 요청을 취소하거나 요청마다 번호를 붙여 최신이 아닌 응답은 버립니다. debounce는 요청 수를 줄여 줄 뿐 순서 문제를 막지는 못하므로 함께 씁니다. TanStack Query를 쓰면 검색어를 queryKey에 넣어 키별로 캐시가 나뉘기 때문에 다른 검색어의 응답이 현재 화면을 덮지 않습니다."

### 관련 질문

- [useEffect 안의 비동기 요청이 언마운트된 뒤나 값이 바뀐 뒤에 끝나면 어떤 문제가 생기고, 어떻게 막나요?](./effect-async-cleanup.md)
- [Tanstack-Query란 무엇이며 이를 사용하는 이유는 무엇일까요?](./tanstack-query.md)
- [동기 및 비동기 함수의 차이는 무엇인가요?](../javascript-questions/28-synchronous-asynchronouse-function-diffrence.md)

### 참고

- [You Might Not Need an Effect — Fetching data (React 문서)](https://react.dev/learn/you-might-not-need-an-effect)
- [useEffect — Fetching data with Effects (React 문서)](https://react.dev/reference/react/useEffect)
- [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Query Keys (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Query Cancellation (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
