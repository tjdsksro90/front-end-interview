import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare, Demo, Viz, Segmented, Toggle, Stat, ui } from '../components/kit.jsx';

// 이 페이지는 React.lazy로 불러오므로 three(약 700KB)는 이 페이지에 들어올 때만 다운로드된다.

const BG = 0x18181b;

/**
 * three.js 장면 하나를 React 컴포넌트에 붙이는 훅.
 * - 렌더러·장면·카메라를 만들고, 크기 변경(ResizeObserver)과 화면 밖 일시정지(IntersectionObserver)를 처리한다.
 * - 언마운트할 때 루프를 멈추고 geometry·material·renderer를 dispose해서 GPU 메모리를 돌려준다.
 * init(ctx)에서 장면을 꾸미고, ctx.onFrame(time)으로 매 프레임 코드를 등록한다.
 */
function useThreeScene(init) {
  const hostRef = useRef(null);
  const ctxRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const host = hostRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setError('이 브라우저에서 WebGL을 사용할 수 없어요.');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    const ctx = { renderer, scene, camera, onFrame: null };
    ctxRef.current = ctx;
    const cleanup = init(ctx);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); // false: canvas의 CSS 크기는 건드리지 않는다
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const loop = (time) => {
      ctx.onFrame?.(time);
      renderer.render(scene, camera);
    };
    // 화면 밖에 있으면 그리지 않는다 (배터리·CPU 절약)
    const io = new IntersectionObserver(([e]) => renderer.setAnimationLoop(e.isIntersecting ? loop : null));
    io.observe(host);

    return () => {
      io.disconnect();
      ro.disconnect();
      renderer.setAnimationLoop(null);
      cleanup?.();
      scene.traverse((o) => {
        o.geometry?.dispose();
        [].concat(o.material ?? []).forEach((m) => m.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { hostRef, ctxRef, error };
}

function Stage({ hostRef, error, className = 'h-72 sm:h-80' }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-zinc-900 ${className}`}>
      <div ref={hostRef} className="absolute inset-0" />
      {error && <p className="absolute inset-0 grid place-items-center text-sm text-zinc-400">{error}</p>}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, unit = '', disabled }) {
  return (
    <label className={`grid gap-1 text-sm ${disabled ? 'opacity-40' : ''}`}>
      <span className="flex justify-between">
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
        <span className="font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{value}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-indigo-600"
      />
    </label>
  );
}

const fmt = (v) => `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;

export default function ThreeJsPage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Three.js는 <u>WebGL을 객체로 감싸서, 무대(Scene)에 물체(Mesh)와 조명(Light)을 놓고 카메라(Camera)로 찍는 방식</u>으로 3D를 그리게 해주는 라이브러리입니다.
          렌더러가 <u>매 프레임 <Code>render(scene, camera)</Code>를 호출해 <Code>{'<canvas>'}</Code>에 한 장씩 그립니다.</u>
        </OneLiner>

        <H3>장면을 이루는 객체들</H3>
        <SceneGraphViz />

        <Table
          head={['용어', '한 줄']}
          rows={[
            ['Renderer', <>그리는 기계. <Code>WebGLRenderer</Code> 기본, <Code>WebGPURenderer</Code>(<Code>three/webgpu</Code>)는 WebGPU가 없으면 WebGL 2로 그린다</>],
            ['Scene', '모든 것을 담는 무대이자 Scene Graph의 루트'],
            ['Camera', <><Code>PerspectiveCamera(fov, aspect, near, far)</Code> — fov는 세로 시야각(도), near~far 사이만 그린다</>],
            ['Mesh', 'Geometry(모양) + Material(겉면) = 화면에 보이는 물체'],
            ['Light', 'Ambient(전체), Directional(태양), Point(전구), Spot(손전등), Hemisphere(하늘·땅)'],
            ['Object3D', 'position·rotation·scale을 가진 모든 객체의 부모 클래스. add()로 자식을 붙인다'],
            ['렌더 루프', <><Code>renderer.setAnimationLoop(fn)</Code> — 매 프레임 값을 바꾸고 다시 그린다</>],
            ['dispose()', 'GPU 메모리 해제. 장면에서 remove()해도 GPU에는 남아 있다'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>제품 3D 뷰어</b>: 신발·가구·자동차를 돌려 보고 색을 바꿔 보는 화면 (GLTF 모델 + OrbitControls)</>,
            <><b>인터랙티브 랜딩 페이지</b>: 스크롤·마우스에 반응하는 3D 배경, 브랜드 연출</>,
            <><b>데이터 시각화</b>: 지구본 위 데이터, 3D 그래프, 대량의 점(포인트 클라우드)</>,
            <><b>웹 게임·메타버스·지도</b>: 실시간으로 움직이는 3D 공간</>,
          ]}
          avoid={[
            <>단순한 회전·기울기 효과 — CSS <Code>transform: rotate3d()</Code>, <Code>perspective</Code>로 충분하다</>,
            '2D 차트·다이어그램 — SVG나 Canvas 2D 차트 라이브러리가 가볍고 접근성도 좋다',
            '정보가 중요한 화면 — canvas 안의 글자는 검색·스크린 리더·복사가 안 된다',
          ]}
        />
        <Callout type="tip" title="면접 포인트">
          <p>"Scene·Camera·Renderer 세 가지를 만들고, Mesh는 Geometry와 Material의 조합이며, setAnimationLoop로 매 프레임 렌더한다"가 기본 답이에요.</p>
          <p>실무 경험을 덧붙이면 좋아요: <b>리사이즈 때 aspect + updateProjectionMatrix</b>, <b>페이지를 떠날 때 dispose</b>, <b>three는 무거우니 3D 페이지만 동적 import</b>, React에서는 <b>React Three Fiber</b>.</p>
        </Callout>
      </Section>

      <Section step={2} title="시각화">
        <H3>Scene Graph — 부모가 움직이면 자식도 따라간다</H3>
        <p className={ui.muted}>
          지구는 "공전 축(Object3D)"의 자식이고, 달은 지구에 붙은 "달 공전 축"의 자식이에요. 지구의 <Code>position</Code>은 부모 기준(로컬) 좌표라서 늘 (3, 0, 0)이지만, 화면 전체 기준(월드) 좌표는 계속 바뀝니다.
        </p>
        <SolarDemo />

        <H3>카메라 — fov, near, far</H3>
        <p className={ui.muted}>
          큐브 7개가 카메라에서 2, 4, 6 … 14만큼 떨어져 있어요. <b>near보다 가깝거나 far보다 먼 물체는 그리지 않습니다</b>(잘림). fov를 키우면 광각 렌즈처럼 더 넓게 보이고 물체는 작아져요.
        </p>
        <FrustumDemo />
      </Section>

      <Section step={3} title="코드 비교">
        <H3>1. 조명 없이 MeshStandardMaterial</H3>
        <CodeCompare
          before={{
            label: '까맣게 보인다',
            code: `const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshStandardMaterial({ color: 0x6366f1 })
);
scene.add(mesh);
// 조명이 없다 → 빛을 받는 재질은 검은색`,
            note: 'Lambert·Phong·Standard·Physical은 빛을 받아야 보인다. 처음 할 때 가장 흔한 실수.',
          }}
          after={{
            label: '조명을 넣는다',
            code: `scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // 전체를 은은하게
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(3, 4, 5);                          // 비스듬히 비춰야 입체감이 생긴다
scene.add(sun);`,
            note: '조명 없이 색만 보이면 되는 경우(UI 요소, 선)는 MeshBasicMaterial을 쓴다.',
          }}
        />

        <H3>2. 창 크기가 바뀔 때</H3>
        <CodeCompare
          before={{
            label: '처음 한 번만 설정',
            code: `renderer.setSize(innerWidth, innerHeight);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight);
// 창을 줄이면 → 그림이 찌그러지거나 잘린다`,
            note: 'canvas 크기와 카메라 비율(aspect)이 실제 화면과 어긋난다.',
          }}
          after={{
            label: '요소 크기를 지켜보고 다시 맞춘다',
            code: `const ro = new ResizeObserver(() => {
  const { clientWidth: w, clientHeight: h } = host;
  renderer.setSize(w, h, false);       // false: CSS 크기는 CSS에 맡긴다
  camera.aspect = w / h;
  camera.updateProjectionMatrix();     // 카메라 값을 바꾸면 꼭 호출
});
ro.observe(host);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // 레티나 대응, 상한 2`,
            note: '창(resize 이벤트)이 아니라 요소를 지켜보면 사이드바 접기처럼 레이아웃만 바뀌는 경우도 대응된다.',
          }}
        />

        <H3>3. React에서 정리(cleanup)</H3>
        <CodeCompare
          before={{
            label: '정리하지 않음',
            code: `useEffect(() => {
  const renderer = new THREE.WebGLRenderer();
  host.current.appendChild(renderer.domElement);
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}, []);
// 페이지를 오갈 때마다 루프와 GPU 메모리가 쌓인다`,
            note: '브라우저는 WebGL 컨텍스트 수를 제한해서, 쌓이다 보면 오래된 canvas가 깨진다.',
          }}
          after={{
            label: '루프 정지 + dispose',
            code: `useEffect(() => {
  const renderer = new THREE.WebGLRenderer();
  host.current.appendChild(renderer.domElement);
  renderer.setAnimationLoop(() => renderer.render(scene, camera));

  return () => {
    renderer.setAnimationLoop(null);
    scene.traverse((o) => {
      o.geometry?.dispose();
      [].concat(o.material ?? []).forEach((m) => {
        m.map?.dispose();   // 텍스처도 따로 해제
        m.dispose();
      });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}, []);`,
            note: '이 페이지의 데모들도 이 방식으로 정리한다. React Three Fiber는 언마운트할 때 이걸 대신 해준다.',
          }}
        />

        <H3>4. 같은 장면: three.js vs React Three Fiber</H3>
        <CodeCompare
          before={{
            label: 'three.js (명령형)',
            code: `const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: '#6366f1' })
);
scene.add(mesh);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

renderer.setAnimationLoop((t) => {
  mesh.rotation.y = t / 1000;
  renderer.render(scene, camera);
});`,
            note: '만들고, 붙이고, 매 프레임 직접 그린다. 정리도 직접.',
          }}
          after={{
            label: 'React Three Fiber (선언형)',
            code: `function Box() {
  const ref = useRef();
  useFrame((state, delta) => (ref.current.rotation.y += delta));
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}

<Canvas camera={{ position: [0, 0, 5] }}>
  <ambientLight intensity={0.4} />
  <Box />
</Canvas>`,
            note: '클래스 이름을 소문자 JSX로 쓰고(args = 생성자 인자), 상태·props로 장면을 바꾼다. 렌더 루프와 정리는 Canvas가 맡는다.',
          }}
        />
        <Callout type="warn" title="useFrame 안에서 setState 하지 않기">
          <p>매 프레임(초당 60번) React 리렌더가 일어난다. 프레임마다 바뀌는 값은 <Code>ref.current.rotation</Code>처럼 three 객체를 직접 바꾼다.</p>
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <Playground />
        <List
          items={[
            <>조명을 모두 끄면 <b>Basic만 보이고 나머지는 까맣게</b> 변해요.</>,
            <>Standard에서 metalness를 1로 올리면, 비출 환경(environment map)이 없어서 오히려 어두워져요. 실제 서비스에서는 환경 맵을 함께 씁니다.</>,
            <>와이어프레임을 켜면 Geometry가 삼각형으로 이루어져 있다는 게 보여요. 아래 "삼각형 수"가 GPU가 그리는 양이에요.</>,
            <>드래그로 돌리고 휠(두 손가락)로 확대해 보세요. OrbitControls가 카메라를 움직이는 거예요.</>,
          ]}
        />
      </Section>
    </>
  );
}

/* ---------- 1. Scene Graph 그림 ---------- */

function Node({ name, note, tone = 'zinc', children }) {
  const tones = {
    zinc: 'border-zinc-300 dark:border-zinc-700',
    indigo: 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/10',
    amber: 'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10',
    emerald: 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10',
  };
  return (
    <div className={`rounded-lg border p-2.5 ${tones[tone]}`}>
      <p className="text-sm">
        <b className="font-mono text-zinc-900 dark:text-zinc-50">{name}</b>
        {note && <span className={`ml-2 text-xs ${ui.muted}`}>{note}</span>}
      </p>
      {children && <div className="mt-2 grid gap-2 sm:grid-cols-2">{children}</div>}
    </div>
  );
}

function SceneGraphViz() {
  return (
    <Viz>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Node name="Scene" note="무대 (루트)">
          <Node name="Mesh" note="물체" tone="indigo">
            <Node name="Geometry" note="모양: Box, Sphere…" tone="indigo" />
            <Node name="Material" note="겉면: 색, 거칠기…" tone="indigo" />
          </Node>
          <Node name="Light" note="조명" tone="amber" />
          <Node name="Group" note="묶음 → 자식이 따라 움직임">
            <Node name="Mesh" tone="indigo" />
            <Node name="Mesh" tone="indigo" />
          </Node>
        </Node>
        <div className="grid content-start gap-2">
          <Node name="Camera" note="어디서, 얼마나 넓게" tone="emerald" />
          <p className="text-center text-xs text-zinc-400">↓ scene + camera</p>
          <Node name="Renderer" note="render() → <canvas>" tone="emerald" />
        </div>
      </div>
    </Viz>
  );
}

/* ---------- 2-1. Scene Graph 데모 (태양계) ---------- */

function SolarDemo() {
  const [spin, setSpin] = useState(true);
  const [moonParent, setMoonParent] = useState('earth');
  const [axes, setAxes] = useState(true);
  const localRef = useRef(null);
  const worldRef = useRef(null);
  const state = useRef({ spin: true });
  state.current.spin = spin;

  const { hostRef, ctxRef, error } = useThreeScene((ctx) => {
    const { scene, camera } = ctx;
    camera.position.set(0, 4.5, 5.5);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    scene.add(new THREE.PointLight(0xffffff, 60)); // 태양 위치(원점)에서 빛남

    const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    const earthOrbit = new THREE.Object3D(); // 보이지 않는 "공전 축"
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 16), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 }));
    earth.position.x = 3;
    const moonOrbit = new THREE.Object3D();
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8), new THREE.MeshStandardMaterial({ color: 0xd4d4d8 }));
    moon.position.x = 0.9;

    scene.add(sun, earthOrbit);
    earthOrbit.add(earth);
    earth.add(moonOrbit);
    moonOrbit.add(moon);

    const helpers = [earthOrbit, earth].map((o) => {
      const h = new THREE.AxesHelper(o === earth ? 1 : 2);
      o.add(h);
      return h;
    });
    Object.assign(ctx, { earthOrbit, earth, moonOrbit, moon, helpers });

    const world = new THREE.Vector3();
    let last = 0;
    ctx.onFrame = (t) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      if (state.current.spin) {
        earthOrbit.rotation.y += dt * 0.5;
        moonOrbit.rotation.y += dt * 2;
      }
      earth.rotation.y += dt;
      earth.getWorldPosition(world);
      if (localRef.current) localRef.current.textContent = fmt(earth.position);
      if (worldRef.current) worldRef.current.textContent = fmt(world);
    };
  });

  useEffect(() => {
    const c = ctxRef.current;
    if (!c?.moon) return;
    if (moonParent === 'earth') {
      c.moonOrbit.add(c.moon);
      c.moon.position.set(0.9, 0, 0);
    } else {
      c.scene.add(c.moon); // 장면에 바로 붙이면 월드 좌표 (3.9, 0, 0)에 고정된다
      c.moon.position.set(3.9, 0, 0);
    }
  }, [moonParent, ctxRef]);

  useEffect(() => {
    ctxRef.current?.helpers?.forEach((h) => (h.visible = axes));
  }, [axes, ctxRef]);

  return (
    <Demo>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Stage hostRef={hostRef} error={error} />
        <div className="space-y-4 text-sm">
          <Toggle checked={spin} onChange={setSpin} label="공전 (부모 회전)" />
          <Toggle checked={axes} onChange={setAxes} label="축 표시 (AxesHelper)" />
          <div>
            <p className="mb-1.5 font-medium text-zinc-700 dark:text-zinc-200">달의 부모</p>
            <Segmented
              value={moonParent}
              onChange={setMoonParent}
              options={[
                { value: 'earth', label: '지구에 붙이기' },
                { value: 'scene', label: 'scene에 바로' },
              ]}
            />
          </div>
          <div className={`${ui.box} space-y-1 font-mono text-xs`}>
            <p><span className={ui.muted}>earth.position</span> <span ref={localRef} /></p>
            <p><span className={ui.muted}>getWorldPosition</span> <span ref={worldRef} className="text-indigo-600 dark:text-indigo-400" /></p>
          </div>
          <p className={`text-xs ${ui.muted}`}>
            {moonParent === 'earth'
              ? '달은 지구의 자식이라 지구를 따라 돌아요. 달 코드에는 "지구를 따라가라"는 줄이 없어요.'
              : '장면에 바로 붙인 달은 지구가 떠나도 그 자리에 남아요. 부모가 바뀌면 position의 기준도 바뀝니다.'}
          </p>
        </div>
      </div>
    </Demo>
  );
}

