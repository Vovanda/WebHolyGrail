# syntax=docker/dockerfile:1.7

# Next 15 client — multi-stage build.
ARG NODE_VERSION=22.19.0

FROM node:${NODE_VERSION}-alpine AS deps
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY sites/veo55/src/client/package.json sites/veo55/src/client/package.json
COPY sites/veo55/contracts/package.json sites/veo55/contracts/package.json
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter veo55-client...

FROM node:${NODE_VERSION}-alpine AS build
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/sites/veo55/src/client/node_modules ./sites/veo55/src/client/node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter veo55-client run build

FROM node:${NODE_VERSION}-alpine AS runtime
RUN corepack enable && apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /repo/node_modules /app/node_modules
COPY --from=build /repo/sites/veo55/contracts /app/sites/veo55/contracts
COPY --from=build /repo/sites/veo55/src/client /app/sites/veo55/src/client
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /app/

WORKDIR /app/sites/veo55/src/client
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["pnpm", "start"]
