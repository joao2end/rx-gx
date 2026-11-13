# syntax=docker/dockerfile:1

# ---------- 1. Build: instala dependências e gera o bundle SSR (.output) ----------
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

# O postinstall roda "nuxt prepare", que precisa do código-fonte presente
COPY . .
RUN pnpm install --frozen-lockfile

# Build de produção (preset node-server)
RUN pnpm build

# ---------- 2. Runtime: apenas o .output, sem devDependencies ----------
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NUXT_PUBLIC_DATA_BASE=/mock

COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
