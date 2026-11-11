# Q : CSS shape() 함수는 무엇이고 path()·polygon()과 어떻게 다른가요?

<br />

# A : `shape()`는 `clip-path`, `offset-path` 등에 쓰는 도형 함수로, SVG `path()`처럼 직선·곡선·호를 이어 **자유로운 도형**을 그리지만 SVG 문법(`M 0 0 L 10 10`) 대신 **CSS 문법**(`from 0 0, line to 10px 10px`)을 씁니다. 가장 큰 차이는 단위입니다. `path()`는 px만 쓸 수 있어서 요소 크기가 바뀌면 도형이 따라 늘어나지 않지만, `shape()`는 `%`, `rem`, `em`, `calc()`, CSS 변수를 쓸 수 있어 **반응형 도형**을 만들 수 있습니다. `polygon()`도 %를 쓸 수 있지만 직선만 되고, `shape()`는 곡선(`curve`, `smooth`)과 호(`arc`)까지 됩니다. 2026년 2월부터 모든 주요 브라우저에서 쓸 수 있습니다(Baseline 2026).

### 기본 문법

```css
.box {
  clip-path: shape(
    from 0% 0%,              /* 시작점 (요소의 왼쪽 위 기준) */
    line to 100% 0%,         /* 오른쪽 위까지 직선 */
    line to 100% 80%,
    curve to 0% 80% with 50% 100%,  /* 아래쪽을 볼록한 곡선으로 */
    close                    /* 시작점으로 닫기 */
  );
}
```

| 명령 | 하는 일 |
|---|---|
| `from x y` | 시작점. 맨 앞에 한 번, 뒤에 쉼표 |
| `move to/by x y` | 선을 그리지 않고 위치만 옮김 |
| `line to/by x y` | 직선 |
| `hline to/by x` · `vline to/by y` | 가로선 · 세로선 |
| `curve to/by x y with c1 [/ c2]` | 베지어 곡선. 제어점 1개면 2차, 2개면 3차 |
| `smooth to/by x y [with c]` | 앞 곡선과 매끄럽게 이어지는 곡선 |
| `arc to/by x y of r [r2] [cw/ccw] [small/large] [rotate 각도]` | 원호. 기본은 `ccw`, `small`, `rotate 0deg` |
| `close` | 시작점까지 직선으로 닫기 |

- `to`는 요소 왼쪽 위 기준의 **절대 좌표**, `by`는 직전 점 기준의 **상대 좌표**.
- %는 기준 박스(reference box)의 너비·높이에 대한 비율이다.
- 맨 앞에 `nonzero`(기본) 또는 `evenodd`로 채우기 규칙을 줄 수 있다. 단 `offset-path`에서는 쓰면 안 된다(속성 전체가 무효가 된다).

### path() · polygon()과 비교

```css
/* path(): SVG 문법, px만 → 요소가 커져도 도형은 그대로 */
clip-path: path("M 0 0 L 300 0 L 300 160 Q 150 200 0 160 Z");

/* polygon(): % 가능하지만 직선만 */
clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 50% 100%, 0% 80%);

/* shape(): % 가능 + 곡선 */
clip-path: shape(from 0% 0%, line to 100% 0%, line to 100% 80%,
                 curve to 0% 80% with 50% 100%, close);
```

| | `polygon()` | `path()` | `shape()` |
|---|---|---|---|
| 문법 | CSS 좌표 목록 | SVG path 문자열 | CSS 명령 목록 |
| 단위 | %, px, rem 등 | **px만** | %, px, rem, em 등 |
| `calc()`·CSS 변수 | 가능 | 불가 (문자열이라) | 가능 |
| 곡선·호 | 불가 | 가능 | 가능 |
| 반응형 | 가능 | 어려움 | 가능 |

### 이런 곳에 쓴다

- **섹션 경계의 물결·사선**: 히어로 영역 아래쪽을 곡선으로 자르기. 너비가 바뀌어도 곡선이 같이 늘어난다.
- **말풍선·태그·화살표 버튼**: `calc(100% - 12px)`처럼 "끝에서 12px" 같은 고정 크기 꼬리를 섞을 수 있다.
- **`offset-path` 이동 경로**: 요소가 화면 크기에 맞춘 곡선 경로를 따라 움직이게.
- **CSS 변수로 조절하는 도형**: `--wave: 20%`만 바꿔 물결 깊이를 조절.

```css
/* 오른쪽 끝이 화살표인 태그: 화살표 크기는 항상 12px */
.tag {
  clip-path: shape(
    from 0% 0%,
    hline to calc(100% - 12px),
    line to 100% 50%,
    line to calc(100% - 12px) 100%,
    hline to 0%,
    close
  );
}
```

### 애니메이션

```css
.hero { clip-path: shape(from 0% 0%, hline to 100%, vline to 85%, curve to 0% 85% with 50% 100%, close); transition: clip-path .4s; }
.hero:hover { clip-path: shape(from 0% 0%, hline to 100%, vline to 85%, curve to 0% 85% with 50% 70%, close); }
```

- **명령의 개수와 종류가 같으면** 각 좌표가 부드럽게 보간된다. 단위가 달라도(`%` ↔ `px`) `calc()`로 섞여서 보간된다.
- 명령 종류(`line` ↔ `curve`)나 개수, `to` ↔ `by`가 다르면 중간 없이 **한 번에 바뀐다**(Chrome 152에서 확인).
- 그래서 모양을 애니메이션할 도형들은 **같은 명령 구조**로 맞춰서 만든다.

### 주의할 점

- 아직 새 기능이라 오래된 브라우저 대응이 필요하면 `@supports`로 감싸고 `polygon()`을 기본값으로 둔다.
  ```css
  .hero { clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%); }
  @supports (clip-path: shape(from 0 0, line to 1px 1px)) {
    .hero { clip-path: shape(from 0% 0%, hline to 100%, vline to 85%, curve to 0% 85% with 50% 100%, close); }
  }
  ```
- `clip-path`는 잘린 바깥 영역에서 클릭·hover도 받지 않는다. 그림자(`box-shadow`)도 함께 잘린다. 그림자가 필요하면 부모에 `filter: drop-shadow()`를 준다.

- 면접 답변 요약: "shape()는 clip-path나 offset-path에 쓰는 도형 함수로, path()처럼 직선·곡선·호를 그리지만 SVG 문자열 대신 CSS 문법을 씁니다. path()는 px만 쓸 수 있어 요소 크기에 따라 늘어나지 않는데, shape()는 %·rem·calc()·CSS 변수를 쓸 수 있어 반응형 도형을 만들 수 있습니다. polygon()은 %는 되지만 직선만 됩니다. 명령 구조가 같은 도형끼리는 transition으로 부드럽게 애니메이션할 수 있습니다."

### 관련 질문

- [그 밖에 알아두면 좋은 최신 CSS 기능에는 어떤 것들이 있나요?](./18-modern-css-etc.md)
- [JS 없이 CSS만으로 구현할 수 있게 된 UI 기능에는 어떤 것들이 있나요?](./17-modern-css-ui.md)

### 참고

- [shape() (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/basic-shape/shape)
