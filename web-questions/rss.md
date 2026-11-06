# Q : RSS란 무엇이고, 어떻게 동작하나요?

<br />

# A : RSS는 사이트가 새 글 목록을 정해진 형식의 XML 파일(피드)로 공개하고, 구독하는 쪽(RSS 리더, 다른 서비스)이 그 파일을 주기적으로 받아 새 글이 생겼는지 확인하는 방식입니다. 사이트를 매번 직접 방문하지 않아도 여러 사이트의 새 글을 한 곳에서 받아볼 수 있고, 피드를 만드는 쪽은 XML 파일 하나만 공개하면 됩니다.

### 한 줄로

- **RSS = 사이트의 "새 글 목록"을 기계가 읽을 수 있게 만든 XML 파일**. 보통 `/rss.xml`, `/feed.xml` 같은 주소에 둔다.
- 이름은 Really Simple Syndication(정말 간단한 배포)의 줄임말이다. 지금 쓰는 것은 대부분 **RSS 2.0**이다.

### 동작 방식

1. 사이트가 글을 올릴 때마다(또는 빌드할 때) 피드 XML을 새로 만든다.
2. 사용자는 RSS 리더(Feedly, Inoreader, NetNewsWire 등)에 피드 주소를 등록한다 = **구독**.
3. 리더가 몇 분~몇 시간마다 피드를 다시 받아서, 처음 보는 글(`guid` 기준)이 있으면 새 글로 보여준다.

- 사이트가 알림을 "보내는" 것이 아니라, 리더가 주기적으로 "가져가는"(polling) 방식이다. 그래서 서버는 정적 파일 하나만 있으면 되고, 구독자 목록도 관리하지 않는다.
- 이메일 구독과 달리 개인정보가 필요 없고, 구독 해지는 리더에서 지우기만 하면 된다.

### 피드 XML 생김새 (RSS 2.0)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>프론트엔드 면접 질문</title>                <!-- 필수 -->
    <link>https://front-study-note.vercel.app</link>    <!-- 필수: 사이트 주소 -->
    <description>새로 추가된 질문</description>        <!-- 필수 -->
    <language>ko</language>
    <lastBuildDate>Fri, 06 Nov 2026 11:49:04 GMT</lastBuildDate>

    <item>
      <title>MDX와 Fumadocs는 무엇이 다른가요?</title>
      <link>https://front-study-note.vercel.app/react/mdx-vs-fumadocs</link>
      <guid isPermaLink="true">https://front-study-note.vercel.app/react/mdx-vs-fumadocs</guid>
      <pubDate>Fri, 06 Nov 2026 11:49:04 GMT</pubDate>
      <description>MDX는 문서 형식과 변환기이고, Fumadocs는 문서 사이트 프레임워크입니다.</description>
    </item>
  </channel>
