# Q : Vue와 React와 Angular는 상태 변경·컴포넌트 구성 방식이 어떻게 다른가요?

<br />

# A : 가장 큰 차이는 "상태가 바뀌었다는 걸 어떻게 알고, 화면의 어디를 다시 그리느냐"입니다. React는 setState로 바뀌었다고 알려주면 그 컴포넌트 함수를 다시 실행해 새 화면을 만들고 비교합니다. Vue는 값을 읽고 쓰는 순간을 Proxy로 추적해서, 그 값을 쓰는 곳만 자동으로 다시 그립니다. Angular는 signal로 값을 감싸 두면 그 signal을 읽은 템플릿만 갱신하고, 서비스와 의존성 주입(DI)으로 상태를 나눠 씁니다. 컴포넌트 구성도 React는 JSX를 반환하는 함수, Vue는 템플릿·스크립트·스타일을 한 파일에 담는 SFC, Angular는 데코레이터가 붙은 클래스입니다.

### 한 줄로

- **React**: "상태가 바뀌면 **컴포넌트 함수를 다시 실행**한다" — 불변 업데이트 + 다시 렌더 + Virtual DOM 비교
- **Vue**: "값을 **바꾸기만 하면** 그 값을 쓰는 곳이 알아서 갱신된다" — Proxy 기반 반응형(reactivity)
- **Angular**: "값을 **signal로 감싸면** 그 signal을 읽은 곳만 갱신된다" — signal + 클래스 컴포넌트 + DI

### 같은 카운터를 세 가지로

```tsx
// React — 함수 컴포넌트 + JSX
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  const double = count * 2; // 렌더할 때마다 다시 계산된다

  return <button onClick={() => setCount(count + 1)}>{count} / {double}</button>;
}
```

```vue
<!-- Vue — Single-File Component (Counter.vue) -->
<script setup>
import { ref, computed } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2); // count가 바뀔 때만 다시 계산

function increment() {
  count.value++; // 값을 직접 바꾼다
}
</script>

<template>
  <button @click="increment">{{ count }} / {{ double }}</button>
</template>

<style scoped>
button { font-weight: bold; }
</style>
```

```ts
// Angular — 데코레이터가 붙은 클래스 (standalone 컴포넌트)
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `<button (click)="increment()">{{ count() }} / {{ double() }}</button>`,
})
export class Counter {
  count = signal(0);
  double = computed(() => this.count() * 2); // 필요할 때 계산하고 결과를 기억

  increment() {
    this.count.update((v) => v + 1); // 또는 this.count.set(1)
  }
}
```

### 상태 변경 방식

**React — 바뀌었다고 "알려준다"**

- `setCount(1)`을 호출하면 React는 그 컴포넌트를 **통째로 다시 실행**하고, 새로 나온 결과(Virtual DOM)를 이전 결과와 비교해 달라진 DOM만 고친다.
- 객체·배열은 **새 객체를 만들어야** 바뀐 걸로 인식한다(`setUser({ ...user, name })`). 직접 `user.name = 'a'` 하면 화면이 안 바뀐다.
- 부모가 다시 렌더되면 자식도 기본적으로 다시 렌더된다. 그래서 `memo`, `useMemo`, `useCallback`으로 불필요한 렌더를 줄이는 최적화가 따로 있다(React Compiler가 이를 자동화하는 중).
- 여러 `setState`는 묶어서(batching) 한 번에 렌더한다.

**Vue — 값을 "바꾸기만" 한다**

- `ref()`·`reactive()`로 만든 값은 **Proxy(또는 getter/setter)로 감싸져** 있다. 렌더 중에 값을 **읽으면** "이 화면은 이 값을 쓴다"고 기록(track)하고, 값을 **쓰면** 그걸 쓰는 화면·computed·watch만 다시 실행(trigger)한다.
- 그래서 `count.value++`, `state.items.push(x)`처럼 **직접 바꿔도** 된다. 불변 업데이트가 필요 없다.
- 어떤 컴포넌트가 어떤 값을 쓰는지 알고 있으므로, 부모가 바뀌어도 그 값을 안 쓰는 자식은 다시 렌더되지 않는다. `memo` 같은 수동 최적화가 거의 필요 없다.
- DOM 갱신은 바로 일어나지 않고 다음 tick에 모아서 한다. 바뀐 DOM을 읽으려면 `await nextTick()`.
- `ref`는 스크립트에서 `.value`로 접근하고, 템플릿에서는 자동으로 풀린다. `reactive`는 구조 분해하면 반응성을 잃는다. 그래서 Vue 문서는 `ref`를 기본으로 권한다.

**Angular — signal로 "감싸서" 읽고 쓴다**

- `signal(0)`으로 만들고, **함수처럼 호출해서 읽고**(`count()`), `set()`·`update()`로 바꾼다. `computed()`는 다른 signal로 계산한 값, `effect()`는 signal이 바뀔 때 실행할 부수효과.
- 템플릿에서 signal을 읽으면 Angular가 추적하고, 그 signal이 바뀌면 **해당 컴포넌트만** 갱신 대상으로 표시한다.
- 예전 Angular는 **zone.js**가 브라우저 API(클릭, setTimeout, HTTP 등)를 가로채서 "뭔가 바뀌었을 수도 있다"고 보고 **트리 전체를 검사**(change detection)했다. 지금은 signal 기반으로 바뀌어, **Angular v21부터 새 앱은 zone.js 없는 zoneless가 기본**이다.
- 개념적으로 Vue의 `ref`와 Angular의 signal은 같은 종류의 반응형 도구다(Vue 문서도 이렇게 설명한다). 차이는 읽는 방법(`.value` vs `count()`)과 바꾸는 방법(대입 vs `set`/`update`).

