# Q : Docker란 무엇이고, 프론트엔드에서는 어떻게 활용하나요?

<br />

# A : Docker는 애플리케이션과 실행에 필요한 환경(OS 라이브러리, Node 버전, 설정)을 이미지 하나로 묶어서, 어느 컴퓨터에서든 같은 방식으로 실행하게 해주는 컨테이너 도구입니다. 프론트엔드는 주로 빌드 결과물을 Nginx 이미지에 담아 배포하거나, 백엔드·DB를 로컬에 한 번에 띄워 개발 환경을 맞출 때 씁니다.

### 왜 쓰나

- "내 컴퓨터에선 되는데요" 문제를 없앤다. Node 버전, OS 패키지, 환경 설정까지 이미지에 같이 들어간다.
- 개발·스테이징·운영 서버가 **같은 이미지**를 실행하므로 환경 차이로 생기는 버그가 줄어든다.
- 새 팀원이 프로젝트를 받을 때 `docker compose up` 한 줄로 백엔드·DB까지 실행할 수 있다.

### 핵심 용어

| 용어 | 뜻 | 비유 |
|---|---|---|
| **Dockerfile** | 이미지를 만드는 순서를 적은 파일 | 레시피 |
| **이미지(Image)** | Dockerfile로 만든 실행 환경 + 앱 묶음. 읽기 전용 | 밀키트 |
| **컨테이너(Container)** | 이미지를 실행한 것. 하나의 이미지로 여러 개 실행 가능 | 조리된 요리 |
| **레지스트리(Registry)** | 이미지를 올려두는 저장소 (Docker Hub, AWS ECR, GitHub GHCR) | 창고 |
| **볼륨(Volume)** | 컨테이너가 지워져도 남는 데이터 저장소 (DB 데이터 등) | 외장 하드 |
| **docker compose** | 여러 컨테이너(프론트·API·DB)를 YAML 하나로 같이 실행 | 코스 요리 메뉴판 |

### 가상 머신(VM)과의 차이

| | 가상 머신 | 컨테이너 |
|---|---|---|
| 구조 | OS 전체(커널 포함)를 따로 띄움 | 호스트 OS의 커널을 같이 쓰고, 프로세스만 격리 |
| 크기 | 수 GB | 수십~수백 MB |
| 시작 시간 | 수십 초~분 | 1초 안팎 |

### 기본 명령어

```bash
docker build -t my-front .            # 현재 폴더의 Dockerfile로 이미지 만들기
docker run -d -p 8080:80 my-front     # 실행: 내 PC 8080 → 컨테이너 80 포트 연결
docker ps                             # 실행 중인 컨테이너 목록
docker logs -f <컨테이너>              # 로그 보기
docker exec -it <컨테이너> sh          # 컨테이너 안으로 들어가기
docker stop <컨테이너>                 # 중지
docker compose up -d                  # compose 파일의 서비스 전부 실행
```

### 프론트엔드 Dockerfile (멀티 스테이지)

빌드에는 Node가 필요하지만 실행에는 **빌드된 정적 파일과 Nginx만** 있으면 된다. 그래서 단계를 나눈다.

```dockerfile
# 1단계: 빌드 (node_modules, 소스 코드는 여기서만 쓰고 버림)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./   # 의존성 파일 먼저 → 바뀌지 않으면 npm ci 캐시 재사용
RUN npm ci
COPY . .
RUN npm run build

# 2단계: 실행 (최종 이미지에는 dist와 nginx만 남는다)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

- 이미지 크기: 한 단계로 만들면 node_modules까지 포함해 수백 MB, 멀티 스테이지면 수십 MB.
- `.dockerignore`에 `node_modules`, `dist`, `.git`을 적어 빌드에 불필요한 파일을 보내지 않는다.

### SPA라면 Nginx 설정이 필요하다

React Router 주소(`/react/hooks`)로 바로 들어오거나 새로고침하면 Nginx는 그런 파일이 없어서 404를 낸다. 없는 경로는 `index.html`을 주도록 설정한다.

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 주의할 점: 환경 변수는 빌드할 때 들어간다

- `VITE_API_URL`, `NEXT_PUBLIC_*` 같은 값은 **빌드 시점에 JS 파일 안에 글자로 박힌다.** `docker run -e VITE_API_URL=...`로 실행할 때 넣어도 바뀌지 않는다.
- 그래서 환경마다 `--build-arg`로 따로 빌드하거나, 실행할 때 `config.js`를 만들어 `window.__ENV__`로 읽는 방식을 쓴다.

### 프론트엔드에서 쓰는 경우

- **배포**: 이미지를 레지스트리에 올리고 EC2·ECS·Kubernetes에서 실행. GitHub Actions에서 `docker build` → `docker push`.
- **Next.js SSR**: Node 서버가 필요하므로 `output: 'standalone'`으로 빌드해서 `node server.js`를 실행하는 이미지를 만든다.
- **로컬 개발 환경**: 백엔드 API·DB·Redis를 `docker compose`로 띄우고 프론트만 `npm run dev`로 개발한다.
- **E2E 테스트**: Playwright 공식 이미지로 CI와 로컬의 브라우저 환경을 맞춘다.
- 참고: Vercel·Netlify에 정적 사이트를 배포한다면 Docker가 필요 없다. 플랫폼이 빌드와 배포를 대신 해준다.
