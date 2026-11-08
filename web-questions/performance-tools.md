# Q : Lighthouse, Web Vitals, Performance Timing API, Sentry, React Profiler는 성능 최적화에서 각각 무엇을 확인할 때 보나요?

<br />

# A : 다섯 가지는 "어디서, 누구의 데이터로, 무엇을" 재느냐가 다릅니다. Lighthouse는 내 컴퓨터에서 페이지를 한 번 실행해 점수와 개선 항목을 보는 진단 도구이고, Web Vitals는 실제 사용자가 느낀 LCP·INP·CLS 지표입니다. Performance Timing API는 브라우저가 기록한 시간 데이터를 코드로 직접 꺼내는 API이고, Sentry는 실제 사용자 환경의 성능과 에러를 모아 보는 모니터링 서비스입니다. React Profiler는 React 컴포넌트가 언제, 얼마나 오래 렌더되는지 보는 도구입니다.

### 한눈에 보기

| 도구 | 무엇을 보나 | 데이터 | 언제 쓰나 |
|---|---|---|---|
| **Lighthouse** | 페이지 로딩 점수, 개선 항목 목록 (성능·접근성·SEO·권장사항) | 실험실(lab) — 내 PC에서 시뮬레이션 | 배포 전 점검, "어디부터 고칠까" 찾기 |
| **Web Vitals** | LCP·INP·CLS (사용자 체감 성능) | 현장(field) — 실제 사용자 | 실제 사용자가 느리다고 느끼는지 판단 |
| **Performance Timing API** | 문서·리소스 로딩 시간, 내가 정한 구간의 시간, 긴 작업 | 코드로 직접 측정 (lab·field 둘 다) | 특정 구간을 정확히 재거나 지표를 직접 수집할 때 |
| **Sentry** | 실제 사용자의 Web Vitals, 느린 페이지·요청, 에러 | 현장(field) — 모니터링 서비스 | 배포 후 운영 중 문제를 찾고 추적할 때 |
| **React Profiler** | 어떤 컴포넌트가 왜, 몇 번, 얼마나 오래 렌더되는지 | 개발 환경의 React 렌더 기록 | 화면 조작이 버벅일 때 렌더 원인 찾기 |

- 큰 흐름: **Web Vitals·Sentry로 "느린 곳이 있다"를 발견** → **Lighthouse·Performance API로 로딩 원인을 찾고** → 상호작용이 느리면 **React Profiler로 렌더 원인을 찾는다**.

### 1. Lighthouse — "이 페이지 점수와 고칠 목록"

- **확인하는 것**
  - **Performance 점수(0~100)**: FCP 10%, Speed Index 10%, LCP 25%, TBT(Total Blocking Time) 30%, CLS 25%의 가중 평균. 90 이상 좋음, 50~89 개선 필요, 49 이하 나쁨.
  - **Opportunities / Diagnostics**: "사용하지 않는 JS 줄이기", "이미지 크기 줄이기", "렌더링을 막는 리소스 제거", "LCP 이미지 미리 불러오기" 같은 **구체적인 개선 목록**과 예상 절감 시간.
  - Accessibility, Best Practices, SEO 점수도 함께 나온다.
- **어떻게**: Chrome DevTools의 Lighthouse 탭, `lighthouse <url>` CLI, PageSpeed Insights, CI에서 Lighthouse CI로 점수가 떨어지는 배포 막기.
- **주의**
  - 한 기기·한 네트워크 조건에서 시뮬레이션한 **실험실 데이터**다. 실행할 때마다 점수가 조금씩 달라지고, 실제 사용자 경험과 다를 수 있다.
  - 사용자 입력이 없어서 **INP를 잴 수 없다**. 대신 TBT(메인 스레드가 막힌 시간)를 INP의 대략적인 대신 지표로 본다.
  - 시크릿 창에서 실행한다 (확장 프로그램이 점수에 영향을 준다).

### 2. Web Vitals — "실제 사용자가 느낀 속도"

- **확인하는 것** (Core Web Vitals, 75번째 백분위 기준)

| 지표 | 뜻 | 좋음 |
|---|---|---|
| LCP (Largest Contentful Paint) | 주요 콘텐츠가 보이는 속도 | 2.5초 이하 |
| INP (Interaction to Next Paint) | 사용자 입력에 반응하는 속도 | 200ms 이하 |
| CLS (Cumulative Layout Shift) | 화면 배치가 움직이는 정도 | 0.1 이하 |