/* ---------- 2-2. 카메라 데모 ---------- */

const DISTANCES = [2, 4, 6, 8, 10, 12, 14];
const CUBE_COLORS = [0xf43f5e, 0xf97316, 0xeab308, 0x22c55e, 0x06b6d4, 0x6366f1, 0xa855f7];

function FrustumDemo() {
  const [fov, setFov] = useState(50);
  const [near, setNear] = useState(0.1);
  const [far, setFar] = useState(20);

  const { hostRef, ctxRef, error } = useThreeScene(({ scene, camera }) => {
    camera.position.set(0, 0.8, 0);
    camera.lookAt(0, -0.2, -8);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(2, 3, 2);
    scene.add(light);
    const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    DISTANCES.forEach((d, i) => {
      const cube = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: CUBE_COLORS[i], roughness: 0.5 }));
      // 카메라 정면(-z)으로 지그재그로 늘어놓는다
      cube.position.set(i % 2 ? 0.7 : -0.7, -0.2, -d);
      cube.rotation.set(0.4, 0.6, 0);
      scene.add(cube);
    });
    const grid = new THREE.GridHelper(40, 40, 0x3f3f46, 0x27272a);
    grid.position.y = -1;
    scene.add(grid);
  });

  useEffect(() => {
    const c = ctxRef.current;
    if (!c) return;
    Object.assign(c.camera, { fov, near, far: Math.max(far, near + 0.1) });
    c.camera.updateProjectionMatrix(); // fov·near·far를 바꾸면 꼭 다시 계산
  }, [fov, near, far, ctxRef]);

  return (
    <Demo>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Stage hostRef={hostRef} error={error} />
        <div className="space-y-4">
          <Slider label="fov (세로 시야각)" value={fov} min={15} max={120} onChange={setFov} unit="°" />
          <Slider label="near" value={near} min={0.1} max={10} step={0.1} onChange={setNear} />
          <Slider label="far" value={far} min={1} max={20} step={0.5} onChange={setFar} />
          <div className="flex flex-wrap gap-1.5">
            {DISTANCES.map((d, i) => {
              const visible = d >= near - 0.5 && d <= far + 0.5;
              return (
                <span
                  key={d}
                  className={`rounded-md px-2 py-0.5 font-mono text-xs ${visible ? 'text-white' : 'bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800'}`}
                  style={visible ? { background: `#${CUBE_COLORS[i].toString(16).padStart(6, '0')}` } : undefined}
                >
                  {d}
                </span>
              );
            })}
          </div>
          <p className={`text-xs ${ui.muted}`}>숫자는 큐브까지의 거리예요. 경계에 걸친 큐브는 잘린 단면이 보여요.</p>
        </div>
      </div>
      <CodeBlock code={`camera.fov = ${fov};\ncamera.near = ${near};\ncamera.far = ${far};\ncamera.updateProjectionMatrix();`} />
    </Demo>
  );
}

