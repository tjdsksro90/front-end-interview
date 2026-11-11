# Q : contrast-color()는 무엇이고, 색 대비(접근성)를 처리할 때 어떻게 쓰나요?

<br />

# A : `contrast-color()`는 배경색을 넣으면 그 위에 올릴 글자색으로 **흰색과 검은색 중 대비가 더 큰 쪽**을 돌려주는 CSS 함수입니다. 버튼이나 태그처럼 배경색이 사용자 설정·테마·데이터에 따라 바뀌는 곳에서, JS로 밝기를 계산하지 않고 CSS 한 줄로 읽을 수 있는 글자색을 고를 수 있습니다. 2026년 4월부터 모든 주요 브라우저에서 쓸 수 있습니다(Baseline 2026). 다만 결과는 흰색이나 검은색 둘 중 하나뿐이고, 중간 밝기 배경에서는 어느 쪽도 충분히 읽기 쉽지 않을 수 있어서 **배경색 자체를 충분히 밝거나 어둡게 고르는 것**이 함께 필요합니다.

### 기본 사용법

```css
button {
  background-color: var(--button-color);
  color: contrast-color(var(--button-color)); /* 배경에 따라 white 또는 black */
}
```

- 인자: 아무 `<color>` 값 (`red`, `#2277d3`, `oklch(...)`, `var(--x)` 등)
- 결과: `white` 또는 `black`. 둘의 대비가 같으면 `white`.
- 어떤 기준으로 대비를 계산하는지는 브라우저가 정한다. 보통 WCAG AA 기준(4.5:1)을 맞추는 쪽을 고르며, 브라우저가 더 나은 알고리즘을 쓸 수도 있다.

### 이전에는 어떻게 했나

```js
// JS로 상대 휘도를 계산해서 글자색을 고르던 방식
function textColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.179 ? '#000' : '#fff';
}
```

- 색이 바뀔 때마다 JS를 실행해야 하고, CSS 변수·`oklch()`·`color-mix()`로 만든 색에는 쓰기 어렵다.
- Sass 같은 전처리기 함수는 **빌드 시점에 정해진 색**만 처리할 수 있다. 런타임에 사용자가 고른 색에는 못 쓴다.
- `contrast-color()`는 브라우저가 **실제 계산된 색**을 보고 고르므로 CSS 변수, 테마 전환에도 그대로 따라간다.

### 이런 곳에 쓴다

| 상황 | 예 |
|---|---|
| 사용자가 색을 고르는 UI | 라벨·태그 색 선택 (GitHub 라벨, 캘린더 일정 색) |
| 테마·브랜드 색이 바뀌는 디자인 시스템 | `--primary`만 바꿔도 버튼 글자색이 자동으로 맞춰짐 |
| 데이터에 따라 배경색이 정해지는 곳 | 차트 범례, 상태 배지 |
| 다크/라이트 모드 | 배경 토큰이 모드마다 바뀌어도 글자색을 따로 정의할 필요가 줄어듦 |

```css
.tag {
  background: var(--tag-color);              /* 사용자가 고른 색 */
  color: contrast-color(var(--tag-color));
  border: 1px solid color-mix(in oklch, var(--tag-color), black 20%);
}
```

### 주의할 점 (접근성)

- **중간 밝기 배경이 문제다.** MDN 예시처럼 `#2277d3` 같은 중간 톤 파랑에서는 검은 글자가 선택되는데, 작은 글씨로는 읽기 어렵다. 4.5:1을 넘겨도 "잘 읽힌다"는 보장은 아니다.
- 그래서 배경색 팔레트를 만들 때 **충분히 밝거나 충분히 어두운 색**을 쓰도록 디자인 단계에서 정해 두는 것이 우선이다. `oklch()`의 밝기(L) 값으로 단계를 나누면 관리하기 쉽다.
- 결과가 흰색·검은색뿐이라 브랜드 색 글자(예: 진한 남색)를 원하면 직접 지정해야 한다.
- 오래된 브라우저 대응이 필요하면 먼저 고정 색을 쓰고, 지원하는 브라우저에서만 덮어쓴다.
  ```css
  .tag { color: #000; }
  @supports (color: contrast-color(red)) {
    .tag { color: contrast-color(var(--tag-color)); }
  }
  ```
- 대비 확인은 여전히 필요하다. 크롬 DevTools의 색상 선택기, Lighthouse 접근성 검사로 실제 대비를 확인한다.

- 면접 답변 요약: "contrast-color()는 배경색을 넣으면 흰색과 검은색 중 대비가 큰 쪽을 돌려주는 CSS 함수입니다. 사용자가 고른 라벨 색이나 테마 색처럼 런타임에 바뀌는 배경에 JS 없이 읽을 수 있는 글자색을 맞출 수 있습니다. 다만 결과가 흑백 두 가지뿐이고 중간 밝기 배경에서는 충분히 읽기 쉽지 않을 수 있어서, 팔레트 자체를 밝거나 어두운 색으로 설계하고 DevTools나 Lighthouse로 대비를 확인합니다."

### 관련 질문

- [그 밖에 알아두면 좋은 최신 CSS 기능에는 어떤 것들이 있나요? (oklch, color-mix, light-dark)](./18-modern-css-etc.md)
- [최근 CSS에 추가된 기능 중 실무에서 많이 쓰는 것에는 어떤 것들이 있나요?](./16-modern-css-core.md)

### 참고

- [contrast-color() (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color)
