# Q : React는 버전별로 무엇이 바뀌었나요? (16.8 · 17 · 18 · 19)

<br />

# A : 16.8에서 Hooks로 작성 방식이 바뀌었고, 17은 새 기능 없이 업그레이드를 쉽게 하는 버전이었고, 18에서 동시성 렌더링, 19에서 Actions와 Server Components가 들어왔습니다.

### React 16.8 (2019.02) : Hooks

- 함수 컴포넌트에서 `useState`, `useEffect` 등으로 상태와 생명주기를 다룰 수 있게 됐다.
- 클래스 컴포넌트의 `this`, 생명주기 메서드, HOC 대신 **커스텀 훅으로 로직을 재사용**한다.

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = count; }, [count]);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### React 17 (2020.10) : 새 기능 없는 디딤돌

- **새 JSX 변환**: JSX를 쓰는 파일마다 `import React from 'react'`를 하지 않아도 된다.
- **이벤트 위임 위치 변경**: `document`가 아니라 앱의 root 요소에 이벤트를 단다. 한 페이지에서 여러 React 버전이 섞여도 충돌하지 않는다.
- 이벤트 풀링 제거. 점진적으로 업그레이드할 수 있게 하는 것이 목적이었다.

### React 18 (2022.03) : 동시성 렌더링

- **`createRoot`**: 새 루트 API. 이걸 써야 18의 기능이 켜진다.
- **자동 배칭(Automatic Batching)**: `setTimeout`, `Promise` 안의 여러 `setState`도 한 번의 렌더로 묶는다. (17은 React 이벤트 핸들러 안에서만 묶었다)
- **`useTransition` / `useDeferredValue`**: 급하지 않은 업데이트를 뒤로 미뤄, 입력 같은 급한 업데이트를 먼저 처리한다.
- **Suspense 스트리밍 SSR**: 서버가 준비된 HTML부터 먼저 보내고, 느린 부분은 나중에 채운다.
- 새 훅: `useId`, `useSyncExternalStore`, `useInsertionEffect`
- 개발 모드 StrictMode에서 effect가 두 번 실행된다. (cleanup을 빠뜨린 버그를 찾기 위함)

```jsx
// 17
ReactDOM.render(<App />, root);
// 18
createRoot(root).render(<App />);
```

### React 19 (2024.12) : Actions · Server Components

- **Actions**: 폼 제출 같은 비동기 작업의 대기 상태, 에러, 낙관적 업데이트를 React가 관리한다.
  - `useActionState`: 액션의 결과와 `isPending`을 함께 관리
  - `useFormStatus`: 자식 컴포넌트에서 부모 form의 제출 중 여부를 읽음
  - `useOptimistic`: 서버 응답 전에 화면을 먼저 바꾸고, 실패하면 되돌림
  - `<form action={fn}>`: onSubmit 대신 함수를 바로 넘김
- **`use()`**: 렌더 중에 Promise나 Context를 읽는다. 조건문 안에서도 호출할 수 있다.
- **ref를 일반 prop으로**: `forwardRef` 없이 `ref`를 props로 받는다.
- **Server Components / Server Actions 정식**: Next.js App Router의 기반.
- `<title>`, `<meta>`를 컴포넌트 안에 쓰면 `<head>`로 올려준다.
- 삭제: `ReactDOM.render`, 문자열 ref, 함수 컴포넌트의 `propTypes`·`defaultProps`

```jsx
const [error, submitAction, isPending] = useActionState(async (prev, formData) => {
  const res = await updateName(formData.get('name'));
  return res.error ?? null;
}, null);

<form action={submitAction}>
  <input name="name" />
  <button disabled={isPending}>저장</button>
</form>
```

### 그 이후

- **19.1 (2025.03)**: Owner Stack (에러가 난 컴포넌트를 누가 렌더했는지 보여줌)
- **19.2 (2025.10)**: `<Activity>`(숨겨도 state 유지), `useEffectEvent`
- **React Compiler 1.0 (2025.10)**: 빌드 시점에 자동으로 메모이제이션. React 버전이 아니라 별도 빌드 도구다.
- **19.3 (2026.09)**: `<ViewTransition>` (화면 전환 애니메이션)
