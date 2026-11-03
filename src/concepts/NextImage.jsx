import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Segmented, Stat, ui,
} from '../components/kit.jsx';

export default function NextImage() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          next/image의 <Code>{'<Image>'}</Code>는 이미지를 <u>기기 화면에 맞는 크기로 줄이고, WebP/AVIF로 변환하고, 화면에 보일 때만 불러오고, 자리를 미리 잡아 레이아웃 밀림(CLS)을 막는 일</u>을 자동으로 해주는 컴포넌트입니다.
          이미지는 보통 페이지 용량의 대부분이라, 이것만으로 로딩 속도(LCP)가 크게 좋아집니다.
        </OneLiner>

        <H3>{'<img>'} 대신 {'<Image>'}를 쓰면 해주는 것</H3>
        <Table
          head={['기능', '하는 일', '관련 지표']}
          rows={[
            ['크기 조절 (responsive)', '여러 너비 버전을 만들어 srcset으로 제공 → 기기에 맞는 크기만 다운로드', '전송량, LCP'],
            ['포맷 변환', '브라우저가 지원하면 WebP/AVIF로 변환 (JPEG보다 25~50% 작음)', '전송량'],
            ['lazy loading', '기본값이 loading="lazy" → 화면 근처에 올 때 다운로드', '초기 로딩'],
            ['자리 잡기', 'width/height(또는 fill)로 비율만큼 공간을 먼저 확보', 'CLS'],
            ['캐싱', '/_next/image?url=…&w=…&q=… 로 최적화한 결과를 서버/CDN에 캐시', '서버 부하'],
          ]}
        />

        <H3>Responsive Image — srcset과 sizes</H3>
        <List
          items={[
            <><Code>srcset</Code>: "이 이미지는 640w, 1080w, 1920w 버전이 있어"라는 후보 목록. next/image가 설정(deviceSizes, imageSizes)을 바탕으로 자동으로 만든다.</>,
            <><Code>sizes</Code>: "이 이미지는 화면에서 이 정도 너비로 보여"라는 힌트. 브라우저는 <b>(표시 너비 × 기기 픽셀 비율)</b>보다 크거나 같은 후보 중 가장 작은 것을 고른다.</>,
            <><b>sizes를 안 주면</b> 브라우저는 화면 전체 너비(100vw)라고 가정 → 3열 카드 이미지인데도 화면 전체 크기 이미지를 받는다. <Code>fill</Code>이나 반응형 레이아웃에선 <b>sizes를 꼭 지정</b>.</>,
          ]}
        />

        <H3>Lazy Loading</H3>
        <List
          items={[
            <>next/image는 기본으로 브라우저의 <Code>loading="lazy"</Code>를 쓴다. 화면(뷰포트) 근처에 올 때 다운로드를 시작한다.</>,
            <>예전에는 IntersectionObserver로 직접 구현했다. (화면에 들어오면 <Code>data-src</Code>를 <Code>src</Code>로 바꾸는 방식) 지금은 브라우저 기능이라 JS가 필요 없다.</>,
            <><b>첫 화면의 큰 이미지(LCP 이미지)는 lazy로 두면 안 된다</b> → <Code>priority</Code>(Next.js 16부터 <Code>preload</Code>)를 줘서 미리 불러오게 한다.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>Next.js 프로젝트의 거의 모든 콘텐츠 이미지</b>: 상품 사진, 썸네일, 배너, 프로필</>,
            <><b>첫 화면 히어로 이미지</b>: <Code>priority</Code> + 정확한 <Code>sizes</Code>로 LCP 개선</>,
            '이미지가 많은 목록/피드: 기본 lazy loading으로 초기 로딩 절약',
            '사용자가 올린 큰 원본 이미지를 보여줄 때: 자동 리사이즈로 몇 MB → 몇십 KB',
          ]}
          avoid={[
            'SVG 아이콘, 아주 작은 이미지 — 최적화 이득이 없다 (SVG는 그냥 <img>나 컴포넌트로)',
            '정적 export(output: export)인데 이미지 서버가 없는 경우 — loader를 따로 설정하거나 unoptimized',
            '외부 이미지 도메인을 next.config의 remotePatterns에 등록하지 않은 경우 — 에러가 난다',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>상품 카드 이미지(PC에선 화면의 1/3, 모바일에선 전체 너비)를 보여줄 때, 기기에 따라 브라우저가 어떤 크기의 파일을 받는지 계산해 봅니다. 원본은 4000×2250 JPEG(약 3.1MB)입니다.</p>
        <SrcsetViz />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '<img> 그대로',
            code: `
<img src="/products/shoe.jpg" alt="운동화" />
{/* 4000px 원본 3MB를 모든 기기에 그대로
    width/height 없음 → 로드되면 아래 내용이 밀림
    첫 화면 밖이어도 바로 다운로드 */}`,
            note: '모바일에서 375px로 보여줄 이미지에 3MB를 쓰고, 이미지가 뜨는 순간 글이 아래로 밀린다(CLS).',
          }}
          after={{
            label: 'next/image',
            code: `
import Image from 'next/image';

// 목록 이미지: 기본 lazy loading
<Image
  src="/products/shoe.jpg"
  alt="운동화"
  width={1200}
  height={675}              // 비율만큼 자리를 먼저 잡음 → CLS 0
  sizes="(max-width: 768px) 100vw, 33vw"
  placeholder="blur"         // 로딩 중 흐린 미리보기 (정적 import 시)
/>

// 첫 화면 히어로 이미지: lazy 끄고 미리 불러오기
<div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
  <Image src={hero} alt="" fill sizes="100vw" priority />
</div>`,
            note: '기기에 맞는 크기의 WebP/AVIF를 받고, 화면 밖 이미지는 나중에, 히어로 이미지는 가장 먼저 받는다.',
          }}
        />
        <Callout title="외부 이미지를 쓴다면 next.config.js">
          <CodeBlock
            code={`
module.exports = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.example.com' }],
    formats: ['image/avif', 'image/webp'],
  },
};`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <H3>A. Lazy Loading — 스크롤할 때 이미지 요청</H3>
        <LazyDemo />
        <H3>B. 자리 잡기 — CLS(레이아웃 밀림)</H3>
        <ClsDemo />
      </Section>
    </>
  );
}

