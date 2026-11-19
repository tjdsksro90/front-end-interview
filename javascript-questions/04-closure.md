# Q : 클로저는 정확히 무엇이며, 왜 및 어떻게 사용되나요?

<br />

# A :클로저는 특정함수와 그 함수가 선언될 당시의 렉시컬 환경과의 조합을 뜻합니다. 클로저를 통해 선언된 스코프 밖에서도 해당 스코프에 접근 가능해집니다.

- 자바스크립트 함수는 한번 호출되면 새로운 그 함수의 실행컨텍스트가 생성되고, 그 안에 지역변수는 초기화됩니다.
- 그러나 클로저는 예외적으로 함수가 종료되어도 그 함수의 렉시컬환경을 기억하고 있으므로, 함수가 종료된 이후에도 그 함수 내부의 지역변수에 접근하고 변경할 수 있게됩니다.

```js
const outer = () => {
  const inner = () => {
    /* 은닉화할 로직*/
  };
  return inner;
};
```

### 클로저 사용 이유

**상태를 안전하게 변경하고 이를 유지하기 위해 사용됩니다**

- 전역변수로 선언된 값은 누군가에 의해 언제든지 변경될 수 있어 오류 발생의 근본적인 원인이 될 수 있습니다.
- 그러나 클로저는 함수가 생성될 때 스코프를 기억하므로, 상태를 유지하고 일관된 동작을 보장할 수 있게됩니다.
- 그리고 함수 내부 함수는 외부 사용자가 접근할 수 없도록 캡슐화 됩니다.
  - 이로인해, 데이터를 보호할 수 있으며 코드의 안전성을 보장받을 수 있습니다.

<br />

### React에서의 클로저

React 컴포넌트와 Hook도 클로저 위에서 동작합니다. 위의 "함수가 끝나도 내부 변수를 기억하는" 카운터를 React로 바꾸면 다음과 같습니다.

**1. 순수 JavaScript 클로저**

```js
function createCounter() {
  let count = 0;                 // 밖에서 직접 못 건드림 (은닉)
  return {
    increment: () => ++count,    // count를 기억하는 함수들
    get: () => count,
  };
}

const counter = createCounter();
counter.increment();
counter.get(); // 1
```

**2. React로 바꾸면 (커스텀 Hook)**

```jsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);       // 값은 React가 보관
  const increment = () => setCount((c) => c + 1);    // count를 기억하는 함수
  return { count, increment };
}

function Counter() {
  const { count, increment } = useCounter();
  return <button onClick={increment}>{count}</button>;
}
```

- `createCounter()`가 `useCounter()`로 바뀌었다고 보면 됩니다. 바깥에서는 `increment`로만 값을 바꿀 수 있어서 은닉도 그대로입니다.
- 차이는 **값을 어디에 보관하느냐**입니다. 컴포넌트 함수는 렌더할 때마다 다시 실행되므로, 함수 안의 `let`은 매번 처음 값으로 돌아갑니다. 그래서 값은 `useState`(React가 보관)에 두고, 그 값을 쓰는 함수를 클로저로 만듭니다.
- 화면과 상관없어서 바뀌어도 다시 그릴 필요가 없는 값이라면 `useRef`가 JS 클로저의 `let`에 가장 가깝습니다.

**3. 클로저 때문에 생기는 실수: 오래된 클로저(stale closure)**

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);        // 첫 렌더 때의 count(0)를 계속 기억함 → 1에서 멈춤
      // setCount((c) => c + 1);  // 해결: 최신 값을 인자로 받는 함수형 업데이트
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <p>{count}</p>;
}
```

- 렌더마다 그 렌더의 `count`를 기억하는 새 클로저가 만들어지는데, 의존성 배열이 `[]`인 `useEffect`는 **첫 렌더의 클로저만** 붙잡고 있습니다. 그래서 interval 안의 `count`는 계속 0입니다.
- 해결 방법
  - 함수형 업데이트 `setCount((c) => c + 1)`: 기억한 값 대신 React가 넘겨주는 최신 값을 쓴다.
  - 의존성 배열에 `count`를 넣어 effect를 새 클로저로 다시 만든다. (interval이 매번 다시 설정됨)
  - 최신 값을 `useRef`에 담아 두고 `ref.current`로 읽는다.

- 면접 답변 요약: "React의 커스텀 Hook은 클로저와 같은 구조입니다. 값은 useState에 두고 그 값을 다루는 함수를 돌려줘서, 바깥에서는 정해진 함수로만 상태를 바꿀 수 있습니다. 대신 렌더마다 그 렌더의 값을 기억하는 새 클로저가 만들어져서, useEffect나 setInterval 안에서 오래된 값을 보는 stale closure 문제가 생길 수 있고, 함수형 업데이트나 의존성 배열, useRef로 해결합니다."