- "75번째 백분위"는 사용자 100명 중 75번째로 느린 사람 기준으로 판단한다는 뜻. 평균보다 느린 사용자를 놓치지 않기 위해서다.
- **어디서 보나**
  - **PageSpeed Insights / Search Console**: Chrome 사용자 데이터(CrUX, 최근 28일)로 내 사이트의 실제 LCP·INP·CLS를 보여준다. 방문자가 적으면 데이터가 없다.
  - **`web-vitals` 라이브러리**: 내 사이트에서 직접 재서 분석 도구로 보낸다.

```ts
import { onLCP, onINP, onCLS } from 'web-vitals';

const send = (metric) => navigator.sendBeacon('/analytics', JSON.stringify(metric));
onLCP(send);
onINP(send);
onCLS(send);
```

- **지표별로 보는 것**: LCP가 나쁘면 큰 이미지·폰트·서버 응답(TTFB), INP가 나쁘면 긴 JS 작업·무거운 이벤트 핸들러, CLS가 나쁘면 크기 없는 이미지·늦게 끼어드는 광고·폰트 교체.

### 3. Performance Timing API — "브라우저가 기록한 시간을 코드로"

- 브라우저에 내장된 측정 API 묶음이다. Lighthouse·web-vitals·Sentry도 결국 이 API로 값을 얻는다.
- **확인하는 것**
  - **Navigation Timing** (`PerformanceNavigationTiming`): 문서 요청부터 로드까지 단계별 시간 — DNS, 연결, TTFB(첫 바이트), DOMContentLoaded, load
  - **Resource Timing** (`PerformanceResourceTiming`): 이미지·스크립트·fetch 요청 하나하나의 다운로드 시간과 크기 → 느린 API, 무거운 파일 찾기
  - **User Timing** (`performance.mark` / `measure`): **내가 정한 구간**의 시간 — "검색 버튼 클릭 → 결과 표시", "차트 그리기"
  - **Long Tasks / Long Animation Frames**: 메인 스레드를 50ms 넘게 막은 작업 → INP가 나쁜 원인 찾기
  - LCP, Layout Shift, Event Timing(INP) 항목도 `PerformanceObserver`로 받을 수 있다.

```ts
// 1. 페이지 로딩 단계별 시간
const [nav] = performance.getEntriesByType('navigation');
console.log('TTFB', nav.responseStart - nav.startTime);
console.log('DOMContentLoaded', nav.domContentLoadedEventEnd - nav.startTime);

// 2. 내가 정한 구간 재기
performance.mark('search-start');
await renderResults();
performance.mark('search-end');
performance.measure('search', 'search-start', 'search-end'); // DevTools Performance 탭에도 표시됨

// 3. 메인 스레드를 오래 막은 작업 감시
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) console.log('long task', entry.duration);
}).observe({ type: 'longtask', buffered: true });
```

- **언제**: 도구가 알려주지 않는 **우리 서비스만의 구간**을 재고 싶을 때, 직접 모니터링 데이터를 모을 때.

### 4. Sentry — "운영 중인 사이트에서 무슨 일이 일어나는지"

- 실제 사용자의 브라우저에서 데이터를 모아 대시보드로 보여주는 **모니터링 서비스**다.
- **확인하는 것**
  - **Web Vitals와 성능 점수**: 페이지별 LCP·INP·CLS, p50·p75 시간, "가장 개선 효과가 큰 페이지" 목록
  - **느린 리소스**: 로딩이 오래 걸리는 JS·CSS·이미지
  - **트레이스(trace)**: 페이지 로드나 요청 하나가 프론트 → API → DB까지 어디서 시간이 걸렸는지
  - **에러**: 어떤 브라우저·기기·릴리스에서 어떤 에러가 났는지, 스택 트레이스와 사용자 행동 기록
- **언제**: 배포 후 "특정 페이지가 느려졌다", "새 릴리스부터 에러가 늘었다"를 찾을 때. Lighthouse가 못 잡는 **실제 기기·네트워크 환경의 문제**를 본다.

```ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://...',
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1, // 요청의 10%만 성능 데이터 수집 (비용·부하 조절)
});
```

### 5. React Profiler — "어떤 컴포넌트가 렌더를 많이 하나"

