# Q : JS 없이 CSS만으로 구현할 수 있게 된 UI 기능에는 어떤 것들이 있나요?

<br />

# A : 화면 전환 애니메이션(View Transitions), 스크롤 연동 애니메이션(Scroll-driven Animations), 팝오버와 위치 지정(Popover API · Anchor Positioning), 나타나고 사라지는 애니메이션(@starting-style), height: auto 애니메이션(interpolate-size)이 있습니다.

### View Transitions

- 화면(DOM)이 바뀔 때 이전 모습과 새 모습을 캡처해서 그 사이를 부드럽게 애니메이션한다.
- 목록 정렬이 바뀔 때 항목이 미끄러지듯 이동하거나, 썸네일이 상세 화면으로 커지는 전환을 만들 수 있다.

```js
// 화면을 바꾸는 코드를 startViewTransition으로 감싼다
document.startViewTransition(() => {
  updateDOM();
});
```

```css
/* 이름을 붙인 요소끼리 이전 위치 → 새 위치로 이어서 움직인다 */
.thumbnail { view-transition-name: hero; }

/* 전환 애니메이션 커스터마이즈 */
::view-transition-old(root),
::view-transition-new(root) { animation-duration: 300ms; }

/* 페이지 이동(MPA)에도 적용 */
@view-transition { navigation: auto; }
```

- React에서는 상태 변경을 `flushSync`로 감싸야 콜백이 끝날 때 DOM이 바뀌어 있다. React 19.3부터는 `<ViewTransition>` 컴포넌트를 쓸 수 있다.

### Scroll-driven Animations

- 애니메이션의 진행을 시간이 아니라 **스크롤 위치**에 연결한다.
- 읽기 진행률 바, 스크롤하면 나타나는 카드 같은 효과를 scroll 이벤트 없이 만든다. 메인 스레드를 쓰지 않아 부드럽다.

```css
/* 페이지 스크롤 진행률 바 */
.progress {
  animation: grow linear;
  animation-timeline: scroll();       /* 스크롤 0% → 100%가 애니메이션 0% → 100% */
}
@keyframes grow { from { scale: 0 1; } to { scale: 1 1; } }

/* 요소가 화면에 들어올 때 나타나기 */
.card {
  animation: fade-in linear both;
  animation-timeline: view();          /* 요소가 화면에 보이는 정도에 연결 */
  animation-range: entry 0% cover 30%;
}
```

- `animation` 단축 속성이 `animation-timeline`을 초기화하므로, `animation-timeline`은 반드시 `animation` 뒤에 쓴다.

### Popover API

- HTML 속성만으로 팝오버(메뉴, 툴팁, 안내창)를 만든다.
- 항상 맨 위 층(top layer)에 떠서 z-index 싸움이 없고, 바깥 클릭·Esc로 닫히는 동작이 기본으로 들어있다.

```html
<button popovertarget="menu">메뉴</button>
<div id="menu" popover>
  <a href="/settings">설정</a>
</div>
```

- `popover="manual"`이면 자동으로 닫히지 않는다. 열린 상태는 `:popover-open`으로 스타일을 줄 수 있다.

### Anchor Positioning

- 어떤 요소(anchor)를 기준으로 다른 요소를 그 옆에 붙인다. 툴팁·드롭다운 위치를 계산하던 Popper, Floating UI 같은 라이브러리의 역할이다.

```css
.btn { anchor-name: --menu-btn; }

.menu {
  position: absolute;
  position-anchor: --menu-btn;
  position-area: bottom;                 /* 버튼 아래에 */
  position-try-fallbacks: flip-block;    /* 아래 공간이 없으면 위로 뒤집기 */
}
```

### `@starting-style` · `transition-behavior: allow-discrete`

- `display: none`에서 보이게 될 때는 원래 트랜지션이 걸리지 않았다. `@starting-style`로 "처음 나타날 때의 시작값"을 지정하면 등장 애니메이션을 CSS만으로 만들 수 있다.

```css
.dialog {
  opacity: 1;
  transition: opacity 0.3s, display 0.3s allow-discrete;
}
.dialog.hidden { display: none; opacity: 0; }

@starting-style {
  .dialog { opacity: 0; }   /* 나타나는 순간 이 값에서 시작 */
}
```

### `interpolate-size` / `calc-size()`

- `height: 0 → auto`는 원래 애니메이션이 되지 않아서 JS로 높이를 재야 했다. 이제 CSS만으로 아코디언을 부드럽게 펼칠 수 있다.

```css
:root { interpolate-size: allow-keywords; }

.panel { height: 0; overflow: hidden; transition: height 0.3s; }
.panel.open { height: auto; }
```

- 아직 모든 브라우저가 지원하지는 않으니, 지원하지 않으면 애니메이션 없이 바로 펼쳐지는 것으로 충분한 곳에 쓴다.
