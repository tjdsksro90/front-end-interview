# Q : Three.js란 무엇이고, 어떻게 동작하나요?

<br />

# A : Three.js는 브라우저에서 3D 그래픽을 그리는 JavaScript 라이브러리입니다. WebGL(또는 WebGPU)을 직접 다루려면 셰이더와 버퍼를 하나하나 작성해야 하는데, Three.js는 이를 장면(Scene), 카메라(Camera), 물체(Mesh), 조명(Light) 같은 객체로 감싸서 "무대를 꾸미고 카메라로 찍는" 방식으로 3D를 만들 수 있게 해줍니다. 렌더러가 매 프레임 장면을 카메라 시점으로 그려 `<canvas>`에 출력합니다.

### 한 줄로

- **Three.js = WebGL을 쉽게 쓰게 해주는 3D 라이브러리**. 제품 3D 뷰어, 인터랙티브 랜딩 페이지, 데이터 시각화, 웹 게임, 3D 모델(GLTF) 보여주기에 쓴다.
- 결과물은 HTML 요소가 아니라 **`<canvas>` 하나에 그려진 그림**이다. 그래서 DOM 이벤트·CSS·접근성은 따로 신경 써야 한다.

### 동작 방식: 무대 + 카메라 + 촬영

```
Scene(무대)
 ├─ Mesh(물체) = Geometry(모양) + Material(재질)
 ├─ Light(조명)
 └─ Group(묶음) → 자식 Mesh들
Camera(카메라) ── 어디서 어떤 화각으로 볼지
Renderer(촬영기) ── renderer.render(scene, camera) → <canvas>
```

1. **Scene**에 물체와 조명을 넣는다. 물체는 **Geometry(모양)** 와 **Material(겉면)** 을 합친 **Mesh**다.
2. **Camera**를 놓는다. 보통 사람 눈처럼 원근이 있는 `PerspectiveCamera`를 쓴다.
3. **Renderer**가 `render(scene, camera)`를 호출할 때마다 한 장(프레임)을 그린다.
4. 움직이려면 매 프레임 값을 바꾸고 다시 그린다 (**렌더 루프**, 보통 초당 60번).

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement); // <canvas>

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100); // fov, 비율, near, far
camera.position.z = 5;

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.4 })
);
scene.add(cube);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 4, 5);
scene.add(sun);

