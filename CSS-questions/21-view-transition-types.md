# Q : View Transition API에서 :active-view-transition과 전환 타입(types)은 어떻게 쓰나요?

<br />

# A : `:active-view-transition`은 **뷰 전환이 진행되는 동안에만** 루트(`html`)에 걸리는 가상 클래스이고, `:active-view-transition-type()`은 그중 **특정 타입의 전환일 때만** 걸리는 가상 클래스입니다. 타입은 `document.startViewTransition({ update, types: ['forwards'] })`처럼 전환을 시작할 때 문자열로 붙이고, 페이지 이동(MPA)이면 `@view-transition { types: slide; }`로 붙입니다. 이걸로 "앞으로 갈 땐 왼쪽으로, 뒤로 갈 땐 오른쪽으로 미끄러지게" 같이 **상황마다 다른 전환 애니메이션을 CSS에서 나눠** 정의할 수 있고, 전환 중에만 버튼을 숨기는 것처럼 전환 상태에 맞춘 스타일도 줄 수 있습니다. 두 기능 모두 지금은 모든 주요 브라우저에서 쓸 수 있습니다(`:active-view-transition`은 Baseline 2025, `:active-view-transition-type()`은 Baseline 2026).

### 먼저, View Transition의 흐름

```js
const transition = document.startViewTransition(() => {
  updateDOM(); // 1. 현재 화면을 캡처한 뒤 이 콜백으로 DOM을 바꾼다
});
// 2. 바뀐 화면을 캡처하고, ::view-transition-old / new 사이를 애니메이션한다
```

- 콜백이 Promise를 반환하면, 그 Promise가 끝난 다음 프레임에 전환이 시작된다. reject되면 전환은 취소된다.
- 반환되는 `ViewTransition` 객체로 전환의 단계를 알 수 있다.

| 속성·메서드 | 언제 |
|---|---|
| `updateCallbackDone` | DOM을 바꾸는 콜백이 끝났을 때 resolve |
| `ready` | 가상 요소 트리가 만들어지고 애니메이션이 막 시작할 때 resolve. JS로 직접 애니메이션을 걸 때 쓴다 |
| `finished` | 애니메이션이 끝나고 새 화면을 사용할 수 있을 때 resolve |
| `types` | 이 전환에 붙은 타입 목록. 전환 중에 추가·삭제할 수 있다 |
| `skipTransition()` | 애니메이션만 건너뛴다. DOM을 바꾸는 콜백은 그대로 실행된다 |

### :active-view-transition — 전환 중에만 적용할 스타일

```css
/* 전환이 진행되는 동안에만 */
:root:active-view-transition button {
  visibility: hidden;   /* 전환 중 버튼 숨기기 */
}
```

- 루트 요소에 걸리고, 전환이 끝나면 더 이상 매칭되지 않는다.
- 예전에는 JS로 전환 시작 시 `html`에 클래스를 붙이고 `finished` 후에 떼야 했다. 이제 CSS만으로 된다.
- 쓰임새: 전환 중 클릭 막기(`pointer-events: none`), 스크롤바·툴팁 숨기기, 전환 중에만 보이는 안내 표시.

### 전환 타입(types) — 상황마다 다른 애니메이션

```js
// 같은 페이지(SPA): 시작할 때 types로 붙인다
function go(direction) {
  document.startViewTransition({
    update: () => renderPage(),
    types: [direction], // 'forwards' 또는 'backwards'
  });
}
```

```css
/* 타입별로 다른 애니메이션 */
html:active-view-transition-type(forwards) {
  &::view-transition-old(root) { animation-name: slide-out-to-left; }
  &::view-transition-new(root) { animation-name: slide-in-from-right; }
}
html:active-view-transition-type(backwards) {
  &::view-transition-old(root) { animation-name: slide-out-to-right; }
  &::view-transition-new(root) { animation-name: slide-in-from-left; }
}
```

- 쉼표로 여러 개를 쓰면 **OR**: `:active-view-transition-type(forwards, backwards)`는 둘 중 하나면 매칭.
- 이어 쓰면 **AND**: `:active-view-transition-type(slide):active-view-transition-type(forwards)`는 둘 다일 때만.
- 타입을 붙이는 방법은 세 가지다.
  1. `startViewTransition({ types })` — 같은 문서 안 전환
  2. `@view-transition { types: ... }` — 페이지 이동(교차 문서) 전환
  3. `transition.types.add('...')` — 전환 중에 JS로 추가·삭제

### 페이지 이동(MPA)에도 적용: @view-transition

```css
/* 이동 전·후 두 페이지 모두에 넣는다 */
@view-transition {
  navigation: auto;
  types: slide;
}
```

- 같은 출처(same-origin)끼리의 이동이어야 하고, 중간에 다른 출처로 리다이렉트되면 안 된다.
- 링크 클릭 같은 **페이지 안의 사용자 동작**으로 시작된 이동(push/replace)과 뒤로/앞으로 가기(traverse)에 적용된다. 주소창 입력 같은 브라우저 UI로 시작한 이동에는 적용되지 않는다.
- `@view-transition` 자체는 아직 일부 브라우저에서 지원하지 않는다(MDN 기준 "Limited availability"). 지원하지 않으면 전환 없이 그냥 이동하므로 점진적 향상으로 쓰면 된다.
- 이전 페이지에서는 `pageswap`, 새 페이지에서는 `pagereveal` 이벤트로 전환 객체에 접근해 타입을 정할 수도 있다.

### 실무에서 자주 쓰는 패턴

| 상황 | 방법 |
|---|---|
| 슬라이드·탭의 이전/다음 | `types: ['forwards']` / `['backwards']`로 방향별 슬라이드 |
| 목록 → 상세 / 상세 → 목록 | 타입으로 "확대"와 "축소" 애니메이션 나누기 |
| 테마 전환(다크 모드) | 타입 `theme`일 때만 원형으로 퍼지는 `clip-path` 애니메이션 |
| 전환 중 이중 클릭 방지 | `:root:active-view-transition { pointer-events: none; }` |
| 모션 줄이기 설정 | `@media (prefers-reduced-motion: reduce)`에서 애니메이션 끄기 |

- 면접 답변 요약: "`:active-view-transition`은 뷰 전환이 진행되는 동안에만 루트에 걸리는 가상 클래스라서, 전환 중 버튼을 숨기거나 클릭을 막는 스타일을 JS 없이 줄 수 있습니다. 전환 타입은 startViewTransition의 types 옵션이나 @view-transition의 types로 붙이고, `:active-view-transition-type(forwards)`처럼 타입별로 다른 애니메이션을 CSS에서 나눠 정의합니다. 그래서 앞으로/뒤로, 확대/축소처럼 같은 전환 코드에서 방향에 맞는 애니메이션을 고를 수 있습니다."

### 관련 질문

- [JS 없이 CSS만으로 구현할 수 있게 된 UI 기능에는 어떤 것들이 있나요? (View Transitions 기본)](./17-modern-css-ui.md)

### 참고

- [View Transition API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- [Document.startViewTransition() (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [ViewTransition (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition)
- [:active-view-transition (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/:active-view-transition)
- [:active-view-transition-type() (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active-view-transition-type)
- [@view-transition (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@view-transition)
