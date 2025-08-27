# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install curl for health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files first for better caching
COPY package*.json ./

# Configure npm for better reliability
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-retry-mintimeout 20000
RUN npm config set fetch-retry-maxtimeout 120000
RUN npm config set fetch-retries 3
RUN npm config set maxsockets 1

# Install dependencies with retry logic
RUN npm ci --only=production --no-audit --no-fund || npm ci --only=production --no-audit --no-fund || npm install --only=production --no-audit --no-fund

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Database initialization and start script
COPY --chown=nextjs:nodejs <<EOF /app/start.sh
#!/bin/bash
set -e

# Initialize database if it doesn't exist
if [ ! -f "/app/data/production.db" ]; then
  echo "Initializing database..."
  npx prisma db push --accept-data-loss
fi

# Start the application
exec node server.js
EOF

RUN chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]