/* ---------- 4. 놀이터 ---------- */

const GEOMETRIES = {
  box: { label: 'Box', make: () => new THREE.BoxGeometry(1.4, 1.4, 1.4), code: 'new THREE.BoxGeometry(1.4, 1.4, 1.4)' },
  sphere: { label: 'Sphere', make: () => new THREE.SphereGeometry(1, 32, 16), code: 'new THREE.SphereGeometry(1, 32, 16)' },
  torus: { label: 'Torus', make: () => new THREE.TorusGeometry(0.8, 0.32, 24, 64), code: 'new THREE.TorusGeometry(0.8, 0.32, 24, 64)' },
  knot: { label: 'TorusKnot', make: () => new THREE.TorusKnotGeometry(0.7, 0.25, 128, 16), code: 'new THREE.TorusKnotGeometry(0.7, 0.25, 128, 16)' },
};

const MATERIALS = {
  basic: { label: 'Basic', cls: 'MeshBasicMaterial', lit: false },
  lambert: { label: 'Lambert', cls: 'MeshLambertMaterial', lit: true },
  phong: { label: 'Phong', cls: 'MeshPhongMaterial', lit: true },
  standard: { label: 'Standard', cls: 'MeshStandardMaterial', lit: true },
};

const COLOR = 0x6366f1;

