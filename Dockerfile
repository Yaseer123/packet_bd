# Use an official Node runtime as the base image
FROM node:22-alpine AS base

# Install pnpm globally in the base image
RUN npm install -g pnpm

# Install dependencies only when needed
FROM base AS deps
# Install libc6-compat for better compatibility
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only package manager files for better cache
COPY package.json pnpm-lock.yaml* ./
RUN pnpm fetch

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies and build
RUN pnpm install --prefer-offline --no-frozen-lockfile
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user and group
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy necessary files for standalone output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Use Next.js standalone server
CMD ["node", "server.js"]