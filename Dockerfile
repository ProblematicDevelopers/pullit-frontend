# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# 빌드된 파일만 복사하는 최종 스테이지
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

# 빌드된 dist 폴더만 복사
COPY --from=builder /app/dist ./dist

# Volume으로 dist 폴더 노출
VOLUME ["/app/dist"]