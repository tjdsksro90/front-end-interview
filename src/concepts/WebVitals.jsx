import { useEffect, useState } from 'react';
import {
  Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock, CodeCompare,
  Demo, Viz, Stat, ui,
} from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function WebVitals() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          Web Vitals는 구글이 정한 <u>사용자가 체감하는 성능 지표</u>입니다. 핵심(Core) 3개는 LCP(얼마나 빨리 보이나), INP(얼마나 빨리 반응하나), CLS(얼마나 안 흔들리나).
          Lighthouse로 실험실에서 재고, Performance API·Sentry로 실제 사용자 환경에서 모니터링합니다.
        </OneLiner>

        <Table
          head={['지표', '뜻', '좋음', '주요 원인 / 개선']}
          rows={[
            [<b>LCP</b>, '화면에서 가장 큰 요소(히어로 이미지, 큰 제목)가 그려진 시간', '≤ 2.5초', '큰 이미지, 느린 서버(TTFB), 렌더 차단 CSS/JS → 이미지 최적화, preload, SSR/SSG'],
            [<b>INP</b>, '클릭·입력 후 다음 화면이 그려지기까지의 지연 (페이지 전체 중 거의 최악값)', '≤ 200ms', '무거운 이벤트 핸들러, 긴 렌더 → 작업 쪼개기, useTransition, 메모이제이션'],
            [<b>CLS</b>, '예상치 못하게 레이아웃이 밀린 정도의 합', '≤ 0.1', '크기 없는 이미지/광고, 늦게 뜨는 배너, 웹폰트 교체 → width/height, 자리 예약'],
            ['FID (구)', '첫 입력의 지연. 2024년 3월 INP로 교체됨', '≤ 100ms', '면접에서 "FID는 INP로 바뀌었다"를 알면 좋다'],
            ['TTFB', '요청 후 첫 바이트가 올 때까지 (서버·네트워크)', '≤ 0.8초', 'CDN, 캐시, 서버 처리 최적화'],
            ['FCP', '무언가 처음 그려진 시간', '≤ 1.8초', '렌더 차단 리소스 줄이기'],
            ['TTI / TBT', '조작 가능해지는 시점 / 그 전까지 메인 스레드가 막힌 총 시간', 'TBT ≤ 200ms', 'JS 줄이기. TTI는 Lighthouse 10부터 빠지고 TBT·INP를 본다'],
          ]}
        />

        <H3>측정 도구 — 실험실(Lab) vs 현장(Field)</H3>
        <List
          items={[
            <><b>Lighthouse</b> (Lab): 내 컴퓨터에서 정해진 조건(느린 4G, 저사양 CPU 흉내)으로 한 번 측정. 원인 진단과 개선 제안이 나온다. 사용자 클릭이 없어서 INP 대신 TBT를 본다.</>,
            <><b>Performance API</b> (Field): 브라우저에 내장된 <Code>PerformanceObserver</Code>로 실제 사용자 브라우저에서 측정. 구글의 <Code>web-vitals</Code> 라이브러리가 이걸 감싼 것.</>,
            <><b>Sentry / Vercel Analytics / GA4</b> (Field 모니터링): 실제 사용자들의 지표를 모아 p75(75번째 백분위) 기준으로 보여주고, 느린 페이지·에러를 추적. Sentry는 에러 추적 + 성능(Web Vitals) 모니터링을 같이 한다.</>,
            <><b>PageSpeed Insights / Search Console</b>: Lab(Lighthouse) + Field(크롬 사용자 실측 데이터, CrUX)를 함께 보여준다. 구글 검색 순위에 쓰이는 건 Field 값.</>,
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>최적화 전·후 비교</b>: "LCP 4.1초 → 1.9초"처럼 숫자로 성과를 말할 수 있어야 한다 (면접·포트폴리오에서 중요)</>,
            <><b>배포 후 실제 사용자 성능 감시</b>: Sentry/Vercel Analytics로 p75 추적, 나빠지면 알림</>,
            'SEO가 중요한 서비스: Core Web Vitals가 검색 순위 요소',
            'PR마다 Lighthouse CI로 성능 회귀 막기',
          ]}
          avoid={[
            'Lighthouse 점수 100점 자체를 목표로 삼기 — 실제 사용자(Field) 지표가 더 중요하다',
            '개발 서버(npm run dev)에서 측정 — 번들링·압축이 안 된 상태라 의미가 없다. 배포본이나 preview로 측정',
          ]}
        />
      </Section>

      <Section step={2} title="시각화">
        <p>아래 측정값은 <b>지금 이 페이지</b>를 브라우저의 PerformanceObserver로 실제로 잰 값입니다. 페이지를 스크롤하고 버튼을 눌러보면 CLS와 INP가 바뀝니다.</p>
        <LiveVitals />
      </Section>

      <Section step={3} title="코드 비교">
        <CodeCompare
          before={{
            label: '감으로 판단',
            code: `
// "우리 사이트 빠른 것 같은데?"
// → 개발자 PC(빠른 CPU, 와이파이, 캐시 있음)에서만 확인
// → 저사양 폰 + 4G 사용자는 LCP 6초를 겪고 있어도 모름`,
            note: '개발자 환경과 실제 사용자 환경은 다르다. 측정하지 않으면 개선했는지도 알 수 없다.',
          }}
          after={{
            label: 'web-vitals로 실사용자 측정',
            code: `
import { onLCP, onINP, onCLS } from 'web-vitals';

function send(metric) {
  // { name: 'LCP', value: 1834, rating: 'good', id, ... }
  navigator.sendBeacon('/analytics', JSON.stringify(metric));
}
onLCP(send);
onINP(send);
onCLS(send);

// Next.js라면
// app/layout.tsx 에서 useReportWebVitals((metric) => send(metric))`,
            note: '실제 사용자의 값을 모아서 p75 기준으로 본다. Sentry는 SDK 초기화만 해도 자동으로 수집한다.',
          }}
        />
        <Callout title="직접 PerformanceObserver로 (web-vitals 내부와 비슷)">
          <CodeBlock
            code={`
// LCP: 더 큰 요소가 그려질 때마다 후보가 갱신된다 → 마지막 값이 LCP
new PerformanceObserver((list) => {
  const last = list.getEntries().at(-1);
  console.log('LCP', last.startTime, last.element);
}).observe({ type: 'largest-contentful-paint', buffered: true });

// CLS: 사용자 입력 직후가 아닌 레이아웃 이동의 합 (실제는 세션 윈도 단위로 묶음)
let cls = 0;
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
}).observe({ type: 'layout-shift', buffered: true });

// 페이지 로딩 단계별 시간 (Navigation Timing)
const [nav] = performance.getEntriesByType('navigation');
console.log('TTFB', nav.responseStart - nav.startTime);`}
          />
        </Callout>
        <Callout title="Sentry 설정 예">
          <CodeBlock
            code={`
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://…@sentry.io/…',
  integrations: [Sentry.browserTracingIntegration()],  // Web Vitals, 페이지 로딩 추적
  tracesSampleRate: 0.1,                              // 10% 사용자만 성능 수집
});`}
          />
        </Callout>
      </Section>

      <Section step={4} title="직접 해보기">
        <ShiftAndBlockDemo />
        <H3>Lighthouse·Sentry 확인 경로</H3>
        <WhereToCheck
          items={[
            { where: 'Lighthouse', path: ['F12', 'Lighthouse 탭', 'Mode: Navigation', 'Device: Mobile', 'Analyze page load'], what: '시크릿 창에서 실행(확장 프로그램 영향 제거). Performance 점수 아래 LCP/TBT/CLS와 "Opportunities"(개선 제안)를 본다.' },
            { where: '실제 사용자 데이터 (구글)', path: ['pagespeed.web.dev', 'URL 입력', '"실제 사용자 경험" 영역'], what: '크롬 사용자 28일 실측(CrUX). 트래픽이 적으면 데이터가 없다.' },
            { where: '로딩 과정 프레임 단위로', path: ['F12', 'Performance 탭', '새로고침 버튼(⟳)'], what: '타임라인에 LCP·Layout Shift 마커, 긴 작업(빨간 삼각형, 50ms 초과)이 표시된다.' },
            { where: 'Sentry', path: ['Sentry 대시보드', 'Insights', 'Web Vitals'], what: '페이지별 LCP/INP/CLS p75와 느린 페이지 목록. Issues 메뉴에서는 에러와 발생한 사용자 환경을 본다.' },
          ]}
        />
        <Screen title="DevTools — Lighthouse">
          <div className="flex flex-wrap items-center justify-center gap-6 p-5">
            {[['Performance', 92], ['Accessibility', 100], ['Best Practices', 96], ['SEO', 91]].map(([n, v]) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-emerald-500 text-lg font-bold text-emerald-600">{v}</div>
                <span className="text-[11px]">{n}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-5 dark:border-zinc-700 dark:bg-zinc-700">
            {[['First Contentful Paint', '0.9 s'], ['Largest Contentful Paint', '1.8 s'], ['Total Blocking Time', '120 ms'], ['Cumulative Layout Shift', '0.02'], ['Speed Index', '1.4 s']].map(([n, v]) => (
              <div key={n} className="bg-white p-3 dark:bg-zinc-900">
                <div className="text-[11px] text-zinc-500"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />{n}</div>
                <div className="mt-1 text-base font-semibold text-emerald-600">{v}</div>
              </div>
            ))}
          </div>
        </Screen>
      </Section>
    </>
  );
}

