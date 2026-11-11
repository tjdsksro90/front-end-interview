# Q : Map과 Set의 차이는 무엇이고, 각각 언제 사용하나요?

<br />

# A : Map은 **키와 값의 짝**(key → value)을 저장하는 자료구조이고, Set은 **값 하나씩만, 중복 없이** 저장하는 자료구조입니다. 그래서 "A로 B를 찾아야 한다"면 Map, "이 값이 있나 없나"만 알면 되거나 중복을 없애야 한다면 Set을 씁니다. 둘 다 넣은 순서를 기억하고, `size`로 개수를 바로 알 수 있고, `for...of`로 바로 순회할 수 있으며, 객체를 포함한 어떤 값이든 키(값)로 쓸 수 있습니다. 같은지 비교할 때는 `===`와 거의 같은 규칙(SameValueZero)을 써서 `NaN`끼리는 같다고 보고, 객체는 **내용이 아니라 참조**로 비교합니다.

### 한눈에 비교

| | Map | Set |
|---|---|---|
| 저장하는 것 | 키 → 값 짝 | 값 하나 |
| 중복 | 같은 키는 하나 (다시 넣으면 값이 덮어써짐) | 같은 값은 하나 (다시 넣어도 무시) |
| 넣기 / 꺼내기 | `set(k, v)` / `get(k)` | `add(v)` / (꺼내기 없음, 순회) |
| 있는지 확인 | `has(k)` | `has(v)` |
| 삭제 | `delete(k)` | `delete(v)` |
| 개수 | `size` | `size` |
| 순회 | `for (const [k, v] of map)` | `for (const v of set)` |
| 어떤 질문에 답하나 | "이 키의 값은 뭐지?" | "이 값이 들어 있나?" |

```js
const stock = new Map();
stock.set('apple', 3);
stock.set('banana', 0);
stock.get('apple');      // 3
stock.has('banana');     // true
stock.size;              // 2

const visited = new Set();
visited.add('/home');
visited.add('/home');    // 이미 있으니 무시
visited.has('/home');    // true
visited.size;            // 1
```

### 헷갈릴 때 고르는 법

1. **저장할 게 "짝"인가, "값 하나"인가?**
   - 짝(아이디 → 사용자, 단어 → 개수) → **Map** (또는 Object)
   - 값 하나(선택된 아이디들, 방문한 주소들) → **Set** (또는 Array)
2. **값이 있는지 자주 확인하나? 중복이 생기면 안 되나?** → Set
3. **순서·인덱스·중복이 의미 있나?** (`list[3]`, 같은 값이 여러 번) → Array
4. **키가 문자열로 고정된 "모양"이고 JSON으로 보내야 하나?** (`{ name, age }`) → Object

| 이런 상황 | 쓸 것 | 이유 |
|---|---|---|
| 배열 중복 제거 | Set | `[...new Set(arr)]` 한 줄 |
| 체크박스로 선택된 아이디들 | Set | 넣기·빼기·확인(`has`)이 빠르고 중복이 없음 |
| 방문한 노드 기록 (BFS/DFS) | Set | "이미 봤나?"만 확인 |
| 단어별 등장 횟수 | Map | 단어 → 개수 짝 |
| 아이디로 데이터 빠르게 찾기 | Map | `users.find()` 반복 대신 `map.get(id)` |
| DOM 요소·객체에 정보 붙이기 | Map (메모리 걱정되면 WeakMap) | 객체를 키로 쓸 수 있음 |
| API 응답·설정값처럼 정해진 모양 | Object | JSON으로 바로 주고받음 |
| 순서대로 보여 줄 목록 | Array | 인덱스, 정렬, `map`/`filter` |

### Object 대신 Map을 쓰는 이유

```js
const obj = {};
const a = { id: 1 };
const b = { id: 2 };
obj[a] = 'A';
obj[b] = 'B';
Object.keys(obj); // ['[object Object]'] → 두 객체가 같은 문자열 키가 되어 덮어써짐

const map = new Map();
map.set(a, 'A');
map.set(b, 'B');
map.size;         // 2 → 객체 자체를 키로 구분
```

