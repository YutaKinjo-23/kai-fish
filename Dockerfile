# Production-ready image for fish-kai web
FROM node:22-bullseye

ENV PNPM_HOME=/root/.local/share/pnpm \
    PATH="${PNPM_HOME}:$PATH" \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

WORKDIR /app

# Install pnpm via Corepack
RUN corepack enable

# Install dependencies first for better layer caching
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Generate Prisma client and build Next.js app
RUN pnpm prisma generate
RUN pnpm build

EXPOSE 3000

# Apply migrations at startup, then launch Next.js server
CMD ["sh", "-c", "pnpm prisma:migrate-deploy && pnpm start --hostname 0.0.0.0 --port 3000"]