function makeMaterial(kind, { metalness, roughness, wireframe }) {
  const base = { color: COLOR, wireframe };
  if (kind === 'standard') return new THREE.MeshStandardMaterial({ ...base, metalness, roughness });
  if (kind === 'phong') return new THREE.MeshPhongMaterial({ ...base, shininess: 80 });
  return new THREE[MATERIALS[kind].cls](base);
}

function playgroundCode(s) {
  const opts = [`color: 0x6366f1`];
  if (s.material === 'standard') opts.push(`metalness: ${s.metalness}`, `roughness: ${s.roughness}`);
  if (s.material === 'phong') opts.push('shininess: 80');
  if (s.wireframe) opts.push('wireframe: true');
  const lines = [
    `const mesh = new THREE.Mesh(`,
    `  ${GEOMETRIES[s.geometry].code},`,
    `  new THREE.${MATERIALS[s.material].cls}({ ${opts.join(', ')} })`,
    `);`,
    `scene.add(mesh);`,
  ];
  if (s.ambient) lines.push('', 'scene.add(new THREE.AmbientLight(0xffffff, 0.3));');
  if (s.directional) lines.push('const sun = new THREE.DirectionalLight(0xffffff, 2.5);', 'sun.position.set(3, 4, 5);', 'scene.add(sun);');
  if (s.point) lines.push('const bulb = new THREE.PointLight(0xf472b6, 20);', 'bulb.position.set(-2, 1, 2);', 'scene.add(bulb);');
  lines.push('', 'const controls = new OrbitControls(camera, renderer.domElement);');
  lines.push('renderer.setAnimationLoop((t) => {');
  if (s.rotate) lines.push('  mesh.rotation.y = t / 2000;');
  lines.push('  controls.update();', '  renderer.render(scene, camera);', '});');
  return lines.join('\n');
}

