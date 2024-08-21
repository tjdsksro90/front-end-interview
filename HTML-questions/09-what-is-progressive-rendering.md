# Q : 프로그레시브 렌더링(Progressive Rendering)이란 무엇인가요?

<br />

# A :

**프로그레시브 렌더링이란**

- 웹 페이지를 점진적으로 렌더링하는 기법을 뜻합니다.
  - 이러한 방식은 사용자가 웹 페이지를 더욱 빠르게 볼 수 있게 해주며, 규모가 큰 페이지일 수록 더 유용합니다
- 프로그레시브 렌더링의 핵심아이디어는 중요한 콘텐츠를 우선적으로 로드하고 렌더링하는 것입니다
  - 예를 들어, 사용자가 스크롤을 내릴 때까지 보이지 않는 콘텐츠는 나중에 로드되고 렌더링되어야 합니다
  - 이러한 방식은 네트워크 대역폭을 효과적으로 활용하고, 사용자에게 빠른 반응성을 제공하게 됩니다.

**프로그레시브 렌더링을 구현하는 방법들은 대표적으로 3가지가 존재합니다**

1. 이미지 레이지 로딩

   - 이 기법은 페이지 로드 시점에 필요하지 않은 이미지의 로딩을 지연시키는 방법입니다.
   - 이로인해 초기페이지에는 안쓰이는 이미지는 로드하지않게 되므로, 초기 페이지 로드시간을 단축시킬 수 있게 됩니다.

2. 지연 로딩(Prority Loading)

   - 이 기법은 중요한 `CSS`와 `JavaScript` 파일을 먼저 로드하고 그 다음으로 나머지를 로드하는 방식입니다

3. 비동기 로딩(Asynchronous Loading)
   - `JavaScript`와 같은 블록 리소스를 비동기적으로 로드해 페이지 렌더링을 차단하지 않는 방법입니다