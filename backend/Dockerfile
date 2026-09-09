# Multi-stage build for OmniDesk-Agent Backend
# Stage 1: TypeScript Compilation
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
# Force legacy peer deps to resolve LangChain module collisions during build
RUN npm ci --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src
COPY server.ts ./

# Emits compiled JavaScript to /dist
RUN npx tsc

# Stage 2: Lean Production Runtime
FROM node:20-alpine AS production

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install strictly production dependencies to drastically reduce image size
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Extract compiled code from builder
COPY --from=builder /usr/src/app/dist ./dist

# Instantiate physical volume points for Winston logs and SQLite DB
RUN mkdir logs
RUN mkdir data

EXPOSE 5000

CMD ["node", "dist/server.js"]
