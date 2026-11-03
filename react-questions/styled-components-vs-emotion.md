# Q : styled-components와 Emotion은 무엇이 다른가요?

<br />

# A : 둘 다 JS 안에서 CSS를 쓰고 실행 중(런타임)에 클래스를 만들어 넣는 CSS-in-JS 라이브러리라 동작 원리는 거의 같습니다. 차이는 쓰는 방법입니다. styled-components는 `styled` API 하나에 집중하고, Emotion은 `styled`와 함께 `css` prop을 지원해 더 유연합니다.

### 공통점

- 템플릿 리터럴이나 객체로 CSS를 쓰고, props나 theme에 따라 스타일을 바꿀 수 있다.
- 실행 중에 CSS 문자열을 해시해서 클래스 이름(`sc-abc123`, `css-1x9f2a`)을 만들고, `<style>` 태그에 넣는다.
- `ThemeProvider`로 테마를 내려주고, 컴포넌트에서 `props.theme`으로 읽는다.
- 둘 다 **런타임 비용**이 있고, React Server Components(서버 컴포넌트)에서는 쓸 수 없어 `'use client'` 컴포넌트에서만 동작한다.

### 차이점

| | styled-components | Emotion |
|---|---|---|
| 작성 방식 | `styled.button` 중심 | `styled`(@emotion/styled) + **`css` prop**(@emotion/react) |
| 컴포넌트를 안 만들고 바로 스타일 | 어려움 (컴포넌트로 만들어야 함) | ``<div css={css`...`}>``로 바로 가능 |
| 스타일 합치기 | `css` 헬퍼, 상속(`styled(Button)`) | `css={[base, active && activeStyle]}` 배열로 간단히 |
| DOM으로 props 전달 막기 | `$` 붙인 transient props(`$active`) | 유효한 HTML 속성만 자동 전달, `shouldForwardProp`로 조절 |
| 기본 속성 지정 | `.attrs()` | 없음 (컴포넌트에서 직접) |
| 크기 | 조금 더 큼 | 조금 더 작음 |
| 많이 쓰는 곳 | 독립적으로 쓰던 프로젝트 | MUI, Chakra UI 같은 UI 라이브러리의 기반 |
| 현재 상태 | 2025년 유지보수 모드 전환 (새 기능 개발 중단) | 유지보수 위주, 큰 신기능 없음 |

```jsx
// styled-components
import styled from 'styled-components';

const Button = styled.button`
  padding: 8px 16px;
  background: ${({ $primary }) => ($primary ? 'royalblue' : 'white')};
`;
<Button $primary>저장</Button>

// Emotion: styled는 거의 같고
import styled from '@emotion/styled';
const Button = styled.button`...`;

// css prop으로 컴포넌트 없이 바로 쓸 수도 있다
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

<button css={css`padding: 8px 16px; background: royalblue;`}>저장</button>
```

### 그래서 무엇을 고르나?

- **기존 프로젝트가 쓰는 쪽**을 그대로 쓴다. 둘을 바꾸는 이득은 크지 않다.
- MUI를 쓴다면 이미 Emotion이 들어 있으므로 **Emotion**이 자연스럽다.
- **새 프로젝트**라면 둘 다보다는 런타임 비용이 없는 방식(Tailwind, CSS Modules, vanilla-extract, Panda CSS)을 먼저 검토하는 추세다. 특히 Next.js App Router처럼 서버 컴포넌트가 기본인 환경에서는 런타임 CSS-in-JS가 불리하다.