- **키 타입**: Object의 키는 문자열·Symbol뿐이라 숫자·객체가 문자열로 바뀐다. Map은 아무 값이나 키가 된다.
- **기본 키 충돌**: Object는 프로토타입이 있어서 `constructor`, `toString` 같은 키가 처음부터 있는 것처럼 보일 수 있다. 사용자 입력을 키로 쓰면 프로토타입 오염 위험도 있다. Map은 비어서 시작한다.
- **개수·순회**: Map은 `size`, `for...of`가 바로 된다. Object는 `Object.keys(obj).length`처럼 돌아가야 한다.
- **잦은 추가·삭제**: MDN은 키를 자주 넣고 빼는 경우 Map이 더 잘 동작한다고 설명한다.
- 대신 **JSON 변환은 Object가 편하다**. `JSON.stringify(new Map([[1, 2]]))`는 `{}`가 된다. 보낼 때는 `Object.fromEntries(map)`이나 `[...map]`으로 바꾼다.

### Array 대신 Set을 쓰는 이유

```js
const ids = [/* 10,000개 */];
ids.includes(9999);      // 앞에서부터 하나씩 비교

const idSet = new Set(ids);
idSet.has(9999);         // 바로 찾음 (평균적으로 includes보다 빠름)
```

- "들어 있나?" 확인을 반복한다면 Set이 낫다. 배열에서 `filter`로 빼는 것보다 `delete`도 간단하다.
- 대신 인덱스(`set[0]`)가 없고, `map`/`filter`가 없어서 필요하면 `[...set]`으로 배열로 바꾼다.
- 집합 연산 메서드도 있다: `a.union(b)`(합집합), `a.intersection(b)`(교집합), `a.difference(b)`(차집합), `a.isSubsetOf(b)` 등.

### 자주 하는 실수

- **객체는 참조로 비교**한다. `new Set([{ id: 1 }, { id: 1 }]).size`는 2다. 내용이 같은 객체는 다른 값으로 본다. 아이디로 중복을 없애려면 `new Map(list.map((x) => [x.id, x]))`처럼 아이디를 키로 쓴다.
- **Map에 점 표기로 넣기**: `map.foo = 1`은 Map에 저장되지 않는다. `map.has('foo')`는 false. 반드시 `set()`을 쓴다.
- **React state로 쓸 때** `set.add()`, `map.set()`은 원본을 바꾼다. 같은 객체라 React가 변경을 알아채지 못하므로 새로 만들어서 넣는다.
  ```js
  setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  ```
- **WeakMap / WeakSet**: 키(값)로 객체만 받고, 그 객체가 다른 곳에서 안 쓰이면 함께 정리(GC)된다. 대신 순회·`size`가 없다. DOM 요소에 정보를 붙이거나 객체별 캐시를 둘 때 메모리 누수를 막는 용도다.

### 알아두면 좋은 것: Map.groupBy

```js
const byType = Map.groupBy(products, (p) => p.type);
byType.get('fruit'); // [{ name: 'banana', type: 'fruit' }, ...]
```

- 배열을 기준값별로 묶어 Map으로 돌려준다. 키가 문자열이면 `Object.groupBy()`도 있다.

- 면접 답변 요약: "Map은 키와 값의 짝을, Set은 중복 없는 값의 모음을 저장합니다. 그래서 아이디로 데이터를 찾거나 단어별 개수를 세는 것처럼 'A로 B를 찾는' 경우는 Map을, 선택된 항목이나 방문 기록처럼 '있나 없나'만 확인하거나 중복을 없애야 하는 경우는 Set을 씁니다. Object와 비교하면 Map은 객체도 키로 쓸 수 있고 size와 순회가 바로 되며 기본 키 충돌이 없습니다. Array와 비교하면 Set은 has로 확인하는 게 includes보다 빠릅니다. 둘 다 JSON으로 바로 바뀌지 않고, React state로 쓸 때는 새 Map·Set을 만들어 넣어야 합니다."

### 관련 질문

- [원시값과 참조값의 차이점을 메모리 관점에서 설명하라](./45-primitive-type-reference-type.md)
- [Spread Syntax의 이점과 주의해야할 점은?](./48-spread-syntax.md)

### 참고

- [Map (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [Set (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
- [Map.groupBy() (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy)
- [WeakMap (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [WeakSet (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
- [JSON.stringify() (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
