# Q : 개발 모드에서 useEffect가 두 번 실행되는 이유는 무엇이고, 어떻게 대응해야 하나요?

<br />

# A : `<StrictMode>`로 감싼 앱은 **개발 모드에서만** 컴포넌트를 처음 마운트한 직후 **한 번 언마운트했다가 다시 마운트**합니다. 그래서 Effect가 "setup → cleanup → setup" 순서로 실행되고, 콘솔 로그나 네트워크 요청이 두 번 보입니다. 이것은 버그가 아니라 **cleanup을 빠뜨린 Effect를 일부러 드러내기 위한 검사**입니다. 사용자가 화면을 나갔다가 돌아오는 상황을 미리 흉내 내서, 구독이 쌓이거나 연결이 두 개 열리는 문제를 개발 중에 찾게 해 줍니다. 대응 방법은 두 번 실행을 막는 것이 아니라 **cleanup을 제대로 작성해서, 한 번 실행한 것과 setup → cleanup → setup이 사용자 입장에서 구분되지 않게** 만드는 것입니다. 배포(production) 빌드에서는 한 번만 실행됩니다.

### StrictMode가 개발 모드에서 하는 일

| 검사 | 무엇을 찾나 |
|---|---|
| 렌더링 함수를 한 번 더 호출 | 렌더 중에 외부 값을 바꾸는 순수하지 않은 코드 |
| Effect를 setup + cleanup 한 번 더 | **cleanup을 빠뜨린 Effect** |
| ref 콜백을 setup + cleanup 한 번 더 | cleanup을 빠뜨린 ref 콜백 |
| 오래된 API 사용 확인 | `UNSAFE_` 클래스 생명주기 메서드 등 |

- 컴포넌트 함수 본문, `useState`·`useMemo`·`useReducer`에 넘긴 함수도 두 번 호출된다.
- 모든 검사는 개발 모드에서만 동작하고 **배포 빌드에는 영향이 없다.** 공식 문서는 이 검사가 새 버그를 만드는 게 아니라 이미 있던 버그를 찾아 준다고 설명한다.

### 두 번 실행되면서 드러나는 버그

```jsx
// cleanup 없음: 개발 모드에서 연결이 2개 열린 채로 남는다
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
}, [roomId]);

// cleanup 있음: connect → disconnect → connect, 열린 연결은 항상 1개
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

- cleanup이 없으면 개발 모드에서 연결이 두 개가 된다. 개발 모드에서만 그런 게 아니라 **사용자가 화면을 나갔다 돌아오거나 `roomId`가 바뀔 때마다 연결이 쌓이는** 진짜 버그다. StrictMode가 그걸 처음부터 보여 줄 뿐이다.

### 종류별 cleanup

| Effect | cleanup |
|---|---|
| 이벤트 구독 | `return () => window.removeEventListener('scroll', handleScroll);` |
| 연결 (WebSocket, 채팅) | `return () => connection.disconnect();` |
| 타이머 | `return () => clearInterval(id);` |
| 데이터 요청 | `ignore` 플래그를 켜거나 `AbortController`로 취소 |
| 애니메이션 | 처음 값으로 되돌리기 (`node.style.opacity = 0`) |
| 모달 열기 (`dialog.showModal()`) | `return () => dialog.close();` |

- 데이터 요청은 개발 모드에서 네트워크 탭에 요청이 두 번 보이는 것이 정상이다. 첫 요청의 결과는 cleanup에서 무시되거나 취소된다.

### 하지 말아야 할 대응

```jsx
// X: ref로 "한 번만 실행"하게 막기
const didRun = useRef(false);
useEffect(() => {
  if (didRun.current) return;
  didRun.current = true;
  connection.connect();
}, []);
```

- 공식 문서는 **ref로 Effect 실행을 막지 말라**고 한다. 개발 모드의 두 번 실행만 가릴 뿐, 화면을 나갔다 돌아올 때 연결이 쌓이는 문제는 그대로 남는다.
- StrictMode를 끄는 것도 가능하지만 권하지 않는다.

### 두 번 실행되면 안 되는 일은 Effect가 아니다

| 작업 | 어디에 두나 |
|---|---|
| 상품 구매, 주문, 결제 요청 | **이벤트 핸들러** (버튼 클릭). 화면이 보였다는 이유로 실행되면 안 된다 |
| 앱 전체에서 한 번만 하는 초기화 | 컴포넌트 밖 모듈 최상단, 또는 최상위 `didInit` 변수 |
| 페이지 방문 분석 로그 | Effect에 둬도 된다. 개발 모드에서 두 번 찍히는 건 무시하거나 개발 모드에서는 보내지 않는다 |

- 공식 문서의 기준: Effect는 **"컴포넌트가 화면에 보였기 때문에" 실행되어야 하는 코드**에만 쓴다. 사용자의 특정 행동 때문에 일어나는 일은 이벤트 핸들러에 둔다.

- 면접 답변 요약: "StrictMode는 개발 모드에서 컴포넌트를 마운트한 직후 한 번 언마운트하고 다시 마운트해서, Effect가 setup, cleanup, setup 순서로 실행됩니다. cleanup을 빠뜨린 Effect를 찾기 위한 의도된 검사이고, 배포 빌드에서는 한 번만 실행됩니다. 대응은 ref로 두 번 실행을 막는 게 아니라, 구독 해제, 연결 끊기, 타이머 정리, 요청 무시나 취소 같은 cleanup을 작성해서 한 번 실행한 것과 사용자 입장에서 차이가 없게 만드는 것입니다. 구매처럼 두 번 일어나면 안 되는 작업은 애초에 Effect가 아니라 이벤트 핸들러에 둡니다."

### 관련 질문

- [useEffect 안의 비동기 요청이 언마운트된 뒤나 값이 바뀐 뒤에 끝나면 어떤 문제가 생기고, 어떻게 막나요?](./effect-async-cleanup.md)
- [useEffect 훅에 대해서 설명해주세요](./use-effect.md)
- [React는 버전별로 무엇이 바뀌었나요? (16.8 · 17 · 18 · 19)](./react-versions.md)

### 참고

- [Synchronizing with Effects (React 문서)](https://react.dev/learn/synchronizing-with-effects)
- [StrictMode (React 문서)](https://react.dev/reference/react/StrictMode)
- [You Might Not Need an Effect (React 문서)](https://react.dev/learn/you-might-not-need-an-effect)
