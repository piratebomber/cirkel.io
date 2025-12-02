# Cirkel.io Production Dockerfile
# Multi-stage build for optimized production image

# Build arguments
ARG NODE_VERSION=18-alpine
ARG BUILD_DATE
ARG VCS_REF

# Stage 1: Dependencies
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 2: Builder
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install all dependencies (including devDependencies)
RUN npm ci

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Labels for metadata
LABEL org.opencontainers.image.title="Cirkel.io Platform"
LABEL org.opencontainers.image.description="Next-generation social media platform"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.created=${BUILD_DATE}
LABEL org.opencontainers.image.revision=${VCS_REF}
LABEL org.opencontainers.image.source="https://github.com/cirkel-io/platform"
LABEL org.opencontainers.image.url="https://cirkel.io"
LABEL org.opencontainers.image.vendor="Cirkel.io"
LABEL org.opencontainers.image.licenses="MIT"

# Start the application
CMD ["node", "server.js"]