function Playground() {
  const [s, setS] = useState({
    geometry: 'knot',
    material: 'standard',
    metalness: 0.2,
    roughness: 0.35,
    wireframe: false,
    ambient: true,
    directional: true,
    point: false,
    rotate: true,
  });
  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));
  const trianglesRef = useRef(null);
  const callsRef = useRef(null);
  const rotate = useRef(true);
  rotate.current = s.rotate;

  const { hostRef, ctxRef, error } = useThreeScene((ctx) => {
    const { scene, camera, renderer } = ctx;
    camera.position.set(0, 1, 4.5);
    const mesh = new THREE.Mesh(GEOMETRIES.knot.make(), makeMaterial('standard', { metalness: 0.2, roughness: 0.35, wireframe: false }));
    scene.add(mesh);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    const directional = new THREE.DirectionalLight(0xffffff, 2.5);
    directional.position.set(3, 4, 5);
    const point = new THREE.PointLight(0xf472b6, 20);
    point.position.set(-2, 1, 2);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: 0xf472b6 }));
    point.add(bulb); // 전구 위치를 보이게
    scene.add(ambient, directional, point);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 손을 놓아도 부드럽게 멈춘다
    Object.assign(ctx, { mesh, lights: { ambient, directional, point } });

    let last = 0;
    let shown = 0;
    ctx.onFrame = (t) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      if (rotate.current) mesh.rotation.y += dt * 0.5;
      controls.update();
      if (t - shown > 300) {
        shown = t;
        // 직전 프레임 기준 (render 직후 값)
        if (trianglesRef.current) trianglesRef.current.textContent = renderer.info.render.triangles.toLocaleString();
        if (callsRef.current) callsRef.current.textContent = renderer.info.render.calls;
      }
    };
    return () => controls.dispose();
  });

  // 모양 바꾸기: 새 geometry를 만들고 이전 것은 dispose
  useEffect(() => {
    const mesh = ctxRef.current?.mesh;
    if (!mesh) return;
    const old = mesh.geometry;
    mesh.geometry = GEOMETRIES[s.geometry].make();
    old.dispose();
  }, [s.geometry, ctxRef]);

  // 재질 종류가 바뀌면 새로 만들고, 값만 바뀌면 속성만 고친다
  useEffect(() => {
    const mesh = ctxRef.current?.mesh;
    if (!mesh) return;
    const m = mesh.material;
    if (m.type !== MATERIALS[s.material].cls) {
      mesh.material = makeMaterial(s.material, s);
      m.dispose();
    } else {
      m.wireframe = s.wireframe;
      if (s.material === 'standard') Object.assign(m, { metalness: s.metalness, roughness: s.roughness });
    }
  }, [s, ctxRef]);

  useEffect(() => {
    const l = ctxRef.current?.lights;
    if (!l) return;
    l.ambient.visible = s.ambient;
    l.directional.visible = s.directional;
    l.point.visible = s.point;
  }, [s.ambient, s.directional, s.point, ctxRef]);

  const noLight = MATERIALS[s.material].lit && !s.ambient && !s.directional && !s.point;

  return (
    <Demo hint="모양·재질·조명을 바꿔 보세요. 캔버스를 드래그하면 카메라가 돌아갑니다.">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <Stage hostRef={hostRef} error={error} className="h-80 sm:h-96" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="삼각형 수" value={<span ref={trianglesRef}>-</span>} />
            <Stat label="draw call" value={<span ref={callsRef}>-</span>} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">Geometry</p>
            <Segmented value={s.geometry} onChange={(geometry) => set({ geometry })} options={Object.entries(GEOMETRIES).map(([value, g]) => ({ value, label: g.label }))} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">Material</p>
            <Segmented value={s.material} onChange={(material) => set({ material })} options={Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label }))} />
          </div>
          <Slider label="metalness" value={s.metalness} min={0} max={1} step={0.05} onChange={(metalness) => set({ metalness })} disabled={s.material !== 'standard'} />
          <Slider label="roughness" value={s.roughness} min={0} max={1} step={0.05} onChange={(roughness) => set({ roughness })} disabled={s.material !== 'standard'} />
          <div className="grid gap-2">
            <Toggle checked={s.ambient} onChange={(ambient) => set({ ambient })} label="AmbientLight" />
            <Toggle checked={s.directional} onChange={(directional) => set({ directional })} label="DirectionalLight" />
            <Toggle checked={s.point} onChange={(point) => set({ point })} label="PointLight (분홍)" />
            <Toggle checked={s.wireframe} onChange={(wireframe) => set({ wireframe })} label="wireframe" />
            <Toggle checked={s.rotate} onChange={(rotate) => set({ rotate })} label="자동 회전" />
          </div>
          {noLight && <p className={`text-sm ${ui.warn}`}>조명이 하나도 없어서 {MATERIALS[s.material].label}는 까맣게 보여요.</p>}
          {!MATERIALS[s.material].lit && <p className={`text-sm ${ui.muted}`}>Basic은 조명을 받지 않아서 입체감 없이 단색으로 보여요.</p>}
        </div>
      </div>
      <div className="mt-4">
        <CodeBlock title="지금 화면을 만드는 코드" code={playgroundCode(s)} />
      </div>
    </Demo>
  );
}
