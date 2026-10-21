# ==============================================================
# Production Multi-Stage Dockerfile for Omniva SaaS Platform
# ==============================================================

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Dependencies for Backend
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Stage 3: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy backend source & dependencies
COPY --chown=node:node --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY --chown=node:node backend/ ./backend

# Copy compiled frontend assets to /app/frontend/dist
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

USER node

CMD ["node", "backend/src/server.js"]
