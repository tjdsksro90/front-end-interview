# 프론트엔드 개발자 면접 질문

### 사이트에서 보기: https://front-study-note.vercel.app

> 이 저장소의 마크다운 문서를 카테고리별 목록·실시간 검색으로 볼 수 있는 사이트입니다. 일부 개념은 `심화`(개념 → 시각화 → 코드 비교 → 직접 해보기)를 함께 제공합니다.  
> `main`에 push하면 Vercel로 자동 배포됩니다. 로컬 실행: `npm install` → `npm run dev`

<br />
<br />

## 개요

**프론트엔드 기술면접 대비를 위한 레퍼지토리입니다.**

- 질문에 대한 참고래퍼런스는 [Front-end Developer Interview Questions](https://github.com/h5bp/Front-end-Developer-Interview-Questions?tab=readme-ov-file), [React Interview Questions & Answers](https://github.com/sudheerj/reactjs-interview-questions) 레퍼런스등을 기반으로 작성하고 있습니다.
- 중요도(1~5)는 <ins>전적으로 제 주관적</ins>으로 분류했습니다.
- 질문에 대한 답변은 해당 질문에 대해 깊게 공부한 후 **직접작성**하는 것을 원칙으로 하고있습니다.

<br />
<br />

## 카테고리

**카테고리는 총 7개로 구성되었으며, 질문에 대한 답을 마크다운 문서로 작성합니다.**

[Computer Science 관련 예상 면접질문](#computer-science-관련-예상-면접질문)

[Web 및 프론트엔드 전반적인 지식 관련 예상 면접질문](#web-및-프론트엔드-전반적인-지식-관련-예상-면접질문)

[HTML 관련 예상 면접질문](#html-관련-예상-면접질문)

[CSS 관련 예상 면접질문](#css-관련-예상-면접질문)

[JavaScript 관련 예상 면접질문](#javascript-관련-예상-면접질문)

[React · Next.js 관련 예상 면접질문](#react--nextjs-관련-예상-면접질문)

[이력서 기반 예상 면접질문](#이력서-기반-예상-면접질문)

<br />
<br />

## Computer Science 관련 예상 면접질문

<br />
<br />

## Web 및 프론트엔드 전반적인 지식 관련 예상 면접질문

### 중요도 5

- [브라우저 렌더링 원리](./web-questions/browser-rendering.md)
- [AJAX](./web-questions/ajax.md)
- [API란?](./web-questions/api.md)
- [REST API](./web-questions/rest-api.md)
- [Restful API](./web-questions/rest-ful-api.md)
- [주소창에 google.com을 입력하면 일어나는 일](./web-questions/google-search.md)
- [OAuth](./web-questions/OAuth.md)
- [쿠키, sessionStorage, localStorage의 차이점](/HTML-questions/6-difference-between-cookie-sessionstorage-localstorage.md)
- [CSR과SSR의 차이점](./web-questions/spa.md)
- [CORS란?](./web-questions/cors.md)
- [URI와 URL의 차이점](./web-questions/uri-url.md)

<br />

### 중요도 4

- [CI/CD란?](./web-questions/ci-cd.md)
- [Git-flow에 대한 설명](./web-questions/git-flow.md)
- [SEO란 무엇인가?](./web-questions/SEO.md)
- [SEO 최적화를 구성하는 방법](./web-questions/SEO-optimization.md)
- [클라이언트 사이드 렌더링 시 검색엔진 최적화 이슈가 발생하는 이유](./web-questions/csr-seo-issue.md)
- [Nginx](./web-questions/nginx.md)
- [SSL이란?](./web-questions/ssl.md)
- [XSS(Cross-Site Scripting) 공격이란 무엇이며, 방어 방법은?](./web-questions/xss.md)
- [CSRF(Cross-Site Request Forgery) 공격이란 무엇이며, 방어 방법은?](./web-questions/csrf.md)
-

<br />

### 중요도 3

- [모듈 번들러와 트랜스 파일러](./web-questions/bundler-tarnspiler.md)
- [Webpack을 사용하는 이유와 주요 기능은 무엇인가?](./web-questions/webPack.md)
- [함수형 프로그래밍이란?](./web-questions/functional-programming.md)

### 중요도 미정 (velog 정리)

- [SPA의 특징과, 이전에 사용하던 방식(MPA) 대비 장점은 무엇인가요?](./web-questions/spa-mpa.md)
- [ESLint와 Prettier에 대해서 설명해주세요.](./web-questions/eslint-prettier.md)

### 프로젝트 경험 (라이브러리 · 기능)

- [Google Analytics에 대해서 설명해주세요](./web-questions/google-analyics.md)
- [Intersection Observer에 대해서 설명해주세요](./web-questions/intersection-observer.md)
- [Firebase의 특징에 대해서 설명해주세요](./web-questions/fire-base.md)
- [SEO 최적화는 어떤 방식으로 하셨었나요?](./web-questions/seo-opti.md)
- [프로젝트 시 성능최적화를 하셨다고하는데 어떤 최적화들을 진행했었나요?](./web-questions/project-opti.md)
- [소셜 미디어 공유 기능 구현은 어떤 방식으로 구현하셨나요?](./web-questions/social-media.md)

### 배포 · AWS · CI/CD

- [AWS EC2로 서버를 배포하셨는데 그 이유는 뭔가요?](./web-questions/ec2-server.md)
- [AWS EC2 인스턴스에 대해서 설명해주세요](./web-questions/ec2.md)
- [AWS에서 웹 빌드 파일을 배포하는 과정을 설명해주세요](./web-questions/aws-deploy.md)
- [AWS S3 버킷에 대해서 설명해주세요](./web-questions/aws-s3-bucket.md)
- [certbot은 어떤 역할을 하나요?](./web-questions/certbot.md)
- [Github Actions의 파이프라인은 어떤식으로 구성하셨나요?](./web-questions/pipe-line.md)
- [Github Actions와 AWS CodeDeploy를 어떤 식으로 조합하셨나요?](./web-questions/git-actions-in-codeDeploy.md)

<br />
<br />

## HTML 관련 예상 면접질문

### 중요도 5

- [`doctype`의 기능](/HTML-questions/1-what-does-a-doctype-do.md)
- ['data-' 속성](/HTML-questions/4-data-attributes.md)
- [웹 접근성과 시맨틱 웹에 대해서 설명하고, 시맨틱 태그엔 어떤 것들이 있는지 말해주세요.](./HTML-questions/13-web-accessibility-semantic-web.md)

<br />

### 중요도 4

- [`<script>`, `<script async>`, `<script defer>`의 차이점](/HTML-questions/7-difference-between-script-async-defer.md)
- [HTML에서 빈 요소(empty elements)](/HTML-questions/13-what-are-empty-elements-in-html.md)

<br />

### 중요도 3

- [프로그레시브 렌더링(Progressive Rendering)](/HTML-questions/9-what-is-progressive-rendering.md)

<br />

### 중요도 1

- [HTML5를 오픈 웹 플랫폼으로 볼 때, HTML5의 구성 요소](/HTML-questions/5-building-blocks-of-html5.md)
- [여러 언어로 된 콘텐츠가 포함된 페이지의 제공](/HTML-questions/2-multiple-languages.md)
- [다국어 사이트를 설계하거나 개발할 때 주의해야 할 사항](/HTML-questions/3-multilingual-sites.md)
- [이미지 태그에서 'srcset' 속성을 사용하는 이유와 속성의 내용을 평가하는 브라우저의 프로세스](/HTML-questions/10-srcset-attribute-in-an-image-tag.md)
- [캔버스(canvas)와 SVG의 차이점](/HTML-questions/12-difference-between-canvas-and-svg.md)

<br />
<br />

## CSS 관련 예상 면접질문

### 중요도 5

- [CSS Margin & Padding](/CSS-questions/margin-padding.md)
- [CSS 선택자의 우선순위와 동작방식](/CSS-questions/1-specificity.md)
- [z-index와 스택 문맥이 형성되는 방식](/CSS-questions/4-z-index.md)
- [BFC(Block Formatting Context)와 동작원리](/CSS-questions/5-bfc.md)
- [브라우저 별 스타일링 문제를 해결하는 방식](/CSS-questions/7-browser-issues.md)
- [CSS 전처리기를 사용하는 장단점](/CSS-questions/12-css-preprocessors.md)
- [브라우저가 CSS 선택자와 일치하는 요소를 어떻게 결정하는가?](/CSS-questions/13-css-selector.md)

<br />

### 중요도 4

- [가상 요소(pseudo-elements) 선택자의 정의와 용도](/CSS-questions/14-pseudo-elements.md)
- [효율적인 CSS를 작성하기 위한 "주의점"](/CSS-questions/11-css-gotchas.md)
- [박스 모델에 대한 이해](/CSS-questions/15-box-model.md)

<br />

### 중요도 3

- ["리셋(resetting)"과 "정규화(normalizing)" CSS의 차이점](/CSS-questions/2-reset-vs-normalize.md)
- [기능이 제한된 브라우저에 페이지를 제공하는 방식](/CSS-questions/8-feature-constrained-browsers.md)
- [시각적으로 컨텐츠를 숨기는 다양한 방법과 이를 스크린 리더기에서만 사용 가능하게 하는 방법](/CSS-questions/9-hide-content.md)

<br />

### 중요도 1

- [플로트(Floats)의 정의와 동작방식](/CSS-questions/3-floats.md)
- [다양한 클리어링 기법과 기법들의 적합도](/CSS-questions/6-clearing.md)
- [스크린 외에 다른 @media 속성의 예시](/CSS-questions/10-media-property.md)

### 프로젝트 경험

- [프로젝트 시 반응형 레이아웃은 어떤 방식으로 구현하셨나요?](./CSS-questions/responsive-ui.md)

<br />
<br />

## JavaScript 관련 예상 면접질문

### 중요도 5

- [클로저의 정의와 사용방식](./javascript-questions/4-closure.md)
- [이벤트 위임과 동작방식](./javascript-questions/1-event-delegation.md)
- [프로토타입 상속](./javascript-questions/2-prototype-inherit.md)
- [호이스팅](./javascript-questions/13-hoisting.md)
- [이벤트 버블링](./javascript-questions/15-event-bubbling.md)
- [이벤트 캡처링](./javascript-questions/16-event-caputring.md)
- [JavaScript에서 동일 출처 정책](./javascript-questions/19-same-origin-policy.md)
- [동기 및 비동기 함수의 차이](./javascript-questions/28-synchronous-asynchronouse-function-diffrence.md)
- [이벤트 루프](./javascript-questions/29-event-loop.md)
- [콜 스택과 태스크 큐의 정의 및 차이점](./javascript-questions/30-task-quque.md)
- [실행컨텍스트란?](./javascript-questions/execution-context.md)
- [this란?](./javascript-questions/this.md)
- [typescript를 사용한 이유와 사용했을때 장점](./javascript-questions/why-typescript.md)
- [가비지 콜렉터와 동작방식](./javascript-questions/garabage-collector.md)
- [Promise의 정의와 사용 예시](./javascript-questions/Promise.md)
- [async/awiat란?](./javascript-questions/async-await.md)

<br />

### 중요도 4

- [자바스크립트는 어떤 언어이고, 어떠한 특징을 가지는가?](./javascript-questions/about-javascript.md)
- [자바스크립트 엔진이 코드를 실행하는 과정](./javascript-questions/engine.md)
- [원시값과 참조값의 차이점을 메모리 관점에서 설명하라](./javascript-questions/primitive-type-reference-type.md)
- [e.target와 e.currentTarget의 차이점](./javascript-questions/e-target.md)
- [null, undefined, undeclared 변수의 차이점과 각 상태를 확인하는 방법](./javascript-questions/3-variable-diffrence.md)
- [let, var, const로 생성된 변수의 차이점](./javascript-questions/31-var-let-const.md)
- [Array.forEach() 루프와 Array.map() 메서드의 주요한 차이점 및 선택 시점](./javascript-questions/6-forEach-map-diffrence.md)
- [Function.call과 Function.apply의 차이점](./javascript-questions/11-call-apply-diffrence.md)
- [Function.prototype.bind](./javascript-questions/12-bind.md)
- [JavaScript 코드를 JavaScript로 컴파일하는 언어에서 쓰는 장단점](./javascript-questions/22-compile-javascript.md)
- [IIFE](./javascript-questions/IIFE.md)
- [Spread Syntax의 이점과 주의해야할 점은?](./javascript-questions/spread-syntax.md)
- [ES6 문법에 추가된 것들은?](./javascript-questions/es6.md)
- [자바스크립트에서 이벤트 바인딩의 정의와 이벤트 바인딩 방법들](./javascript-questions/event-binding.md)

<br />

### 중요도 3

- [오브젝트 프로퍼티와 배열 항목을 반복할 때](./javascript-questions/5-loop.md)
- [익명 함수의 사용 사례](./javascript-questions/7-anonymous-function.md)
- [호스트 객체와 네이티브 객체의 차이점](./javascript-questions/8-host-object-navite-object.md)
- [var person = Person(), var person = new Person()의 차이점](./javascript-questions/9-function-diffrence.md)
- [타입강제 변환의 정의와 타입강제 변환 시 주의할 점](./javascript-questions/14-type-implicit-conversion)
- ["속성"과 "프로퍼티"의 차이점](./javascript-questions/17-attribute-property-diffrence.md)
- [가변 및 불변 객체의 차이점](./javascript-questions/24-mutable-immutable-object.md)
- [JavaScript에서 불변 객체의 예시](./javascript-questions/25-immutalbe-object.md)
- [불변성의 장단점](./javascript-questions/26-immutalbility-advantageOrdisadvantage.md)
- [코드에서 불변성 달성 방법](./javascript-questions/27-code-immutalbility.md)
- [고차함수란?](./javascript-questions/high-order-function.md)
- [require과 import의 차이점](./javascript-questions/require-import.md)

<br />

### 중요도 1

- [function foo() {}와 var foo = function() {}의 foo 사용 차이점](./javascript-questions/10-function-diffrence2.md)
- [==와 ===의 차이점]('./javascript-questions/18-comparison-operator.md)
- [삼항 연산자를 '삼항'이라고 부르는 이유](./javascript-questions/20-ternary-operator.md)
- [엄격 모드의 정의 및 사용의 장단점](./javascript-questions/21-strict-mode.md)
- [JavaScript 코드를 디버깅하는 데 사용하는 도구 및 기술](./javascript-questions/23-debugging-tool.md)
- [ES6 클래스와 ES5 함수 생성자의 차이점](./javascript-questions/32-class-new-function-diff.md)
- [Arrow function 문법의 사용 사례 및 다른 함수와의 차이점](./javascript-questions/33-arrow-function.md)
- [생성자 내의 메소드에 Arrow syntax를 사용하는 이점](./javascript-questions/34-constructor-function-in-arrow-function.md)
- [while과 do-while 루프의 차이](./javascript/while-do-while.md)

### 중요도 미정 (velog 정리)

- [Promise.all에 대해서 간단히 설명해주세요.](./javascript-questions/51-promise-all.md)

### 프로젝트 경험

- [debounce에 대해서 설명해주세요](./javascript-questions/debounce.md)

<br />
<br />

## React · Next.js 관련 예상 면접질문

### 중요도 5

- [React의 특징은?](./react-questions/react-characteristic.md)
- [React는 라이브러리인가 프레임워크인가?](./react-questions/react-is-libraray.md)
- [React에서 가상돔의 정의와 동작방식](./react-questions/virtual-dom.md)
- [React에서 컴포넌트란?](./react-questions/react-component.md)
- [클래스형 컴포넌트 VS 함수형 컴포넌트](./react-questions/class-component.md)
- [컴포넌트 라이프 사이클](./react-questions/life-cycle.md)
- [상태관리와 상태관리가 필요한 이유](./react-questions/state-management.md)
- [React Hook이란?](./react-questions/react-hooks.md)
- [props와 state의 정의](./react-questions/props-state.md)
- [React에서 State의 불변성을 유지해야하는 이유](./react-questions/state.md)
- [React에서의 성능최적화 방법](./react-questions/in-react-optimization.md)
- [바닐라 자바스크립트 대신 React를 사용하는 이유](./react-questions/vanila-react.md)

<br />

### 중요도 4

- [useState 훅의 정의](./react-questions/use-state.md)
- [useEffect 훅의 정의](./react-questions/use-effect.md)
- [useRef 훅의 정의](./react-questions/use-ref.md)
- [useRef와 useState의 차이점](./react-questions/useRef-useState-diffrence.md)
- [useMemo와 useCallback이란?](./react-questions/use-memo-use-callback.md)
- [React Hydration이란?](./react-questions/hyration.md)
- [컴포넌트 리스트 구현 시 각 컴포넌트에 대한 id 값을 설정해야하는 이유](./react-questions/map-id.md)
- [Props Drilling의 정의와 이를 해결하는 방법은?](./react-questions/props-drilling.md)

<br />

### 중요도 3

- [JSX의 정의](./react-questions/jsx.md)
- [리액트에서 JSX 를 사용시 장점](./react-questions/react-in-jsx.md)
- [리액트에서는 가상 돔의 변경점을 어떻게 포착할까?](./react-questions/virtubal-dom-dipping.md)
- [Context API 를 상태관리 라이브러리처럼 사용할 수 있을까?](./react-questions/context-api-in-statemanagement.md)

<br />

### 라이브러리 · Next.js

- [React-Router에 대한 설명과 동작방식에 대해서 설명해주세요](./react-questions/react-router.md)
- [Tanstack-Query란 무엇이며 이를 사용하는 이유는 무엇일까요?](./react-questions/tanstack-query.md)
- [Recoil에 대해서 설명해주세요](./react-questions/recoil.md)
- [Zustand에 대해서 설명해주세요](./react-questions/zustand.md)
- [Zustand가 제공하는 미들웨어들은 뭐가 있을까요?](./react-questions/zustand-middle-ware.md)
- [framer-motion에 대해서 설명해주세요](./react-questions/framer-motion.md)
- [nextjs의 app-router에 대해서 설명해주세요](./react-questions/app-router.md)
- [nextjs의 useTheme을 통해 다크모드를 구현하셨다고하는데, 어떤방식으로 구현하셨나요?](./react-questions/nextjs-useTheme.md)
- [Nextjs의 동작방식에 대해 이해하고 있나요?](./nextjs-questions/how-nextjs-works.md) TODO

### 중요도 미정 (velog 정리)

- [React Query의 staleTime에 대해서 설명해주세요.](./react-questions/react-query-staletime.md)
- [DOM 접근 외에 useRef는 어떤 용도로 사용하나요?](./react-questions/use-ref-without-dom.md)
- [일반 함수 대신 커스텀 훅을 사용하는 이유는 무엇인가요?](./react-questions/custom-hook.md)
- [React 대신 Next.js를 사용하는 이유는 무엇인가요?](./react-questions/why-nextjs.md)

### 프로젝트 경험

- [재사용 가능한 컴포넌트 구축을 위해 어떤 고민을 하셨나요?](./react-questions/component.md)

<br />
<br />

## 이력서 기반 예상 면접질문
