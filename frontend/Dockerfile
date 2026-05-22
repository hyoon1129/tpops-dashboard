# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Nginx ───────────────────────────────────────────────────────────
FROM nginx:alpine
ENV TZ=Asia/Seoul
ENV BACKEND_HOST=tpops-backend
ENV BACKEND_PORT=8080

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
