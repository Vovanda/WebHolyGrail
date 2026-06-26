# syntax=docker/dockerfile:1.7

# Payload 3.x (Next 15) — multi-stage build.
# Запускается отдельным контейнером, монорепо-shared types подтягиваются
# через workspace из ../../contracts.

ARG NODE_VERSION=22.19.0

# ---------- deps ----------
FROM node:${NODE_VERSION}-alpine AS deps
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo

# Копируем только manifest'ы для кэширования слоя зависимостей.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/cms/package.json src/cms/package.json
COPY contracts/package.json contracts/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter cms...

# ---------- build ----------
FROM node:${NODE_VERSION}-alpine AS build
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/src/cms/node_modules ./src/cms/node_modules
COPY . .

ENV NODE_ENV=production
# Node fetch — IPv4 first (некоторые VPS-провайдеры не дают исходящий IPv6).
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN pnpm --filter cms run build

# ---------- runtime ----------
FROM node:${NODE_VERSION}-alpine AS runtime
# corepack prepare кеширует pnpm в image (иначе runtime пытается скачать на каждом старте)
RUN corepack enable \
 && corepack prepare pnpm@11.8.0 --activate \
 && apk add --no-cache libc6-compat tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Минимальный набор для запуска Next 15 + Payload + sharp.
COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/contracts /app/contracts
COPY --from=build /repo/src/cms /app/src/cms
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml /app/
# tsconfig.base.json — нужен Payload CLI (payload migrate, generate:types) во время runtime,
# т.к. cms/tsconfig.json extends его (../../tsconfig.base.json). Без него `pnpm migrate`
# падает с "File '../../tsconfig.base.json' not found." — auto-migrate в deploy.sh ломается.
COPY --from=build /repo/tsconfig.base.json /app/tsconfig.base.json

WORKDIR /app/src/cms

# /data/<site>.db — volume для SQLite (mountится из compose, имя файла = ${SITE_SLUG}).
VOLUME ["/data", "/app/src/cms/media"]

EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "start"]
