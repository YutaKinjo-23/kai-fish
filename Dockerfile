# ─────────────────────────────────────────────────────────────
# Build stage: install all deps (including devDeps) and build
# ─────────────────────────────────────────────────────────────
FROM node:22-bullseye AS builder

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="${PNPM_HOME}:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Install ALL dependencies (skip husky prepare script)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source
COPY . .

# Generate Prisma client and build Next.js
RUN pnpm prisma generate
RUN pnpm build

# ─────────────────────────────────────────────────────────────
# Production stage: minimal runtime image
# ─────────────────────────────────────────────────────────────
FROM node:22-bullseye-slim AS runner

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="${PNPM_HOME}:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Copy everything needed from builder (simpler than selective copy with pnpm)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Apply migrations at startup, then launch Next.js server
CMD ["sh", "-c", "pnpm prisma:migrate-deploy && pnpm start --hostname 0.0.0.0 --port 3000"]