renderer.setAnimationLoop((time) => {
  cube.rotation.y = time / 1000;
  renderer.render(scene, camera);
});
```

### 주요 용어 정리

| 용어 | 뜻 |
|---|---|
| **Renderer** | 장면을 그려 `<canvas>`에 출력하는 객체. `WebGLRenderer`가 기본, `WebGPURenderer`는 WebGPU를 쓰고 안 되면 WebGL 2로 대신 그린다 (`three/webgpu`) |
| **Scene** | 모든 물체·조명을 담는 무대. 트리 구조(Scene Graph)의 루트 |
| **Camera** | 보는 시점. `PerspectiveCamera`(원근, 기본), `OrthographicCamera`(원근 없음, 2D·도면·아이소메트릭 게임) |
| **fov / aspect / near / far** | 카메라 설정. fov = 세로 시야각(도), aspect = 화면 가로/세로 비율, near~far = 이 거리 사이에 있는 것만 그린다 (절두체, frustum) |
| **Mesh** | 화면에 보이는 물체 = Geometry + Material |
| **Geometry** | 모양(꼭짓점 좌표 모음). `BoxGeometry`, `SphereGeometry`, `PlaneGeometry`, `TorusKnotGeometry` 등. 실제 데이터는 `BufferGeometry` |
| **Material** | 겉면을 어떻게 칠할지. 색, 거칠기, 금속성, 투명도, 와이어프레임 |
| **Light** | 조명. `AmbientLight`(전체를 고르게), `DirectionalLight`(태양처럼 평행), `PointLight`(전구), `SpotLight`(손전등), `HemisphereLight`(하늘·땅 두 색) |
| **Object3D** | Mesh·Light·Camera·Group의 부모 클래스. `position`, `rotation`, `scale`을 가진다 |
| **Group / Scene Graph** | 객체를 부모-자식으로 묶는다. 부모를 움직이면 자식도 같이 움직인다 (지구가 돌면 달도 따라감) |
| **Texture** | 겉면에 입히는 이미지. `TextureLoader`로 불러와 `material.map`에 넣는다 |
| **렌더 루프** | 매 프레임 값 변경 → `render()`. `renderer.setAnimationLoop(fn)` 또는 `requestAnimationFrame` |
| **OrbitControls** | 마우스 드래그로 카메라를 돌리고 휠로 확대하는 애드온 (`three/addons/controls/OrbitControls.js`) |
| **GLTF / GLB** | 3D 모델 파일의 표준 형식("3D계의 JPEG"). `GLTFLoader`로 불러온다 |
| **Raycaster** | 마우스 위치에서 광선을 쏴서 어떤 물체를 클릭했는지 찾는다 (canvas에는 DOM 클릭 이벤트가 없으므로) |
| **dispose()** | GPU 메모리 해제. Geometry·Material·Texture는 장면에서 빼도 GPU에 남으므로 직접 해제해야 한다 |
| **devicePixelRatio** | 레티나 화면 대응. `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`처럼 상한을 두는 경우가 많다 |

### 재질(Material) 고르기

| 재질 | 조명 영향 | 특징 |
|---|---|---|
| `MeshBasicMaterial` | 받지 않음 | 단색 그대로. 가장 가볍다. 조명 없이도 보인다 |
| `MeshLambertMaterial` | 받음 | 광택 없는 표면(나무, 돌). 가볍다 |
| `MeshPhongMaterial` | 받음 | 반짝이는 하이라이트(shininess) |
| `MeshStandardMaterial` | 받음 | **물리 기반(PBR)**. `metalness`(금속성, 기본 0), `roughness`(거칠기, 기본 1)로 조절. 실무 기본값 |
| `MeshPhysicalMaterial` | 받음 | Standard + 유리 투과, 코팅 등. 가장 무겁다 |

- 조명을 받는 재질인데 장면에 조명이 없으면 **물체가 까맣게 보인다**. 처음 할 때 가장 흔한 실수다.

### 프론트엔드에서 신경 쓸 점

- **반응형**: 창 크기가 바뀌면 `camera.aspect`를 바꾸고 `camera.updateProjectionMatrix()`, `renderer.setSize()`를 다시 호출해야 화면이 늘어나지 않는다.
- **메모리 정리**: SPA에서 3D 화면을 벗어날 때 `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, `renderer.dispose()`를 하고 루프를 멈춘다. 안 하면 페이지를 오갈 때마다 GPU 메모리가 쌓인다.
- **번들 크기**: three는 큰 라이브러리라서 3D가 있는 페이지에서만 동적 import(`React.lazy`, `import()`)로 불러오는 것이 좋다.
- **성능**: 그리는 물체 수(draw call)가 많으면 느려진다. 같은 물체를 많이 그릴 땐 `InstancedMesh`, 모델은 압축(Draco), 그림자는 꼭 필요한 곳에만.

### React에서는: React Three Fiber

- **React Three Fiber(R3F)** 는 three.js를 React 컴포넌트로 쓰게 해주는 렌더러다. `<Canvas>` 안에 `<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`처럼 JSX로 장면을 만든다.
- `useFrame`으로 매 프레임 실행할 코드를 등록하고, 언마운트하면 정리(dispose)도 알아서 해준다.
- `@react-three/drei`는 OrbitControls, 모델 로더, 텍스트 같은 자주 쓰는 도우미 모음이다.
- 버전 짝: `@react-three/fiber@9`는 React 19, `@8`은 React 18과 쓴다.

```jsx
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Box() {
  const ref = useRef();
  useFrame((state, delta) => (ref.current.rotation.y += delta));
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <Box />
    </Canvas>
  );
}
```

### 관련 질문

- [React에서의 성능최적화 방법은 어떤것들이 있을까요?](../react-questions/in-react-optimization.md)
- [모듈 번들러와 트랜스파일러에 대해서 설명해주세요](../web-questions/bundler-tarnspiler.md)

### 참고

- [three.js 저장소 (mrdoob/three.js)](https://github.com/mrdoob/three.js) — 설치한 `three@0.187.0` 소스의 문서 주석(PerspectiveCamera, WebGLRenderer, WebGPURenderer, MeshStandardMaterial, MeshLambertMaterial, MeshBasicMaterial, PointLight)과 package.json의 exports(`three/addons`, `three/webgpu`)로 확인
- [React Three Fiber — Introduction](https://r3f.docs.pmnd.rs/getting-started/introduction)
