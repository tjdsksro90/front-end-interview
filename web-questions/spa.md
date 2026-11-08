# Q : CSR과SSR의 차이점에 대해서 설명해주세요.

<br />

# A : CSR과 SSR의 가장 큰 차이점은 어디서 렌더링을 진행하냐에 따라 차이가 생깁니다.

**CSR의 경우 말그대로 클라이언트 측에서 모든 렌더링이 이루어집니다.**

- 이로인해 초기로딩 속도는 상대적으로 SSR보다 느리지만, 모든 리소스를 한번에 받아오게 되므로, 이후 페이지 이동은 빠르게 처리됩니다.
- CSR은 또 다른 약점이 존재하게 되는데, CSR 방식에서는 초기에 빈 HTML을 불러와 이후 JavaScript를 통해 동적으로 렌더링을 진행합니다. 이 과정에서 검색 엔진이 페이지를 크롤링 할때 JavaScript가 완전히 로드되지 않은 상태를 크롤링할 가능성이 있어, SEO에 부정적인 영향을 끼칠 수 있습니다.

<br />

**SSR은 서버에서 HTML을 생성 후 클라이언트로 보내주는 방식입니다. 이로인해 초기 로딩 속도는 CSR에 비해 빠르지만, 페이지가 이동할 때마다 새로운 HTML을 요청하므로, CSR보다 페이지 이동이 느려질 수 있습니다.**

- 반면 SEO 관점에선 유리한데 그 이유는 HTML이 이미 서버에서 완전히 렌더링 된 상태로 클라이언트에 전달되므로 검색엔진이 페이지를 크롤링 할때 완전한 내용을 크롤링할 수 있게됩니다.

<br />

**여기에 더해, HTML을 "언제" 만드느냐에 따라 SSG와 ISR이라는 방식도 있습니다.**

CSR·SSR이 "어디서" 렌더링하는지로 나뉜다면, SSG·ISR은 서버(빌드 환경)에서 HTML을 만들되 **요청이 올 때마다가 아니라 미리 만들어 두는** 방식입니다.

<br />

**SSG(Static Site Generation)는 빌드할 때 모든 페이지의 HTML을 미리 만들어 두는 방식입니다.**

- 요청이 오면 이미 만들어진 HTML 파일을 그대로 보내므로 가장 빠르고, CDN에 올려 캐싱하기도 좋습니다. 서버에서 매번 렌더링하지 않으니 서버 부담도 거의 없습니다.
- HTML에 내용이 다 들어 있으므로 SSR처럼 SEO에도 유리합니다.
- 대신 내용이 바뀌면 **다시 빌드해서 배포해야** 반영됩니다. 그래서 블로그, 문서, 회사 소개 페이지처럼 내용이 자주 바뀌지 않는 페이지에 맞고, 페이지 수가 아주 많으면 빌드 시간이 길어집니다.

<br />

**ISR(Incremental Static Regeneration)은 SSG로 만든 페이지를 정해진 시간마다 다시 만들어 주는 방식입니다.**

- SSG처럼 미리 만든 HTML을 보내지만, 설정한 시간(예: 60초)이 지나면 페이지를 새로 만듭니다. 전체를 다시 빌드하지 않고 **해당 페이지만** 다시 만든다는 점이 "Incremental"의 의미입니다.
- 시간이 지난 뒤 첫 요청에는 **기존(오래된) 페이지를 먼저 보내고**, 뒤에서 새 페이지를 만듭니다. 그다음 요청부터 새 페이지가 나갑니다(stale-while-revalidate). 다시 만들다 실패하면 마지막으로 성공한 페이지를 계속 보냅니다.
- 시간을 기다리지 않고, 글을 수정한 순간 바로 다시 만들게 할 수도 있습니다(on-demand revalidation).
- 상품 목록, 뉴스처럼 "가끔 바뀌지만 매 요청마다 새로 만들 필요는 없는" 페이지에 맞습니다.
- 페이지를 다시 만들 서버가 필요하므로, 순수 정적 파일로만 내보내는 배포(Next.js의 `output: 'export'`)에서는 쓸 수 없습니다.

```tsx
// Next.js App Router 예시: app/posts/[id]/page.tsx
export const revalidate = 60; // 60초가 지나면 다음 요청 때 다시 만든다 (ISR)

export async function generateStaticParams() {
  // 빌드할 때 미리 만들 페이지 목록 (SSG)
  const posts = await fetch('https://api.example.com/posts').then((r) => r.json());
  return posts.map((post) => ({ id: String(post.id) }));
}

export default async function Page({ params }) {
  const { id } = await params;
  const post = await fetch(`https://api.example.com/posts/${id}`).then((r) => r.json());
  return <h1>{post.title}</h1>;
}
```

```ts
// 글을 수정한 직후 바로 다시 만들기 (on-demand)
'use server';
import { revalidatePath } from 'next/cache';

export async function updatePost(id: string) {
  // ... DB 수정
  revalidatePath(`/posts/${id}`); // 다음 요청 때 이 페이지를 새로 만든다
}
```

<br />

**한눈에 비교**

| | CSR | SSR | SSG | ISR |
|---|---|---|---|---|
| HTML을 만드는 곳 | 브라우저 | 서버 | 서버(빌드 환경) | 서버(빌드 환경 + 이후 서버) |
| HTML을 만드는 시점 | JS를 받은 뒤 | 요청마다 | 빌드할 때 한 번 | 빌드할 때 + 정해진 시간마다 |
| 초기 로딩 | 느림 (빈 HTML → JS 실행) | 빠름 (서버 렌더링 시간만큼 대기) | 가장 빠름 | 가장 빠름 |
| 데이터 최신성 | 항상 최신 | 항상 최신 | 다시 빌드해야 반영 | 정해진 시간만큼 늦을 수 있음 |
| SEO | 불리 | 유리 | 유리 | 유리 |
| 서버 부담 | 적음 (정적 파일만) | 큼 (요청마다 렌더링) | 거의 없음 | 적음 |
| 어울리는 페이지 | 대시보드, 로그인 뒤 화면 | 사용자마다 다른 페이지, 실시간 데이터 | 블로그, 문서, 소개 페이지 | 상품·뉴스 목록 |

- 실제로는 하나만 고르기보다 **페이지마다 섞어서** 씁니다. 예를 들어 Next.js에서는 소개 페이지는 SSG, 상품 페이지는 ISR, 마이페이지는 SSR이나 CSR로 만들 수 있습니다.
- SSR·SSG·ISR로 받은 HTML도 브라우저에서 JS가 붙는 과정(hydration)을 거친 뒤에는 CSR처럼 동작합니다. 그래서 첫 화면은 빠르게, 이후 페이지 이동은 CSR처럼 빠르게 처리할 수 있습니다.

### 참고

- [Incremental Static Regeneration (Next.js 문서)](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
