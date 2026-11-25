# Q : useEffect 안의 비동기 요청이 언마운트된 뒤나 값이 바뀐 뒤에 끝나면 어떤 문제가 생기고, 어떻게 막나요?

<br />

# A : useEffect 안에서 보낸 요청은 컴포넌트의 상황과 상관없이 **나중에 끝납니다.** 그 사이에 사용자가 다른 화면으로 가서 컴포넌트가 사라졌거나(언마운트), 보고 있던 `userId`가 바뀌었다면, 늦게 도착한 응답이 `setState`를 호출해서 **이미 지나간 데이터로 화면을 덮어씁니다.** A 사용자를 보다가 B로 바꿨는데 A의 응답이 늦게 와서 B 화면에 A 정보가 보이는 식입니다. 해결은 **cleanup 함수**로 합니다. React는 Effect가 다시 실행되기 전과 언마운트될 때 cleanup을 호출하므로, 그때 `ignore` 플래그를 켜서 **늦게 온 응답을 무시**하거나 `AbortController`로 **요청 자체를 취소**합니다. 실무에서는 이 처리를 매번 직접 하기보다 TanStack Query 같은 데이터 라이브러리에 맡기는 경우가 많습니다.

### 문제가 생기는 순서

```
userId = 'A'  → Effect 실행: A 요청 보냄 ─────────────── (느림) ──┐
userId = 'B'  → Effect 실행: B 요청 보냄 ── (빠름) ─┐              │
                                         B 응답 → setUser(B)     │
                                                    A 응답 → setUser(A)  ← B 화면에 A가 보인다
```

- 네트워크 응답은 **보낸 순서대로 오지 않는다.** 이런 버그를 경쟁 상태(race condition)라고 부른다.
- 언마운트 뒤에 끝나는 경우도 같다. 이미 사라진 화면을 위해 setState를 부르고, 같은 컴포넌트가 다시 마운트됐다면 엉뚱한 값이 들어갈 수 있다.

### 해결 1: ignore 플래그 (응답 무시)

```jsx
useEffect(() => {
  let ignore = false;

  async function load() {
    const json = await fetchUser(userId);
    if (!ignore) setUser(json); // 이 Effect가 아직 "현재"일 때만 반영
  }
  load();

  return () => {
    ignore = true; // userId가 바뀌거나 언마운트되면 이전 Effect의 결과는 버린다
  };
}, [userId]);
```

- React 공식 문서가 보여 주는 기본 패턴이다. cleanup은 **Effect가 다시 실행되기 전마다, 그리고 언마운트될 때 마지막으로 한 번** 호출된다.
- 각 Effect 실행은 자기만의 `ignore` 변수를 가진다(클로저). 그래서 A 요청의 `ignore`만 `true`가 되고 B 요청은 그대로 반영된다.
- 요청은 계속 진행되고 결과만 버린다. 네트워크 비용은 그대로다.

### 해결 2: AbortController (요청 취소)

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then((res) => res.json())
    .then(setUser)
    .catch((err) => {
      if (err.name === 'AbortError') return; // 우리가 취소한 것이므로 에러로 보지 않는다
      setError(err);
    });

  return () => controller.abort(); // 이전 요청을 실제로 끊는다
}, [userId]);
```

- `abort()`를 호출하면 `fetch` Promise는 `AbortError`라는 이름의 `DOMException`으로 거부(reject)된다. 이것을 일반 에러처럼 화면에 띄우지 않도록 걸러 낸다.
- 응답 본문을 읽는 중(`res.json()`)에 취소돼도 `AbortError`가 난다.
- 타임아웃은 `AbortSignal.timeout(5000)`으로 걸 수 있고, 이때는 `TimeoutError`가 난다. 사용자 취소와 함께 쓰려면 `AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])`.
- 한 번 abort된 signal은 다시 쓸 수 없다. Effect마다 새 `AbortController`를 만든다.

| | ignore 플래그 | AbortController |
|---|---|---|
| 하는 일 | 늦게 온 결과를 버림 | 요청 자체를 끊음 |
| 네트워크 | 끝까지 받음 | 중간에 끊겨 아낌 |
| 적용 대상 | 어떤 비동기 작업이든 | `signal`을 받는 API (fetch, axios 등) |
| 주의 | 없음 | `AbortError`를 에러 처리에서 걸러야 함 |

- **주의**: 서버에 변경을 일으키는 요청(POST 등)을 abort해도 **서버에서 이미 처리된 변경은 되돌려지지 않는다.** 취소는 클라이언트가 결과를 기다리지 않겠다는 뜻일 뿐이다.

### 자주 하는 실수

```jsx
// 1. useEffect 콜백을 async로 만들기 → cleanup 대신 Promise를 돌려주게 된다
useEffect(async () => { ... }, [userId]); // X

// 2. 의존성 배열에서 userId를 빼기 → userId가 바뀌어도 다시 요청하지 않고, 오래된 값을 읽는다
useEffect(() => { fetchUser(userId).then(setUser); }, []); // X (eslint 경고를 끄지 않는다)

// 3. isMounted ref로 "마운트 여부"만 확인하기 → 언마운트는 막지만 userId가 바뀐 경우는 못 막는다
```

- 공식 문서도 Effect의 의존성은 "고르는" 것이 아니라고 설명한다. Effect 안에서 읽는 props·state는 모두 넣는다. 린트 경고를 끄는 것은 피해야 할 방법으로 나온다.

### 라이브러리에 맡기기

```jsx
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: ({ signal }) => fetch(`/api/users/${userId}`, { signal }).then((r) => r.json()),
});
```

- `queryKey`에 `userId`가 들어 있어서 키별로 캐시가 따로 있다. B를 보고 있으면 A 응답이 와도 A의 캐시에만 들어가므로 B 화면을 덮지 않는다.
- `signal`을 `fetch`에 넘기면, 쿼리가 더 이상 쓰이지 않을 때 요청이 취소된다. 넘기지 않으면 요청은 끝까지 진행되고 결과는 캐시에 저장된다.
- React 공식 문서도 Effect로 직접 데이터를 받는 것은 경쟁 상태·캐시·서버 렌더링 처리가 번거로워서, 프레임워크나 TanStack Query, SWR 같은 도구를 권한다.

- 면접 답변 요약: "useEffect의 비동기 요청은 컴포넌트가 언마운트되거나 의존 값이 바뀐 뒤에 끝날 수 있어서, 늦게 온 응답이 setState로 최신 화면을 덮어쓰는 경쟁 상태가 생깁니다. 응답은 보낸 순서대로 오지 않기 때문입니다. 그래서 cleanup 함수에서 ignore 플래그를 켜서 늦은 결과를 무시하거나, AbortController로 요청 자체를 취소하고 AbortError는 에러 처리에서 걸러 냅니다. 의존성 배열을 빠뜨리지 않는 것도 중요하고, 실무에서는 queryKey별로 캐시를 나누고 signal로 취소해 주는 TanStack Query 같은 라이브러리를 쓰는 편이 안전합니다."

### 관련 질문

- [useEffect 훅에 대해서 설명해주세요](./use-effect.md)
- [Tanstack-Query란 무엇이며 이를 사용하는 이유는 무엇일까요?](./tanstack-query.md)
- [클로저는 정확히 무엇이며, 왜 및 어떻게 사용되나요?](../javascript-questions/04-closure.md)

### 참고

- [Synchronizing with Effects (React 문서)](https://react.dev/learn/synchronizing-with-effects)
- [useEffect (React 문서)](https://react.dev/reference/react/useEffect)
- [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [AbortSignal (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [Query Cancellation (TanStack Query 문서)](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
