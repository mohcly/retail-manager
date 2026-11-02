FROM node:20-alpine

WORKDIR /app

# Install native compilation tools for better-sqlite3 and curl for health checks
RUN apk add --no-cache curl sqlite python3 make g++

# 1. Install backend dependencies & build backend
WORKDIR /app/backend/local-bridge
COPY backend/local-bridge/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Remove heavy build tools to save disk space
RUN apk del make g++

COPY backend/local-bridge/ ./
RUN npm run build || true

# 2. Copy compiled frontend dist
WORKDIR /app/frontend
COPY frontend/dist/ ./dist/

# 3. Copy docker orchestration scripts & pre-seeded demo database
WORKDIR /app
COPY docker/ ./docker/
RUN chmod +x /app/docker/entrypoint.sh

EXPOSE 3000 8787

ENV PORT=3000
ENV BACKEND_PORT=8787
ENV DATA_DIR=/app/data

ENTRYPOINT ["/app/docker/entrypoint.sh"]
