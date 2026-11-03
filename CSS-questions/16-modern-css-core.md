# Q : 최근 CSS에 추가된 기능 중 실무에서 많이 쓰는 것에는 어떤 것들이 있나요?

<br />

# A : Container Queries, :has(), CSS Nesting, Cascade Layers, Subgrid가 대표적입니다. 예전에는 JS나 Sass 같은 도구가 필요했던 일을 CSS만으로 할 수 있게 해줍니다.

### Container Queries (`@container`)

- 화면(viewport) 크기가 아니라 **부모 요소의 크기**에 따라 스타일을 바꾼다.
- 같은 카드 컴포넌트가 넓은 본문에서는 가로형, 좁은 사이드바에서는 세로형으로 바뀌게 할 수 있다. 미디어 쿼리로는 화면 크기만 알 수 있어서 이걸 할 수 없었다.

```css
.card-wrap {
  container-type: inline-size; /* 이 요소의 가로 크기를 기준으로 삼는다 */
  container-name: card;
}

@container card (min-width: 400px) {
  .card { display: flex; gap: 16px; }
}
```

- `cqi`, `cqw` 단위로 컨테이너 크기에 비례한 값도 쓸 수 있다. (`font-size: 5cqi`)

### `:has()` (부모 선택자)

- "이런 자식(또는 뒤 형제)을 가진 요소"를 선택한다.
- 체크박스가 체크된 카드 강조하기, 입력값이 잘못된 폼에 빨간 테두리 주기처럼, 예전에는 JS로 부모에 클래스를 붙여야 했던 일을 CSS만으로 할 수 있다.

```css
.card:has(img) { padding: 0; }                  /* 이미지가 있는 카드 */
.option:has(input:checked) { border-color: blue; } /* 체크된 옵션 */
form:has(:invalid) button { opacity: 0.5; }     /* 잘못된 입력이 있는 폼 */
h2:has(+ p) { margin-bottom: 4px; }             /* 바로 뒤에 p가 오는 h2 */
```

### CSS Nesting

- Sass처럼 선택자를 중첩해서 쓴다. `&`는 바깥 선택자를 가리킨다.

```css
.card {
  padding: 16px;

  & .title { font-weight: bold; }
  &:hover { background: #f5f5f5; }

  @media (width < 600px) {
    padding: 8px;
  }
}
```

- 전처리기 없이 브라우저가 바로 이해한다. 다만 너무 깊게 중첩하면 선택자 우선순위가 높아지고 읽기 어려워지니 2~3단계 정도로.

### Cascade Layers (`@layer`)

- 스타일을 층으로 나누고 **층의 순서로 우선순위를 정한다.** 선택자 우선순위(specificity)보다 층의 순서가 먼저 적용된다.
- 라이브러리 CSS를 덮어쓰려고 선택자를 길게 쓰거나 `!important`를 붙이던 문제를 해결한다.

```css
/* 뒤에 선언한 층이 이긴다 */
@layer reset, library, components, utilities;

@layer library {
  #app .btn.primary { background: gray; }  /* 선택자가 강해도 */
}
@layer components {
  .btn { background: blue; }               /* 뒤 층이 이긴다 → blue */
}
```

- 층에 넣지 않은 스타일은 모든 층보다 우선한다.

### Subgrid

- 자식 요소의 그리드가 부모 그리드의 줄(행·열)을 그대로 이어받는다.
- 카드 목록에서 카드마다 제목 길이가 달라도 제목·본문·버튼 위치를 카드끼리 맞출 수 있다. 예전에는 높이를 JS로 계산하거나 고정했다.

```css
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.card {
  display: grid;
  grid-row: span 3;                 /* 제목, 본문, 버튼 3줄 */
  grid-template-rows: subgrid;      /* 부모의 행을 이어받아 카드끼리 줄이 맞는다 */
}
```
