# Q : Array.fromAsync()는 무엇이고 Promise.all과 어떻게 다른가요?

<br />

# A : `Array.fromAsync()`는 `Array.from()`의 비동기 버전으로, **비동기 이터러블**(`for await`로 도는 것: async generator, 스트림 등)이나 Promise가 든 배열을 받아 **하나씩 기다리면서** 배열로 모은 뒤, 그 배열을 Promise로 돌려줍니다. `Promise.all()`과 가장 큰 차이는 기다리는 방식입니다. `Promise.all()`은 이미 시작된 Promise들을 **동시에** 기다리고, `Array.fromAsync()`는 앞의 값이 끝나야 다음 값을 꺼내는 **순차** 방식입니다. 그래서 이미 만들어 둔 요청 여러 개를 빨리 모을 때는 `Promise.all()`, 페이지네이션 API처럼 다음 값을 앞의 결과를 보고 가져와야 하는 비동기 이터러블을 배열로 만들 때는 `Array.fromAsync()`를 씁니다. 2024년 1월부터 모든 주요 브라우저에서 쓸 수 있습니다.

### 기본 사용법

```js
// 1) async generator(비동기 이터러블) → 배열
async function* numbers() {
  yield 1;
  yield 2;
  yield 3;
}
const arr = await Array.fromAsync(numbers()); // [1, 2, 3]

// 2) 예전에는 직접 for await로 모았다
const arr2 = [];
for await (const n of numbers()) arr2.push(n);
```

```js
// 3) Promise가 든 배열·이터러블도 받는다 (각 값을 await해서 넣는다)
const values = await Array.fromAsync([Promise.resolve(1), 2, Promise.resolve(3)]); // [1, 2, 3]

// 4) 두 번째 인자 mapFn: 반환값도 await된다
const users = await Array.fromAsync([1, 2, 3], (id) => fetchUser(id));
```

- 받을 수 있는 것: 비동기 이터러블, 일반 이터러블, 유사 배열(`{ length: 2, 0: 'a', 1: 'b' }`)
- 반환: 항상 **Promise\<Array\>**. `await`나 `.then()`으로 받는다.
- `Array.from()`과 다른 점: 비동기 이터러블을 처리하고, Promise를 반환하고, 각 요소와 `mapFn`의 결과를 await한다.

### Promise.all과의 차이

```js
const delay = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

// 100ms 걸리는 Promise 5개
const make = () => [1, 2, 3, 4, 5].map((v) => delay(100, v));

console.time('all');
await Promise.all(make());        // 약 100ms: 5개를 동시에 기다림
console.timeEnd('all');

async function* gen() {
  for (const v of [1, 2, 3, 4, 5]) yield delay(100, v); // 하나씩 만들어서 넘김
}
console.time('fromAsync');
await Array.fromAsync(gen());     // 약 500ms: 앞의 값이 끝나야 다음을 꺼냄
console.timeEnd('fromAsync');
```

- MDN 예시에서도 100ms짜리 5개를 `Promise.all()`은 약 100ms, 비동기 이터러블을 받은 `Array.fromAsync()`는 약 500ms에 끝낸다.

| | `Promise.all()` | `Array.fromAsync()` |
|---|---|---|
| 기다리는 방식 | **동시에** | **하나씩 순서대로** (다음 값을 미리 꺼내지 않음) |
| 입력 | Promise 이터러블 | 비동기 이터러블, 이터러블, 유사 배열 |
| async generator | 받을 수 없음 | 받을 수 있음 |
| 변환 함수 | 없음 (`map` 후 넘김) | `mapFn` 내장, 결과도 await |
| 실패 시 | 하나라도 reject되면 바로 reject | reject되는 지점에서 멈추고 reject |
| 잘 맞는 곳 | 독립적인 요청 여러 개를 빨리 | 스트림, 페이지네이션, 순서대로 처리해야 하는 작업 |

- 주의: 이미 만들어진 Promise 배열을 `Array.fromAsync()`에 넘기면 요청은 이미 동시에 출발한 상태라 전체 시간은 비슷할 수 있다. 다만 기다리는 건 순서대로라, 예를 들어 뒤쪽 Promise가 먼저 reject돼도 앞쪽이 끝날 때까지 알아채지 못한다. **여러 요청을 동시에 기다리는 목적이면 `Promise.all()`**을 쓴다.

### 실무 예시: 페이지네이션 API를 끝까지 모으기

```js
// 다음 페이지 주소는 이전 응답을 받아야 알 수 있다 → 순차가 맞다
async function* fetchAllPages(url) {
  while (url) {
    const res = await fetch(url);
    const { items, next } = await res.json();
    yield* items;
    url = next;
  }
}

const allItems = await Array.fromAsync(fetchAllPages('/api/posts?page=1'));
```

- 에러 처리: 중간에 실패하면 반환된 Promise가 reject되므로 `try/catch`로 감싼다. 일반 이터러블을 받은 경우에는 실패할 때 이터레이터의 `return()`도 불러서 정리할 기회를 준다.
- 모든 값을 메모리에 모으므로, 아주 큰 스트림은 `for await`로 하나씩 처리하는 게 낫다.

- 면접 답변 요약: "Array.fromAsync()는 Array.from()의 비동기 버전으로, async generator 같은 비동기 이터러블이나 Promise 배열을 하나씩 await하면서 배열로 모아 Promise로 돌려줍니다. Promise.all()은 이미 시작된 Promise를 동시에 기다리고, Array.fromAsync()는 앞의 값이 끝나야 다음 값을 꺼내는 순차 방식이라 100ms짜리 5개를 기다리면 각각 약 100ms와 500ms가 걸립니다. 그래서 독립적인 요청은 Promise.all()로, 페이지네이션처럼 순서가 필요한 비동기 이터러블은 Array.fromAsync()로 모읍니다."

### 관련 질문

- [Promise.all에 대해서 간단히 설명해주세요.](./51-promise-all.md)
- [Promise의 정의와 사용 예시를 알려주세요.](./46-Promise.md)
- [async/await에 대해서 설명해주세요.](./36-async-await.md)

### 참고

- [Array.fromAsync() (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fromAsync)
