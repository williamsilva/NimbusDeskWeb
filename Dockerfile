# syntax=docker/dockerfile:1
# Nota (2026-09-07): achado real rodando docker compose build local depois da extração do
# @williamsilva/nimbus-web-commons - "npm error 401 Unauthorized ... authentication token not
# provided" no `npm ci`. O .npmrc do projeto precisa estar copiado ANTES do npm ci rodar, e
# NODE_AUTH_TOKEN precisa virar variável de ambiente de verdade (ARG sozinho não basta).
FROM node:22-alpine AS build
WORKDIR /workspace
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# "development" (não o default "production" do angular.json) - build alternativo sem live-reload
# (produção "de mentira", servido via nginx); o docker-compose local (ver ../docker-compose.yml)
# usa Dockerfile.dev (ng serve) pro serviço `web`, não este arquivo. Se você rodar esta imagem à
# mão, precisa do environment.ts (bffBaseUrl/apiBaseUrl = localhost:9093) em vez do
# environment.prod.ts (fileReplacement só existe na config "production"), senão a SPA fala com o
# backend de PRODUÇÃO e o CORS bloqueia a origem (mapeie o container pra localhost:4204, mesmo
# default do ng serve, ou ajuste CORS_ALLOWED_ORIGINS no backend pra bater com a porta escolhida).
RUN npm run build -- --configuration development

FROM nginx:1.27-alpine
COPY --from=build /workspace/dist/nimbusdesk/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
