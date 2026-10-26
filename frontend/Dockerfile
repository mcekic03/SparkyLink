# syntax=docker/dockerfile:1
#
# SparkyLink - web. Viseslojni build: pnpm install + vite build (produkcioni mod),
# pa nginx servira staticki SPA build i prosledjuje /api i /up backendu
# (sparky-api). API je na istom domenu kao sajt, pa adresa API-ja ne ulazi u build.

FROM node:24-slim AS build
WORKDIR /app

ENV PNPM_ALLOW_SCRIPTS=true \
    NODE_OPTIONS="--max-old-space-size=4096" \
    CI=true

RUN npm install -g pnpm@11.13.0

# Prvo manifesti, da se sloj sa zavisnostima kesira nezavisno od koda.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/tsconfig/package.json packages/tsconfig/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @app/web build


FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz > /dev/null || exit 1
