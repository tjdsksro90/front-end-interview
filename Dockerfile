# 이 사이트를 Docker 이미지로 만드는 예시 (실제 배포는 Vercel)
#   docker build -t front-study .
#   docker run --rm -p 8080:80 front-study   →  http://localhost:8080

# 1단계: 빌드 — Node와 node_modules는 여기서만 쓰고 최종 이미지에는 넣지 않는다
FROM node:22-alpine AS build
WORKDIR /app
# 의존성 파일만 먼저 복사: package*.json이 그대로면 npm ci 레이어를 캐시로 재사용한다
COPY package.json package-lock.json ./
RUN npm ci
# 소스는 나중에 복사: md나 코드만 바뀌면 여기부터 다시 실행된다
COPY . .
RUN npm run build

# 2단계: 실행 — 빌드된 정적 파일(dist)과 Nginx만 남긴다
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
