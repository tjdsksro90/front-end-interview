# Q : 그 밖에 알아두면 좋은 최신 CSS 기능에는 어떤 것들이 있나요?

<br />

# A : 색상 함수(oklch, color-mix, light-dark), 텍스트 줄바꿈(text-wrap), 폼(field-sizing, :user-invalid), 뷰포트 단위(dvh), 타입이 있는 CSS 변수(@property)가 있습니다.

### 색상: `oklch()` · `color-mix()` · 상대 색상 · `light-dark()`

- `oklch(밝기 채도 색상)`: 사람이 느끼는 밝기에 맞춘 색 표현. 밝기 값만 바꿔도 색감이 유지되어 색 단계(50~900)를 만들기 쉽다.
- `color-mix()`: 두 색을 섞는다. hover 색, 투명도 버전을 따로 정의하지 않아도 된다.
- 상대 색상(relative color): 기존 색에서 일부 값만 바꾼 색을 만든다.
- `light-dark()`: 라이트/다크 모드 색을 한 줄로 정의한다. `color-scheme`이 설정되어 있어야 한다.

```css
:root {
  color-scheme: light dark;
  --brand: oklch(60% 0.2 270);
}

.btn {
  background: var(--brand);
  color: light-dark(#111, #fafafa);
}
.btn:hover {
  background: color-mix(in oklch, var(--brand), black 15%);   /* 15% 어둡게 */
}
.badge {
  background: oklch(from var(--brand) l c h / 20%);            /* 같은 색, 투명도 20% */
}
```

### 텍스트: `text-wrap: balance` · `text-wrap: pretty`

- `balance`: 여러 줄 제목의 줄 길이를 비슷하게 맞춘다. (짧은 제목용)
- `pretty`: 본문 마지막 줄에 단어 하나만 남는 것을 피한다.

```css
h1, h2 { text-wrap: balance; }
p { text-wrap: pretty; }
```

### 폼: `field-sizing: content` · `:user-invalid`

- `field-sizing: content`: textarea·input이 입력한 내용만큼 자동으로 커진다. 높이를 JS로 계산하던 코드가 필요 없다.
- `:user-invalid`: 사용자가 입력하고 나서야 잘못된 값으로 표시된다. `:invalid`는 페이지를 열자마자 빈 필수 입력칸이 빨갛게 보이는 문제가 있었다.

```css
textarea { field-sizing: content; min-height: 3lh; }
input:user-invalid { border-color: red; }
```

### 뷰포트 단위: `dvh` · `svh` · `lvh`

- 모바일에서 `100vh`는 주소창이 사라진 상태 기준이라, 주소창이 보일 때 화면 아래가 잘렸다.
- `dvh`는 주소창이 보이거나 숨는 것에 맞춰 바뀌는 높이, `svh`는 가장 작은 높이, `lvh`는 가장 큰 높이다.

```css
.full-screen { height: 100dvh; }
```

### `@property` (타입이 있는 CSS 변수)

- CSS 변수에 타입과 초기값을 지정한다. 타입을 알게 되면 브라우저가 변수 값을 애니메이션할 수 있다. (그라디언트 각도·색 애니메이션 등)

```css
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.spinner {
  background: conic-gradient(from var(--angle), blue, transparent);
  animation: spin 2s linear infinite;
}
@keyframes spin { to { --angle: 360deg; } }
```