/* ---------- 시각화: 이 페이지의 실제 측정값 ---------- */

const RATING = {
  LCP: (v) => (v <= 2500 ? 'good' : v <= 4000 ? 'mid' : 'bad'),
  CLS: (v) => (v <= 0.1 ? 'good' : v <= 0.25 ? 'mid' : 'bad'),
  INP: (v) => (v <= 200 ? 'good' : v <= 500 ? 'mid' : 'bad'),
  TTFB: (v) => (v <= 800 ? 'good' : v <= 1800 ? 'mid' : 'bad'),
};
const TONE = { good: 'good', mid: 'warn', bad: 'bad' };

function useLiveVitals() {
  const [m, setM] = useState({ LCP: null, CLS: 0, INP: null, TTFB: null });
  useEffect(() => {
    const observers = [];
    const watch = (type, cb, opts = {}) => {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      const o = new PerformanceObserver((list) => cb(list.getEntries()));
      o.observe({ type, buffered: true, ...opts });
      observers.push(o);
    };
    watch('largest-contentful-paint', (es) => setM((x) => ({ ...x, LCP: es.at(-1).startTime })));
    watch('layout-shift', (es) => {
      const add = es.filter((e) => !e.hadRecentInput).reduce((a, e) => a + e.value, 0);
      if (add) setM((x) => ({ ...x, CLS: x.CLS + add }));
    });
    // INP 근사: 상호작용(interactionId 있는 이벤트) 중 가장 긴 처리 시간
    watch('event', (es) => {
      const worst = Math.max(...es.filter((e) => e.interactionId).map((e) => e.duration), 0);
      if (worst) setM((x) => ({ ...x, INP: Math.max(x.INP ?? 0, worst) }));
    }, { durationThreshold: 16 });
    const [nav] = performance.getEntriesByType('navigation');
    if (nav) setM((x) => ({ ...x, TTFB: nav.responseStart - nav.startTime }));
    return () => observers.forEach((o) => o.disconnect());
  }, []);
  return m;
}