- **확인하는 것**
  - 커밋(화면 반영)마다 **어떤 컴포넌트가 렌더됐는지, 각각 몇 ms 걸렸는지**
  - 렌더할 필요가 없는데 렌더된 컴포넌트 (부모 때문에 따라서 렌더, 매번 새로 만들어지는 props)
  - `memo`, `useMemo`, `useCallback`을 적용한 뒤 렌더 시간이 실제로 줄었는지
- **어떻게**
  - **React DevTools의 Profiler 탭**: 녹화 버튼 → 느린 동작 실행 → 정지 → 커밋별로 컴포넌트 렌더 시간을 그래프로 확인
  - **`<Profiler>` 컴포넌트**: 코드로 렌더 시간을 측정

```tsx
<Profiler
  id="ProductList"
  onRender={(id, phase, actualDuration, baseDuration) => {
    // phase: mount / update, actualDuration: 이번 렌더 시간, baseDuration: 최적화 없이 전부 렌더했을 때 추정 시간
    console.log(id, phase, actualDuration.toFixed(1), baseDuration.toFixed(1));
  }}
>
  <ProductList />
</Profiler>
```

- `actualDuration`이 `baseDuration`보다 훨씬 작으면 메모이제이션이 잘 동작하고 있다는 뜻이다.
- **주의**: 프로덕션 빌드에서는 기본으로 꺼져 있다(측정 자체가 비용이 있어서). 개발 모드는 프로덕션보다 느리므로 **절대 시간보다 상대 비교**로 본다.
- 로딩 속도가 아니라 **로딩 후 상호작용(입력, 필터, 스크롤)**이 느릴 때 쓴다. INP가 나쁜 원인이 React 렌더라면 여기서 찾는다.

### 상황별로 무엇을 보나

| 상황 | 먼저 볼 도구 |
|---|---|
| 배포 전에 페이지를 전반적으로 점검하고 싶다 | Lighthouse |
| 실제 사용자에게도 느린지 알고 싶다 | Web Vitals (PageSpeed Insights 현장 데이터, web-vitals) |
| 첫 화면이 늦게 뜬다 (LCP) | Lighthouse 개선 항목 → Performance API의 Navigation·Resource Timing |
| 클릭·입력 반응이 느리다 (INP) | Performance API의 Long Tasks → React Profiler |
| 화면이 덜컹거린다 (CLS) | Lighthouse의 레이아웃 이동 항목, DevTools Performance 탭 |
| 운영 중 특정 페이지·릴리스에서 느려졌다, 에러가 늘었다 | Sentry |
| 우리 서비스의 특정 기능 시간을 재고 싶다 | Performance API의 User Timing (`mark`/`measure`) |

### 면접 답변 요약

- "Lighthouse는 실험실 환경에서 점수와 개선 항목을 보는 진단 도구라 배포 전 점검에 쓰고, INP는 못 재서 TBT로 대신 봅니다. Web Vitals는 실제 사용자 기준 LCP·INP·CLS로, 75번째 백분위가 기준을 넘는지 봅니다. Performance API는 브라우저가 기록한 로딩·리소스·사용자 정의 구간 시간을 코드로 꺼내는 API이고, Sentry는 이런 현장 데이터와 에러를 모아 운영 중 문제를 추적하는 데 씁니다. React Profiler는 로딩 이후 상호작용이 느릴 때, 어떤 컴포넌트가 불필요하게 다시 렌더되는지 찾는 데 씁니다."

### 관련 질문

- [LCP, INP, CLS](./lcp-inp-cls.md)
- [프로젝트 시 성능최적화를 하셨다고하는데 어떤 최적화들을 진행했었나요?](./project-opti.md)
- [React에서의 성능최적화 방법](../react-questions/in-react-optimization.md)

### 참고

- [Lighthouse overview (Chrome for Developers)](https://developer.chrome.com/docs/lighthouse/overview)
- [Lighthouse performance scoring (Chrome for Developers)](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- [Web Vitals (web.dev)](https://web.dev/articles/vitals)
- [About PageSpeed Insights (Google)](https://developers.google.com/speed/docs/insights/v5/about)
- [Performance API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [Frontend Dashboards (Sentry 문서)](https://docs.sentry.io/product/dashboards/sentry-dashboards/frontend/)
- [&lt;Profiler&gt; (React 문서)](https://react.dev/reference/react/Profiler)
- [React Developer Tools (React 문서)](https://react.dev/learn/react-developer-tools)