</rss>
```

| 요소 | 뜻 |
|---|---|
| `<channel>`의 `title`, `link`, `description` | **필수**. 피드(사이트) 이름, 사이트 주소, 설명 |
| `<item>` | 글 하나. `title`이나 `description` 중 **하나는 꼭** 있어야 한다 |
| `guid` | 글의 고유 ID. 리더가 "이미 본 글인지" 판단하는 기준. 주소를 바꾸면 리더가 새 글로 착각하므로 한 번 정하면 바꾸지 않는다 |
| `pubDate` | 발행 시각. `Fri, 06 Nov 2026 11:49:04 GMT` 형식(RFC 822). JS에서는 `new Date().toUTCString()` |
| `enclosure` | 첨부 파일(`url`, `length`, `type`). 팟캐스트가 오디오 파일을 이렇게 싣는다 |

### RSS와 Atom

| | RSS 2.0 | Atom 1.0 |
|---|---|---|
| 정체 | RSS Advisory Board가 관리하는 사양 (2.0.11) | IETF 표준 (RFC 4287) |
| 루트 | `<rss version="2.0"><channel>` | `<feed xmlns="http://www.w3.org/2005/Atom">` |
| 글 하나 | `<item>` | `<entry>` (`id`, `title`, `updated` 필수) |
| 날짜 형식 | RFC 822 (`Fri, 06 Nov 2026 …`) | RFC 3339 (`2026-11-06T11:49:04Z`) |
| 미디어 타입 | `application/rss+xml` | `application/atom+xml` |

- 둘 다 거의 모든 리더가 읽는다. 사양이 더 엄격한 쪽은 Atom이고, 널리 쓰이는 쪽은 RSS 2.0이다. 둘 다 제공하는 사이트도 많다.
- 비슷한 것으로 **JSON Feed**(같은 내용을 JSON으로)가 있다.

### 프론트엔드에서 피드 만들기

- 피드는 대부분 **빌드할 때 정적 파일로 만든다**. 글 목록(md 파일, CMS 데이터)을 읽어 XML 문자열을 만들고 `public/rss.xml`(또는 `dist/rss.xml`)로 저장한다.
- 직접 문자열로 만들 수도 있고, `feed` 같은 npm 패키지를 쓰면 RSS·Atom·JSON Feed를 한 번에 만들 수 있다.
- Next.js App Router에서는 `app/rss.xml/route.ts`에서 XML을 돌려주면 된다.

```ts
// app/rss.xml/route.ts
export async function GET() {
  const posts = await getPosts();
  const items = posts
    .map((p) => `<item>
  <title><![CDATA[${p.title}]]></title>
  <link>https://example.com/blog/${p.slug}</link>
  <guid>https://example.com/blog/${p.slug}</guid>
  <pubDate>${new Date(p.date).toUTCString()}</pubDate>
</item>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>내 블로그</title><link>https://example.com</link><description>새 글</description>
  ${items}
</channel></rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
```

- 제목·본문에 `<`, `&` 같은 문자가 있으면 XML이 깨진다. `<![CDATA[ ... ]]>`로 감싸거나 `&lt;`, `&amp;`로 바꿔야 한다.
- **자동 발견(autodiscovery)**: HTML `<head>`에 아래 한 줄을 넣으면, 사용자가 사이트 주소만 리더에 넣어도 리더가 피드를 찾아낸다.

```html
<link rel="alternate" type="application/rss+xml" title="RSS" href="https://example.com/rss.xml" />
```

### 어디에 쓰이나

- 블로그·뉴스 구독 (velog, 티스토리, 대부분의 기술 블로그가 피드를 제공한다)
- **팟캐스트**: 팟캐스트 앱은 RSS 피드의 `enclosure`(오디오 파일)를 읽어서 에피소드를 받아온다.
- 자동화: Slack·Discord 봇, GitHub README의 "최근 글" 목록, Zapier 같은 도구가 피드를 읽어 새 글 알림을 보낸다.
- GitHub 릴리스, YouTube 채널, Reddit 등도 피드 주소를 제공한다.

### 참고: 이 사이트는?

- 이 사이트는 지금 피드를 만들지 않는다. 대신 홈 화면의 "최근 추가된 질문"과 NEW 라벨로 새 질문을 보여준다.
- 피드를 추가한다면 빌드할 때 질문 목록과 등록일(`src/data/added.json`)로 `dist/rss.xml`을 만들면 된다.

### 관련 질문

- [SEO란 뭔가요?](./SEO.md)
- [SPA의 특징과, 이전에 사용하던 방식(MPA) 대비 장점은 무엇인가요?](./spa-mpa.md)

### 참고

- [RSS 2.0 Specification (RSS Advisory Board)](https://www.rssboard.org/rss-specification)
- [RSS Autodiscovery (RSS Advisory Board)](https://www.rssboard.org/rss-autodiscovery)
- [RFC 4287 — The Atom Syndication Format](https://datatracker.ietf.org/doc/html/rfc4287)
