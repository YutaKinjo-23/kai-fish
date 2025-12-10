# Development and production base for fish-kai web
FROM node:22-bullseye

ENV PNPM_HOME=/root/.local/share/pnpm \
    PATH="${PNPM_HOME}:$PATH" \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install pnpm via Corepack
RUN corepack enable

# Install dependencies first for better layer caching
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
