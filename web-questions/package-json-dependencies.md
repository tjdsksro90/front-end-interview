# Q : package.json의 dependencies와 devDependencies는 각각 어떤 패키지들이고, 왜 나뉘어 있을까요?

<br />

# A : dependencies는 앱이 실행될 때(브라우저나 서버에서 동작할 때) 필요한 패키지이고, devDependencies는 개발하고 빌드하고 테스트할 때만 필요한 패키지입니다. 나누는 이유는 운영 환경에 필요한 것만 설치해서 설치 시간과 용량, 보안 위험을 줄이고, 다른 사람이 봤을 때 이 패키지가 실행에 쓰이는지 도구인지 바로 알 수 있게 하기 위해서입니다.

### 무엇이 어디에 들어가나

| | dependencies | devDependencies |
|---|---|---|
| 기준 | 실행할 때 코드가 `import`해서 쓰는 것 | 개발·빌드·검사할 때만 쓰는 도구 |
| 예시 | `react`, `react-dom`, `next`, `@tanstack/react-query`, `zustand`, `axios` | `typescript`, `@types/*`, `eslint`, `prettier`, `vitest`, `@testing-library/*`, `tailwindcss`(빌드 도구), `msw` |
| 설치 명령 | `npm i axios` | `npm i -D vitest` |
| `npm ci --omit=dev` | 설치됨 | **설치 안 됨** |

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "@types/react": "^19.2.0",
    "eslint": "^9.0.0",
    "tailwindcss": "^4.1.0"
  }
}
```

### 왜 나누나

- **운영 서버를 가볍게**: Next.js 서버나 Node 서버를 띄울 때는 `npm ci --omit=dev`로 실행에 필요한 것만 설치한다. TypeScript, ESLint, 테스트 도구는 빠지므로 설치가 빠르고 Docker 이미지도 작아진다.
- **보안**: 운영 환경에 깔린 패키지가 적을수록 취약점 검사 대상도 줄어든다. `npm audit --omit=dev`로 실제 실행되는 패키지만 따로 점검할 수 있다.
- **라이브러리를 배포할 때**: 내가 만든 패키지를 다른 사람이 설치하면 **dependencies만 같이 설치**되고 devDependencies는 설치되지 않는다. 그래서 라이브러리에서는 이 구분이 실제로 동작에 영향을 준다.
- **읽기 쉬움**: 어떤 패키지가 앱 기능이고 어떤 게 도구인지 한눈에 보인다.

### 프론트엔드에서 헷갈리는 점

- 브라우저에서 동작하는 정적 사이트(Vite, CRA)는 **빌드할 때 번들러가 필요한 코드만 묶어서** 결과물(dist)을 만든다. 실행할 때 node_modules를 쓰지 않으므로, 패키지를 잘못 분류해도 결과물은 똑같이 동작한다. 그래도 관례대로 나눠야 의도가 드러난다.
- 반대로 **Next.js처럼 서버에서 실행**되는 앱은 운영 서버에서 `next start`가 node_modules를 사용한다. 실행에 필요한 패키지를 devDependencies에 넣고 `--omit=dev`로 설치하면 서버가 시작되지 않는다.
- Vercel 같은 배포 플랫폼은 빌드할 때 devDependencies까지 설치한다. 빌드에는 TypeScript, Tailwind 같은 도구가 필요하기 때문이다.

### 함께 알아두면 좋은 것

- **peerDependencies**: "이 라이브러리를 쓰려면 사용하는 쪽에 이 패키지가 있어야 한다"는 뜻. 예를 들어 React 컴포넌트 라이브러리는 `react`를 직접 넣지 않고 peerDependencies로 둬서, 앱에 React가 두 벌 설치되지 않게 한다.
- **optionalDependencies**: 설치에 실패해도 전체 설치가 멈추지 않는 패키지 (OS별 바이너리 등).
- **버전 표기**: `^19.1.0`은 19.x.x 안에서 업데이트 허용, `~19.1.0`은 19.1.x만 허용. 실제로 설치된 정확한 버전은 `package-lock.json`에 기록된다.

### 관련 질문

- [모듈 번들러와 트랜스파일러에 대해서 설명해주세요](./bundler-tarnspiler.md)
- [Docker란 무엇이고, 프론트엔드에서는 어떻게 활용하나요?](./docker.md)
