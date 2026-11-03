import { Link } from 'react-router-dom';
import { Section, H3, List, Code, OneLiner, WhenToUse, Callout, Table, CodeBlock } from '../components/kit.jsx';
import { WhereToCheck, Screen } from '../components/screens.jsx';

export default function NetworkCache() {
  return (
    <>
      <Section step={1} title="개념">
        <OneLiner>
          네트워크 최적화는 네 가지입니다. <u>한 번 받은 건 다시 받지 않고(Cache-Control), 가까운 서버에서 받고(CDN), 작게 받고(압축), 필요할 걸 미리 받는다(Preload/Prefetch).</u>
        </OneLiner>

        <H3>Cache-Control — 브라우저가 얼마나 재사용할지</H3>
        <Table
          head={['값', '뜻', '주로 쓰는 곳']}
          rows={[
            [<Code>max-age=31536000, immutable</Code>, '1년간 서버에 묻지도 않고 재사용', <>파일명에 해시가 붙은 JS/CSS/이미지 (<Code>main.3f9a1c.js</Code>) — 내용이 바뀌면 이름이 바뀌니까 안전</>],
            [<Code>no-cache</Code>, '저장은 하되, 쓸 때마다 서버에 "바뀌었어?" 확인 (ETag) → 안 바뀌었으면 304로 본문 없이 응답', 'index.html — 새 배포를 바로 반영해야 함'],
            [<Code>no-store</Code>, '아예 저장하지 않음', '개인정보, 결제 화면'],
            [<Code>s-maxage=60</Code>, 'CDN(공유 캐시)에서만 60초', 'SSR/ISR 응답'],
            [<Code>stale-while-revalidate=300</Code>, '만료 후 300초간은 낡은 것을 주면서 뒤에서 갱신', 'API, ISR 페이지'],
          ]}
        />
        <Callout type="tip" title="면접 포인트: 해시 파일명 + 긴 캐시, HTML은 짧게">
          <p>정적 파일은 <b>파일명에 내용 해시</b>를 넣고 1년 캐시, HTML은 <b>no-cache</b>로 매번 확인. 그러면 배포하면 새 HTML이 새 파일명을 가리켜서 캐시 문제 없이 바로 반영되고, 안 바뀐 파일은 계속 캐시에서 씁니다.</p>
        </Callout>

        <H3>CDN</H3>
        <List
          items={[
            <>전 세계에 퍼진 엣지 서버에 파일을 복사해 두고, 사용자와 <b>가장 가까운 곳</b>에서 응답한다 → 왕복 시간(RTT)과 원본 서버 부하가 줄어든다.</>,
            <>CDN이 캐시할지는 원본 응답의 <Code>Cache-Control</Code>(특히 <Code>s-maxage</Code>)로 정한다. 배포 후 갱신이 필요하면 <b>캐시 무효화(purge)</b>.</>,
            <>예: CloudFront, Cloudflare, Vercel Edge Network(이 사이트), Fastly.</>,
          ]}
        />

        <H3>압축 (Compression)</H3>
        <List
          items={[
            <>텍스트 파일(HTML, JS, CSS, JSON)을 gzip이나 <b>Brotli</b>(gzip보다 15~20% 더 작음)로 압축해서 보낸다. 보통 원본의 20~30% 크기.</>,
            <>브라우저가 <Code>Accept-Encoding: gzip, br</Code>로 지원 목록을 보내면, 서버가 <Code>Content-Encoding: br</Code>로 응답.</>,
            <>이미지(JPEG, PNG, WebP)는 이미 압축된 포맷이라 gzip을 또 해도 거의 안 줄어든다 → 이미지는 포맷과 크기로 줄인다 (<Link className="text-indigo-600 dark:text-indigo-400" to="/project/project-opti/deep/nextjs-image">Next.js Image 심화</Link>: WebP, Lazy Loading).</>,
          ]}
        />

        <H3>리소스 힌트 — Preload, Prefetch, Preconnect</H3>
        <Table
          head={['힌트', '뜻', '예']}
          rows={[
            [<Code>preload</Code>, '지금 페이지에서 곧 필요 → 최우선으로 바로 받기', 'LCP 히어로 이미지, 첫 화면 웹폰트'],
            [<Code>prefetch</Code>, '다음 페이지에서 쓸 것 → 한가할 때 낮은 우선순위로', '다음에 갈 확률이 높은 페이지의 JS (Next.js Link가 자동으로)'],
            [<Code>preconnect</Code>, '다른 도메인에 미리 연결(DNS+TCP+TLS)만 해두기', 'API 서버, 이미지 CDN, 폰트 서버'],
            [<Code>dns-prefetch</Code>, 'DNS 조회만 미리', 'preconnect보다 가벼운 버전'],
          ]}
        />

        <H3>그래서 언제 쓰나? (제일 중요)</H3>
        <WhenToUse
          use={[
            <><b>정적 파일 배포</b>: 해시 파일명 + 긴 max-age (Vite/Next.js는 해시를 자동으로 붙여줌)</>,
            <><b>사용자가 여러 지역</b>에 있거나 트래픽이 많을 때: CDN</>,
            <><b>LCP가 느린데 원인이 히어로 이미지/폰트</b>일 때: preload</>,
            '외부 도메인 리소스를 쓰는데 첫 요청이 느릴 때: preconnect',
          ]}
          avoid={[
            '모든 것을 preload — 우선순위가 다 높으면 아무것도 빨라지지 않고 정말 필요한 것이 밀린다',
            'HTML에 긴 max-age — 배포해도 사용자가 옛 화면을 본다',
            '개인 데이터 API를 CDN(public)으로 캐시 — 다른 사람에게 노출될 수 있다 (private / no-store)',
          ]}
        />
      </Section>

      <Section step={2} title="확인 경로·화면 예시">
        <WhereToCheck
          items={[
            { where: '캐시 헤더와 캐시 사용 여부', path: ['F12', 'Network', '파일 클릭', 'Headers', 'Response Headers'], what: 'cache-control, etag, age(CDN에 머문 시간), x-vercel-cache / cf-cache-status(HIT, MISS). Size 열에 "(disk cache)", "(memory cache)"면 브라우저 캐시 사용, Status 304면 확인만 하고 재사용.' },
            { where: '압축 여부와 효과', path: ['F12', 'Network', '파일 클릭', 'Headers'], what: 'content-encoding: br / gzip. 목록의 Size 열에 마우스를 올리면 전송 크기와 실제 크기를 비교할 수 있다.' },
            { where: '캐시 없이 처음 방문처럼 보기', path: ['F12', 'Network', 'Disable cache 체크', '새로고침'], what: '캐시 효과를 비교할 때. 강력 새로고침은 Ctrl+Shift+R.' },
            { where: 'preload/prefetch가 효과 있는지', path: ['F12', 'Network', 'Priority 열 추가(열 제목 우클릭)'], what: 'preload는 High, prefetch는 Lowest로 요청된다. Lighthouse의 "LCP 이미지 미리 로드" 진단도 참고.' },
          ]}
        />
        <Screen title="DevTools — Network">
          <table className="w-full min-w-[640px] text-left font-mono">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-800"><tr>{['Name', 'Status', 'Type', 'Size', 'Priority'].map((h) => <th key={h} className="px-3 py-1.5 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['front-study-note.vercel.app', '200', 'document', '3.1 kB', 'Highest'],
                ['index-B7Y_lvNf.js', '200', 'script', '(disk cache)', 'High'],
                ['index-qkF_7nTq.css', '200', 'stylesheet', '(memory cache)', 'Highest'],
                ['hero.webp', '200', 'image', '48.2 kB', 'High'],
                ['Webpack-DAL12bvP.js', '304', 'script', '312 B', 'Lowest'],
              ].map((r, i) => (
                <tr key={i} className={`border-t border-zinc-100 dark:border-zinc-800 ${i === 1 ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}>
                  {r.map((c, j) => <td key={j} className="px-3 py-1.5">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-zinc-200 p-3 font-mono leading-relaxed dark:border-zinc-700">
            <div className="mb-1 text-zinc-400">▼ Response Headers — index-B7Y_lvNf.js</div>
            <div>cache-control: public, max-age=31536000, immutable</div>
            <div>content-encoding: br</div>
            <div>etag: "a8f3c1..."</div>
            <div>x-vercel-cache: HIT</div>
            <div>age: 3021</div>
          </div>
        </Screen>
      </Section>

      <Section step={3} title="코드">
        <CodeBlock
          code={`
<!-- 리소스 힌트 (HTML head) -->
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high" />
<link rel="preload" href="/fonts/pretendard.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preconnect" href="https://api.example.com" />
<link rel="prefetch" href="/assets/Dashboard-x8f2.js" />`}
        />
        <CodeBlock
          title="nginx.conf — 압축 + 캐시"
          code={`
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
# brotli on;  (ngx_brotli 모듈 필요)

location /assets/ {                      # 해시 파일명 정적 파일
  add_header Cache-Control "public, max-age=31536000, immutable";
}
location / {                             # index.html
  add_header Cache-Control "no-cache";
  try_files $uri /index.html;
}`}
        />
        <CodeBlock
          title="vercel.json / Next.js — 헤더 지정"
          code={`
// vercel.json
{ "headers": [{ "source": "/fonts/(.*)",
  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }] }

// Next.js API 응답을 CDN에 60초, 이후 5분간 SWR
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');`}
        />
      </Section>
    </>
  );
}
