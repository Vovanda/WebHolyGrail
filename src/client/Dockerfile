# syntax=docker/dockerfile:1.7

# Next 15 client — multi-stage build.
ARG NODE_VERSION=22.19.0

FROM node:${NODE_VERSION}-alpine AS deps
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY src/client/package.json src/client/package.json
COPY contracts/package.json contracts/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter client...

FROM node:${NODE_VERSION}-alpine AS build
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/src/client/node_modules ./src/client/node_modules
COPY . .
ENV NODE_ENV=production
# Node fetch — IPv4 first (некоторые VPS-провайдеры не дают исходящий IPv6;
# актуально для next/font/google которые качают шрифты во время build).
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN pnpm --filter client run build

FROM node:${NODE_VERSION}-alpine AS runtime
# corepack prepare кеширует pnpm в image
RUN corepack enable \
 && corepack prepare pnpm@11.8.0 --activate \
 && apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Build metadata — заворачивается в image через docker build --build-arg.
# Endpoint /api/_status читает эти env'ы → они отражают РЕАЛЬНУЮ версию что собрана,
# не workflow-trigger sha (важно при concurrency / manual rerun).
ARG BUILD_SHA=unknown
ARG BUILD_TIME=unknown
ENV BUILD_SHA=$BUILD_SHA
ENV BUILD_TIME=$BUILD_TIME

COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/contracts /app/contracts
COPY --from=build /repo/src/client /app/src/client
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /app/

WORKDIR /app/src/client
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "start"]