### 컴포넌트 구성 방식

| | React | Vue | Angular |
|---|---|---|---|
| 컴포넌트 형태 | JSX를 반환하는 **함수** | `.vue` **SFC** (`<template>` + `<script setup>` + `<style>`) | `@Component` 데코레이터가 붙은 **클래스** |
| 화면 문법 | JSX (JS 안에 HTML 모양) | HTML 템플릿 + 디렉티브 (`v-if`, `v-for`, `@click`, `:prop`) | HTML 템플릿 + 제어 흐름 (`@if`, `@for`, `(click)`, `[prop]`) |
| 조건·반복 | `{cond && <A />}`, `list.map(...)` | `v-if`, `v-for` | `@if { }`, `@for (item of items; track item.id) { }` |
| 스타일 | 별도 (CSS Modules, Tailwind, CSS-in-JS 등) | `<style scoped>`로 컴포넌트 범위 CSS 기본 제공 | `styles`/`styleUrl`, 기본으로 컴포넌트 범위에 캡슐화 |
| 부모 → 자식 | props | props (`defineProps`) | `input()` |
| 자식 → 부모 | 콜백 함수를 props로 전달 | 이벤트 발생 (`defineEmits`, `emit`) | `output()`으로 이벤트 발생 |
| 로직 재사용 | 커스텀 Hook (`useXxx`) | Composable (`useXxx`, Composition API) | 서비스 + 의존성 주입 (`inject()`) |
| 전역 상태 | Context, Zustand, Redux 등 외부 라이브러리 | Pinia (공식) | 서비스(싱글턴)에 signal을 두고 주입 |
| 성격 | **라이브러리**: 라우터·폼·HTTP는 따로 고른다 | **점진적 프레임워크**: 라우터·상태관리 공식 제공, 필요한 만큼 | **풀 프레임워크**: 라우터·폼·HTTP·DI·테스트가 다 들어 있음 |

- **React**는 "UI = 함수(상태)"라는 생각이 그대로 드러난다. 모든 게 JS라서 자유도가 높지만, 상태 관리·폴더 구조 같은 결정을 팀이 직접 해야 한다.
- **Vue**는 HTML·JS·CSS를 한 파일에서 익숙한 형태로 쓰고, 반응형이 자동이라 진입 장벽이 낮다.
- **Angular**는 TypeScript, 클래스, DI, 정해진 구조를 전제로 해서 처음 배울 게 많지만, 큰 팀에서 코드 모양이 통일된다.

### Angular의 의존성 주입(DI) 예시

```ts
// 서비스: 앱 전체에서 하나만 만들어져 공유된다 (싱글턴)
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<string[]>([]);
  readonly items = this._items.asReadonly(); // 밖에서는 읽기만
  readonly count = computed(() => this._items().length);

  add(item: string) {
    this._items.update((list) => [...list, item]);
  }
}

// 컴포넌트에서 주입해서 사용
@Component({ selector: 'app-cart-badge', template: `장바구니 {{ cart.count() }}` })
export class CartBadge {
  cart = inject(CartService);
}
```

- React라면 Context나 Zustand, Vue라면 Pinia 스토어가 하는 역할을 Angular는 **서비스 + DI**로 한다.

### 면접 답변 요약

- "React는 setState로 변경을 알리면 컴포넌트 함수를 다시 실행해 Virtual DOM을 비교하는 방식이라 불변 업데이트와 memo 같은 최적화가 필요합니다. Vue는 Proxy로 값을 읽고 쓰는 시점을 추적해서 값을 직접 바꾸면 그 값을 쓰는 곳만 갱신합니다. Angular는 예전에는 zone.js로 트리 전체를 검사했지만, 지금은 signal을 읽은 곳만 갱신하는 방식이 기본입니다. 컴포넌트는 React가 JSX 함수, Vue가 템플릿·스크립트·스타일을 합친 SFC, Angular가 데코레이터 클래스이고, 공유 상태는 각각 Context/외부 라이브러리, Pinia, 서비스와 DI로 다룹니다."

### 관련 질문

- [React에서 State의 불변성을 유지해야하는 이유](./state.md)
- [바닐라 자바스크립트 대신 React를 사용하는 이유](./vanila-react.md)
- [React에서의 성능최적화 방법](./in-react-optimization.md)

### 참고

- [Reactivity Fundamentals (Vue 문서)](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Reactivity in Depth (Vue 문서)](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Single-File Components (Vue 문서)](https://vuejs.org/guide/scaling-up/sfc.html)
- [Signals (Angular 문서)](https://angular.dev/guide/signals)
- [Zoneless (Angular 문서)](https://angular.dev/guide/zoneless)
- [Components (Angular 문서)](https://angular.dev/guide/components)
- [Control flow (Angular 문서)](https://angular.dev/guide/templates/control-flow)
- [Dependency Injection (Angular 문서)](https://angular.dev/guide/di)
