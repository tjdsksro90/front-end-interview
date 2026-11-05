# Q : :is(), :where(), :has(), :not()은 각각 무엇이고 어떻게 다른가요?

<br />

# A : 넷 다 괄호 안에 선택자 목록을 받는 가상 클래스입니다. :is()와 :where()는 "이 중 하나라도 맞으면" 선택하고, :not()은 "이것이 아니면", :has()는 "이런 자식(또는 뒤 형제)을 가지면" 선택합니다. 가장 중요한 차이는 우선순위입니다. :where()만 항상 0이고, 나머지는 괄호 안에서 가장 높은 선택자의 우선순위를 따릅니다.

### 한눈에 비교

| | 뜻 | 우선순위 | 대표 쓰임 |
|---|---|---|---|
| `:is(A, B)` | A 또는 B인 요소 | 괄호 안 **가장 높은 값** | 긴 선택자 묶기 |
| `:where(A, B)` | A 또는 B인 요소 | **항상 0** | 리셋·기본 스타일 (덮어쓰기 쉽게) |
| `:not(A, B)` | A도 B도 아닌 요소 | 괄호 안 **가장 높은 값** | 예외 빼기 |
| `:has(A)` | A를 자식(또는 뒤 형제)으로 가진 요소 | 괄호 안 **가장 높은 값** | 자식 상태로 부모 꾸미기 |

### :is() — 반복되는 선택자를 묶는다

```css
/* 예전 */
header a:hover, main a:hover, footer a:hover { color: blue; }

/* :is() */
:is(header, main, footer) a:hover { color: blue; }
```

- 괄호 안에 틀린 선택자가 있어도 나머지는 동작한다(관대한 선택자 목록). 일반 쉼표 목록은 하나만 틀려도 규칙 전체가 무시된다.
- 주의: `:is(#app, p)`의 우선순위는 `#app` 기준인 (1, 0, 0)이다. `p`에 맞아서 선택되어도 id만큼 강해진다.

### :where() — 우선순위 0으로 묶는다

```css
/* 라이브러리·리셋 CSS: 사용자가 클래스 하나로 덮어쓸 수 있다 */
:where(ul, ol)[role='list'] { list-style: none; padding: 0; }
:where(.btn) { padding: 8px 16px; background: gray; }

/* 사용자 코드 */
.my-button { background: royalblue; }   /* (0, 1, 0) > (0, 0, 0) → 이긴다 */
```

- `:is()`와 고르는 요소는 같고 우선순위만 다르다.
- 기본값을 주되 **쉽게 덮어쓸 수 있어야 하는** 스타일(리셋, 디자인 시스템 기본값)에 쓴다.

### :not() — 예외를 뺀다

```css
li:not(:last-child) { border-bottom: 1px solid #eee; }   /* 마지막 항목만 구분선 없이 */
button:not(:disabled):hover { background: #eee; }        /* 비활성 버튼은 hover 효과 없음 */
a:not(.active, .disabled) { opacity: 0.7; }              /* 여러 개를 한 번에 제외 (Level 4) */
```

- 예전에는 괄호 안에 단순 선택자 하나만 쓸 수 있었지만, 지금은 목록과 복합 선택자(`:not(.a .b)`)도 된다.
- 우선순위가 올라간다. `:not(#x)`는 (1, 0, 0)이다. 우선순위를 높이지 않으려면 `:not(:where(...))`처럼 감싼다.

### :has() — 자식 상태로 부모를 고른다

```css
.card:has(img) { padding: 0; }                       /* 이미지가 있는 카드 */
.option:has(input:checked) { border-color: blue; }   /* 체크된 옵션 */
form:has(:user-invalid) button { opacity: 0.5; }     /* 잘못 입력된 칸이 있는 폼 */
.list:not(:has(li)) { display: none; }               /* :not과 함께: 빈 목록 숨기기 */
```

- CSS는 원래 아래 방향으로만 선택할 수 있었는데, `:has()`로 부모·앞 형제를 고를 수 있게 됐다.
- `:has()` 안에 `:has()`는 쓸 수 없다. `body:has(...)`처럼 넓은 범위에 자주 바뀌는 조건은 성능에 주의한다.

### 브라우저 지원

- `:is()`, `:where()`, `:not()` 목록: 2021년부터 주요 브라우저 지원
- `:has()`: 2023년 12월(Firefox 121)부터 주요 브라우저 지원

### 관련 질문

- [CSS 선택자의 우선순위란 무엇이며 어떻게 작동하나요?](./01-specificity.md)
- [브라우저가 CSS 선택자와 일치하는 요소를 어떻게 결정하는지 설명해주세요.](./13-css-selector.md)
- [최근 CSS에 추가된 기능 중 실무에서 많이 쓰는 것에는 어떤 것들이 있나요?](./16-modern-css-core.md)
