# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install PM2 globally for cluster-mode process management
RUN npm install -g pm2@latest --loglevel=error

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create log directory used by pm2 ecosystem config
RUN mkdir -p logs

EXPOSE 5000

# PM2 runtime: runs ecosystem.config.js in cluster mode,
# auto-restarts crashed workers, and forwards SIGTERM for graceful shutdown.
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
