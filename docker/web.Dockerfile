FROM node:20-alpine AS base
WORKDIR /app

FROM base AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
COPY turbo.json tsconfig.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build --filter=@treasurenet/web

FROM base AS runner
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npx", "next", "start"]
