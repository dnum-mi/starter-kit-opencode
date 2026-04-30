# ─── Stage 1 : build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Active pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copie des manifestes workspace en premier (cache Docker)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/vue-dsfr-app/package.json ./apps/vue-dsfr-app/

# Installation des dépendances (frozen pour reproductibilité)
RUN pnpm install --frozen-lockfile

# Copie des sources
COPY apps/vue-dsfr-app/ ./apps/vue-dsfr-app/

# Build de l'application
RUN pnpm --filter vue-dsfr-app run build

# ─── Stage 2 : runtime ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copie des assets buildés
COPY --from=builder /app/apps/vue-dsfr-app/dist /usr/share/nginx/html

# Copie de la config nginx
COPY apps/vue-dsfr-app/nginx.conf /etc/nginx/nginx.conf

# Utilisateur non-root (conformité OpenShift)
RUN chown -R 1001:1001 /usr/share/nginx/html \
  && chown -R 1001:1001 /var/cache/nginx \
  && chown -R 1001:1001 /var/log/nginx \
  && touch /tmp/nginx.pid \
  && chown 1001:1001 /tmp/nginx.pid

USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
