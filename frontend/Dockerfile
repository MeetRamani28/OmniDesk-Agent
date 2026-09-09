# Multi-stage build for OmniDesk-Agent Frontend
# Stage 1: Vite React Compilation
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Inject build-time environment variables for Vite
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package*.json ./
RUN npm ci

COPY . .

# Compile Tailwind v4 and React components into minified static assets
RUN npm run build

# Stage 2: High-Performance Nginx Web Server
FROM nginx:alpine AS production

# Transfer compiled static files to Nginx public directory
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Inject SPA routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
