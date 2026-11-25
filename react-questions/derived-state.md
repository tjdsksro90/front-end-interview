# Q : props나 state로 계산할 수 있는 값을 state로 따로 두면 왜 문제가 되나요?

<br />

# A : 다른 값으로 계산할 수 있는 값(파생 상태, derived state)을 state로 따로 두면, **같은 정보를 두 곳에 저장**하게 됩니다. 그러면 원본이 바뀔 때마다 파생 값도 직접 맞춰 줘야 하고, 한 곳이라도 빠뜨리면 **두 값이 어긋나는 버그**가 생깁니다. 장바구니에서 상품 수량은 바꿨는데 합계 state를 안 고쳐서 금액이 틀리게 보이는 식입니다. 흔히 useEffect로 맞추는데, 이러면 **먼저 틀린 값으로 한 번 렌더링하고 Effect가 고친 뒤 다시 렌더링**해서 비효율적이고 잠깐 잘못된 화면이 보입니다. React 공식 문서의 원칙은 **"기존 props나 state로 계산할 수 있으면 state에 넣지 말라"**입니다. 렌더링 중에 그냥 계산하고, 계산이 정말 무거울 때만 `useMemo`로 캐시합니다.

### 문제 코드와 고친 코드

```jsx
// X: 파생 값을 state + Effect로 동기화
function Cart({ items }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + i.price * i.qty, 0));
  }, [items]);
  // items가 바뀐 첫 렌더링에서는 total이 아직 이전 값이다 → 렌더링 2번
}

// O: 렌더링 중에 계산
function Cart({ items }) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
```

- 계산한 값은 언제나 원본에서 나오므로 **어긋날 수가 없다.** 이것을 단일 진실 공급원(single source of truth)이라고 한다.
- 공식 문서 예시도 같다. `firstName`, `lastName`이 있으면 `fullName`은 state가 아니라 `const fullName = firstName + ' ' + lastName;`이다.

### 무거운 계산이면 useMemo

```jsx
const visibleTodos = useMemo(
  () => getFilteredTodos(todos, filter),
  [todos, filter], // 둘 중 하나가 바뀔 때만 다시 계산
);
```

- 순수한 계산에만 쓴다(같은 입력이면 같은 결과, 외부 값 변경 없음).
- 첫 렌더링을 빠르게 해 주지는 않는다. 다시 렌더링될 때 계산을 건너뛸 뿐이다.
- 대부분의 필터·합계는 충분히 빠르다. 측정해 보고 느릴 때만 쓴다. React Compiler를 쓰면 이런 메모이제이션을 자동으로 해 준다.

### 자주 보이는 파생 상태 버그

**1. 선택한 항목을 객체째 state에 저장**

```jsx
// X: 목록이 새로 받아지면 selectedItem은 예전 객체 그대로 → 수정된 이름이 반영 안 됨
const [selectedItem, setSelectedItem] = useState(null);

// O: ID만 저장하고 객체는 계산
const [selectedId, setSelectedId] = useState(null);
const selectedItem = items.find((item) => item.id === selectedId) ?? null;
```

- 목록에서 그 항목이 지워지면 `selectedItem`도 자연스럽게 `null`이 된다.

**2. props를 state의 초깃값으로 복사**

```jsx
// X: 부모가 다른 user를 넘겨도 name은 처음 값 그대로
function Profile({ user }) {
  const [name, setName] = useState(user.name);
}
```

- `useState`의 초깃값은 **처음 마운트할 때만** 쓰인다.
- 편집용 임시 값이 목적이라면, 다른 사용자로 바뀔 때 `key`로 컴포넌트를 새로 만든다.

```jsx
<Profile user={user} key={user.id} /> // id가 바뀌면 다른 컴포넌트로 보고 state를 초기화
```

**3. 서버 데이터를 state에 복사**

```jsx
// X: 캐시가 갱신돼도 todos state는 예전 값
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
const [todos, setTodos] = useState([]);
useEffect(() => { if (data) setTodos(data); }, [data]);

// O: 캐시를 그대로 쓰고, 화면용 값은 계산
const { data: todos = [] } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
const doneCount = todos.filter((t) => t.done).length;
```

- 서버 데이터의 진실 공급원은 쿼리 캐시다. state로 복사하면 캐시가 바뀌어도 화면이 따라가지 않는다.

### 무엇을 state로 두나

| state로 둔다 | 계산한다 |
|---|---|
| 사용자 입력 (검색어, 필터, 선택한 ID) | 필터링된 목록, 검색 결과 수 |
| 서버에서 받은 원본 (또는 쿼리 캐시) | 합계, 개수, 정렬된 목록 |
| 열림/닫힘 같은 UI 상태 | "모두 선택됨" 여부, 버튼 활성화 여부 |

- 질문해 보기: "이 값을 다른 state·props로 계산할 수 있나?" → 그렇다면 state가 아니다. "시간이 지나도 안 바뀌나?" → state가 아니라 상수다.

- 면접 답변 요약: "계산할 수 있는 값을 state로 두면 같은 정보를 두 곳에 저장하게 돼서, 원본이 바뀔 때 빠짐없이 맞춰 줘야 하고 놓치면 값이 어긋납니다. useEffect로 동기화하면 틀린 값으로 한 번 렌더링한 뒤 다시 렌더링하는 비효율도 생깁니다. 그래서 React 공식 문서처럼 props나 state로 계산 가능한 값은 렌더링 중에 계산하고, 무거울 때만 useMemo로 캐시합니다. 선택한 항목은 객체 대신 ID만 저장하고, props를 바꿨을 때 상태를 초기화해야 하면 key를 쓰고, 서버 데이터는 state로 복사하지 않고 쿼리 캐시를 그대로 씁니다."

### 관련 질문

- [props와 state에 대해 설명해주세요.](./props-state.md)
- [useMemo와 useCallback에 대해서 설명해주세요.](./use-memo-use-callback.md)
- [useEffect 훅에 대해서 설명해주세요](./use-effect.md)

### 참고

- [You Might Not Need an Effect (React 문서)](https://react.dev/learn/you-might-not-need-an-effect)
