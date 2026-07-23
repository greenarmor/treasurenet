FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
COPY turbo.json tsconfig.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build --filter=@treasurenet/server

FROM base AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/server
EXPOSE 4000
CMD ["node", "dist/main.js"]
