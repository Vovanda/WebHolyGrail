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
COPY sites/veo55/src/cms/package.json sites/veo55/src/cms/package.json
COPY sites/veo55/contracts/package.json sites/veo55/contracts/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter veo55-cms...

# ---------- build ----------
FROM node:${NODE_VERSION}-alpine AS build
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/sites/veo55/src/cms/node_modules ./sites/veo55/src/cms/node_modules
COPY . .

ENV NODE_ENV=production
RUN pnpm --filter veo55-cms run build

# ---------- runtime ----------
FROM node:${NODE_VERSION}-alpine AS runtime
RUN corepack enable && apk add --no-cache libc6-compat tini
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Минимальный набор для запуска Next 15 + Payload + sharp.
COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/sites/veo55/contracts /app/sites/veo55/contracts
COPY --from=build /repo/sites/veo55/src/cms /app/sites/veo55/src/cms
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /app/

WORKDIR /app/sites/veo55/src/cms

# /data/veo55.db — volume для SQLite (mountится из compose).
VOLUME ["/data", "/app/sites/veo55/src/cms/media"]

EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "start"]