function LiveVitals() {
  const m = useLiveVitals();
  const fmt = (k, v) => (v == null ? '측정 전' : k === 'CLS' ? v.toFixed(3) : `${Math.round(v)}ms`);
  const cards = [
    ['LCP', '가장 큰 요소가 그려진 시간'],
    ['INP', '지금까지 가장 느린 반응 (근사값)'],
    ['CLS', '레이아웃 이동 합계'],
    ['TTFB', '첫 바이트까지'],
  ];
  return (
    <Viz>
      <div className="grid grid-cols-2 gap-2 text-center text-sm md:grid-cols-4">
        {cards.map(([k, label]) => (
          <Stat key={k} label={`${k} · ${label}`} value={fmt(k, m[k])} tone={m[k] == null ? undefined : TONE[RATING[k](m[k])]} />
        ))}
      </div>
      <p className={`mt-3 text-sm ${ui.muted}`}>
        → 이 사이트는 SPA라서 LCP·TTFB는 <b>처음 들어온 페이지</b> 기준입니다. 다른 페이지에서 링크로 넘어왔다면 그 페이지의 값이에요.
        INP는 이 페이지에서 클릭·입력할 때마다 가장 느린 값으로 갱신됩니다.
      </p>
    </Viz>
  );
}

/* ---------- 데모: 일부러 CLS와 긴 작업 만들기 ---------- */

function ShiftAndBlockDemo() {
  const [banner, setBanner] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const m = useLiveVitals();

  const injectBanner = () => {
    setBanner(false);
    setTimeout(() => setBanner(true), 600); // 클릭 직후(500ms 이내)의 이동은 CLS에서 빠지므로 조금 늦게
  };
  const slowClick = () => {
    const t = performance.now();
    while (performance.now() - t < 300) {
      // 300ms 동안 메인 스레드를 막는 무거운 이벤트 핸들러
    }
    setBlocked(Math.round(performance.now() - t));
  };

  return (
    <Demo hint="버튼으로 나쁜 상황을 일부러 만들어 보세요. 위 '시각화'의 실측값과 아래 값이 같이 바뀝니다.">
      <div className="flex flex-wrap gap-2">
        <button className={ui.btnPrimary} onClick={injectBanner}>늦게 뜨는 배너 넣기 (CLS↑)</button>
        <button className={ui.btn} onClick={slowClick}>300ms 걸리는 클릭 (INP↑)</button>
      </div>
      {banner && (
        <div className="mt-3 rounded-lg bg-amber-100 p-6 text-sm font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
          갑자기 나타난 이벤트 배너! (아래 내용이 밀려납니다)
        </div>
      )}
      <p className="mt-3 text-sm">배너가 뜨면 이 문단과 아래 내용이 밀려납니다. 실제 사이트에서 광고·쿠키 배너가 이런 CLS를 만들어요.</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat label="현재 CLS" value={m.CLS.toFixed(3)} tone={TONE[RATING.CLS(m.CLS)]} />
        <Stat label="현재 INP (근사)" value={m.INP == null ? '측정 전' : `${Math.round(m.INP)}ms`} tone={m.INP == null ? undefined : TONE[RATING.INP(m.INP)]} />
        <Stat label="마지막 클릭 처리" value={blocked == null ? '-' : `${blocked}ms`} />
      </div>
      <p className={`mt-2 text-xs ${ui.muted}`}>Event Timing API는 Chrome·Edge·Firefox에서 지원됩니다. Safari에서는 INP가 '측정 전'으로 남을 수 있어요.</p>
    </Demo>
  );
}