/* ---------- 시각화: srcset 선택 ---------- */

// next.config.js 기본값
const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384];
const CANDIDATES = [...IMAGE_SIZES, ...DEVICE_SIZES];
const ORIGINAL_W = 4000;

// 16:9 이미지 대략적인 용량 (JPEG 원본 ≈ 0.35B/px, WebP ≈ 0.1B/px)
const kbOf = (w, bytesPerPx) => Math.round((w * w * (9 / 16) * bytesPerPx) / 1024);
const fmt = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`);

const MODES = {
  img: { label: '<img> 원본', sizes: null },
  noSizes: { label: '<Image> sizes 없음', sizes: '100vw' },
  sizes: { label: '<Image> sizes 지정', sizes: '(max-width: 768px) 100vw, 33vw' },
};

function SrcsetViz() {
  const [mode, setMode] = useState('sizes');
  const [vw, setVw] = useState(390);
  const [dpr, setDpr] = useState(3);

  const slot = vw <= 768 ? vw : Math.round(vw / 3); // 카드가 실제로 보이는 너비
  const assumed = mode === 'sizes' ? slot : vw; // 브라우저가 sizes로 알고 있는 너비
  const needed = assumed * dpr;
  const chosen = mode === 'img' ? ORIGINAL_W : CANDIDATES.find((c) => c >= needed) ?? CANDIDATES.at(-1);
  const kb = mode === 'img' ? kbOf(ORIGINAL_W, 0.35) : kbOf(chosen, 0.1);
  const ideal = kbOf(CANDIDATES.find((c) => c >= slot * dpr) ?? CANDIDATES.at(-1), 0.1);

  return (
    <Viz>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={mode} onChange={setMode} options={Object.entries(MODES).map(([value, m]) => ({ value, label: m.label }))} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          화면 너비
          <input type="range" min={320} max={1920} step={10} value={vw} onChange={(e) => setVw(Number(e.target.value))} className="w-48 accent-indigo-600" />
          <span className="w-16 font-mono tabular-nums">{vw}px</span>
        </label>
        <label className="flex items-center gap-2">
          기기 픽셀 비율(DPR)
          <select className={ui.input} value={dpr} onChange={(e) => setDpr(Number(e.target.value))}>
            <option value={1}>1x (일반 모니터)</option>
            <option value={2}>2x (맥북, 태블릿)</option>
            <option value={3}>3x (최신 휴대폰)</option>
          </select>
        </label>
      </div>

      <div className="mt-4 rounded-lg bg-zinc-50 p-3 font-mono text-xs leading-relaxed dark:bg-zinc-800/60">
        {mode === 'img' ? (
          <div>{'<img src="shoe.jpg">'} → srcset이 없으니 항상 원본 {ORIGINAL_W}px</div>
        ) : (
          <>
            <div>sizes = "{MODES[mode].sizes}"</div>
            <div>브라우저가 아는 표시 너비 = <b>{assumed}px</b>{mode === 'noSizes' && vw > 768 && <span className={ui.bad}> (실제로는 {slot}px인데 100vw로 착각)</span>}</div>
            <div>필요한 픽셀 = {assumed}px × {dpr} = <b>{needed}px</b></div>
            <div>srcset 후보 중 {needed}px 이상인 가장 작은 것 → <b>{chosen}w</b></div>
          </>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="실제 카드 표시 너비" value={`${slot}px`} />
        <Stat label="다운로드하는 이미지" value={`${chosen}px`} />
        <Stat label="용량 (대략)" value={fmt(kb)} tone={kb > ideal * 1.5 ? 'bad' : 'good'} />
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>
        → {mode === 'img' && '어떤 기기든 3MB 원본을 받는다. 모바일 데이터와 LCP 모두 손해.'}
        {mode === 'noSizes' && (vw > 768 ? `PC에서 카드는 ${slot}px인데 화면 전체 너비 기준으로 골라서 필요한 것보다 큰 이미지를 받는다. 화면 너비를 PC 크기로 올려보세요.` : '모바일에선 카드가 화면 전체라 우연히 맞는다. 화면 너비를 PC 크기로 올려보세요.')}
        {mode === 'sizes' && '실제 표시 크기에 딱 맞는 후보를 고른다. 같은 화질로 가장 작은 파일.'}
      </p>
    </Viz>
  );
}

/* ---------- 데모 A: lazy loading ---------- */

const IMAGE_COUNT = 24;
const HUES = [210, 160, 30, 280, 340, 190, 100, 250];

function LazyDemo() {
  const [mode, setMode] = useState('lazy');
  const [requested, setRequested] = useState(() => new Set());
  const rootRef = useRef(null);

  // 'eager'는 전부 즉시 요청. 'lazy'는 화면 근처(200px 여유)에 들어온 것만 요청 — 브라우저 loading="lazy"의 동작을 흉내 냄
  useEffect(() => {
    setRequested(mode === 'eager' ? new Set(Array.from({ length: IMAGE_COUNT }, (_, i) => i)) : new Set());
    if (mode === 'eager') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => Number(e.target.dataset.index));
        if (hit.length) setRequested((prev) => new Set([...prev, ...hit]));
      },
      { root: rootRef.current, rootMargin: '200px 0px' }
    );
    rootRef.current.querySelectorAll('[data-index]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mode]);

  return (
    <Demo hint="상자 안을 스크롤해 보세요. lazy 모드에서는 화면 근처에 온 이미지만 요청되고, eager 모드에서는 페이지를 열자마자 24개를 전부 요청합니다.">
      <Segmented value={mode} onChange={(v) => { if (rootRef.current) rootRef.current.scrollTop = 0; setMode(v); }} options={[{ value: 'eager', label: 'loading="eager" (<img> 기본)' }, { value: 'lazy', label: 'loading="lazy" (<Image> 기본)' }]} />
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm">
        <Stat label="요청한 이미지" value={`${requested.size} / ${IMAGE_COUNT}개`} tone={requested.size > 10 ? 'bad' : 'good'} />
        <Stat label="받은 용량 (장당 80KB 가정)" value={fmt(requested.size * 80)} />
      </div>
      <div ref={rootRef} className="mt-3 h-72 overflow-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: IMAGE_COUNT }, (_, i) => (
            <div
              key={i}
              data-index={i}
              className="grid aspect-video place-items-center rounded-lg text-xs font-semibold transition-colors duration-500"
              style={{ background: requested.has(i) ? `hsl(${HUES[i % HUES.length]} 70% 60%)` : 'repeating-linear-gradient(45deg, #d4d4d8 0 6px, #e4e4e7 6px 12px)' }}
            >
              <span className={requested.has(i) ? 'text-white' : 'text-zinc-500'}>#{i + 1} {requested.has(i) ? '요청됨' : '대기'}</span>
            </div>
          ))}
        </div>
      </div>
    </Demo>
  );
}

/* ---------- 데모 B: CLS ---------- */

function ClsDemo() {
  const [run, setRun] = useState(0);
  return (
    <Demo hint="'다시 불러오기'를 누르면 1.2초 뒤 이미지가 도착합니다. 왼쪽은 이미지가 들어오는 순간 아래 글이 밀려나고, 오른쪽은 자리를 미리 잡아서 그대로입니다.">
      <button className={ui.btnPrimary} onClick={() => setRun((r) => r + 1)}>다시 불러오기</button>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ClsCard key={`a${run}`} reserved={false} />
        <ClsCard key={`b${run}`} reserved />
      </div>
    </Demo>
  );
}

function ClsCard({ reserved }) {
  const [loaded, setLoaded] = useState(false);
  const [shift, setShift] = useState(null);
  const textRef = useRef(null);
  const before = useRef(0);

  useEffect(() => {
    before.current = textRef.current.offsetTop;
    const id = setTimeout(() => setLoaded(true), 1200);
    return () => clearTimeout(id);
  }, []);
  useLayoutEffect(() => {
    if (loaded) setShift(textRef.current.offsetTop - before.current);
  }, [loaded]);

  // relative: 글의 offsetTop을 페이지가 아니라 카드 기준으로 재서, 카드 바깥 레이아웃 변화는 무시한다
  return (
    <div className={`${ui.box} relative`}>
      <div className="mb-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
        {reserved ? '<Image width={1200} height={675} />' : '<img src="..." /> (크기 없음)'}
      </div>
      <div className={`relative overflow-hidden rounded-lg ${reserved ? 'aspect-video bg-zinc-100 dark:bg-zinc-800' : ''}`}>
        {loaded ? (
          <div className="grid aspect-video w-full place-items-center bg-gradient-to-br from-indigo-400 to-sky-400 text-sm font-semibold text-white">이미지 도착</div>
        ) : reserved ? (
          <div className="absolute inset-0 grid place-items-center text-xs text-zinc-400">로딩 중 (자리는 확보됨)</div>
        ) : null}
      </div>
      <p ref={textRef} className="mt-3 text-sm">
        상품 설명: 가볍고 통기성이 좋은 러닝화입니다. 이 문장을 읽고 있는데 이미지가 뜨면…
      </p>
      <p className="mt-2 text-sm font-semibold">
        {shift == null ? <span className="text-zinc-400">측정 중…</span> : shift > 0 ? <span className={ui.bad}>글이 {shift}px 밀려남 (CLS 발생)</span> : <span className={ui.good}>밀림 0px</span>}
      </p>
    </div>
  );
}
