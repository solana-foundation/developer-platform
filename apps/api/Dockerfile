# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from root and app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY turbo.json ./

# Install dependencies (skip prepare script to avoid husky in Docker)
RUN npm ci --ignore-scripts

# Copy source code
COPY apps/api ./apps/api

# Build the application
RUN npm run build --filter=@developer-platform/api

# Production stage
FROM node:20-alpine

# Install tini instead of dumb-init for better compatibility
RUN apk add --no-cache tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies only (skip prepare script to avoid husky)
RUN npm ci --omit=dev --ignore-scripts

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist

# Switch to non-root user
USER nodejs

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Use tini to handle signals
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "apps/api/dist/main"]