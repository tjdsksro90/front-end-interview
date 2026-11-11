# Q : Next.js의 LTS 정책은 어떻게 되고, 보안 패치는 어떻게 대응하나요?

<br />

# A : Next.js는 가장 최신 메이저 버전을 **Active LTS**로, 바로 전 메이저 버전을 **Maintenance LTS**로 지원합니다. Active LTS는 새 기능·버그 수정·보안 패치를 모두 받고, Maintenance LTS는 출시 후 2년 동안 치명적인 버그 수정과 보안 업데이트만 받습니다. 2026년 11월 기준으로 16.x가 Active LTS, 15.x가 Maintenance LTS(보안 릴리스는 2027년 1월 31일까지 연장)이고, 14.x 이하는 지원이 끝났습니다. 보안 대응은 공식 블로그와 GitHub Security Advisories로 공지를 확인하고, 쓰고 있는 메이저 버전 라인의 **패치 버전으로 바로 올리는 것**이 기본입니다. 최근 React Server Components 원격 코드 실행 취약점(CVE-2025-66478)처럼 우회 방법이 없고 업그레이드만이 해결책인 경우도 있어서, 지원이 끝난 버전에 머물러 있으면 패치를 받을 수 없다는 점이 가장 큰 위험입니다.

### 지원 버전 (2026년 11월 기준)

| 버전 | 상태 | 출시일 | 받는 것 |
|---|---|---|---|
| 16.x | **Active LTS** | 2025.10.21 | 새 기능, 버그 수정, 성능 개선, 보안 패치 |
| 15.x | **Maintenance LTS** | 2024.10.21 | 치명적인 버그 수정, 필수 보안 업데이트 (보안 릴리스 2027.01.31까지) |
| 14.x 이하 | 지원 종료 | 2023.10.26 | 원칙적으로 없음 |

- **Active LTS**: 다음 메이저 버전이 나올 때까지 유지된다.
- **Maintenance LTS**: 각 메이저 버전은 첫 출시 후 2년 동안 유지된다. 15.x는 원래 2026년 10월 21일까지였지만 보안 릴리스가 2027년 1월 31일까지 연장됐다.
- Maintenance LTS 업데이트는 깨지는 변경이 있더라도 **semver-minor**로 나온다고 명시돼 있다. 마이너 업데이트라도 릴리스 노트를 확인해야 한다.
- 지원이 끝난 버전도 드물게 패치하는 경우가 있지만 보장되지 않는다.
- canary 채널은 매일 나오는 미리보기 버전이라 운영 환경에서 쓰지 않는다.

### 최근 보안 이슈 예시

**CVE-2025-66478 (2025년 12월, CVSS 10.0)**

- React Server Components 프로토콜의 취약점으로, 패치하지 않은 환경에서 공격자가 보낸 요청을 처리하다 **원격 코드 실행**이 가능했다. (React 쪽 CVE-2025-55182)
- 영향: Next.js 15.x, 16.x의 App Router, 14.3.0-canary.77 이후 canary. Next.js 13.x, 14.x 안정 버전, Pages Router, Edge Runtime은 영향 없음.
- 해결: 쓰고 있는 버전 라인의 패치 버전으로 업그레이드(15.0.5, 15.1.9, 15.2.6, 15.3.6, 15.4.8, 15.5.7, 16.0.7). 공지에서 "우회 방법은 없고 업그레이드가 필수"라고 했다.
- 패치 전에 서비스가 노출돼 있었다면 **환경 변수·API 키 같은 비밀값도 교체**하라고 권고했다.

**2026년 11월 보안 릴리스 (16.4.5 / 15.5.29)**

- `use cache`·`unstable_cache` 조합에서 다른 사용자·테넌트의 캐시 데이터가 노출되는 문제
- HTTP/1.1 리버스 프록시 뒤에서 다른 클라이언트 응답이 섞이는 문제
- Edge 라우트에서 `x-middleware-set-cookie`로 HttpOnly 쿠키 값이 노출되는 문제
- Image Optimization의 SVG 차단 우회
- 캐시 기능이 늘어날수록 "다른 사용자의 데이터가 캐시를 통해 보이는" 유형의 취약점이 많아지고 있다.

### 실무 대응 방법

1. **공지 받기**
   - Next.js 블로그의 Security Release 글 (예고 글이 먼저 올라오고, 보통 며칠 안에 릴리스된다)
   - GitHub `vercel/next.js` 저장소의 Security 탭(Advisories). 저장소를 Watch → Custom → Security alerts로 구독
   - GitHub Dependabot 알림, `npm audit`
2. **영향 확인**: 공지에서 영향받는 버전, 기능(App Router인지, `use cache`를 쓰는지, 셀프 호스팅인지)을 보고 우리 서비스가 해당되는지 확인한다.
3. **같은 라인의 패치 버전으로 업그레이드**
   ```bash
   npm install next@15.5.29   # 15.x를 쓰는 경우
   npm install next@16.4.5    # 16.x를 쓰는 경우
   ```
   - 메이저 업그레이드는 시간이 걸리므로, 급할 때는 **지금 메이저 라인의 패치**부터 적용한다. 그래서 지원 중인 라인에 있는 것이 중요하다.
   - `react`, `react-dom`도 함께 올려야 하는 경우가 있다(RSC 취약점처럼 원인이 React에 있을 때).
4. **배포 후 조치**: 필요하면 비밀값 교체, 로그에서 이상 요청 확인.
5. **평소 관리**
   - 메이저 버전이 Maintenance LTS에 들어가면 다음 메이저로 올릴 계획을 세운다.
   - lock 파일을 커밋하고, Renovate·Dependabot으로 패치 업데이트 PR을 자동으로 받는다.
   - 업그레이드를 빠르게 검증할 수 있도록 E2E·스모크 테스트를 갖춰 둔다.

### 취약점 제보

- Next.js 오픈소스 취약점은 `responsible.disclosure@vercel.com`으로 제보하라고 안내한다. 공개 이슈로 올리지 않는다.

- 면접 답변 요약: "Next.js는 최신 메이저를 Active LTS로, 이전 메이저를 Maintenance LTS로 지원합니다. 지금은 16이 Active LTS, 15가 Maintenance LTS이고 14 이하는 지원이 끝났습니다. Maintenance LTS는 출시 후 2년 동안 치명적인 버그와 보안 패치만 받습니다. 보안 공지는 Next.js 블로그와 GitHub Security Advisories, Dependabot으로 받고, 영향 범위를 확인한 뒤 같은 메이저 라인의 패치 버전으로 바로 올립니다. RSC 원격 코드 실행 취약점처럼 우회 방법 없이 업그레이드만 답인 경우가 있어서, 지원 중인 버전 라인을 유지하는 것이 가장 중요하다고 생각합니다."

### 관련 질문

- [Next.js는 버전별로 무엇이 바뀌었나요? (Pages Router → App Router)](./nextjs-versions.md)
- [Server Component와 Client Component의 역할은 무엇인가요?](./server-client-component.md)

### 참고

- [Support Policy (Next.js)](https://nextjs.org/support-policy)
- [Security Advisory: CVE-2025-66478 (Next.js 블로그)](https://nextjs.org/blog/CVE-2025-66478)
- [November 2026 Security Release (Next.js 블로그)](https://nextjs.org/blog/november-2026-security-release)
- [Security (vercel/next.js GitHub)](https://github.com/vercel/next.js/security)
