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
ENV NEXT_TELEMETRY_DISABLED=1

# Accept build args and set as envs for build-time and runtime secrets
ENV AUTH_GOOGLE_ID="463067814945-5lbfb9e1lesom5kjf78ibqvfkrg776i9.apps.googleusercontent.com"
ENV AUTH_GOOGLE_SECRET="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"
ENV DATABASE_URL="postgresql://postgres.lruqkuukifiztacepfhv:44UcRxF3vZCDeo5A@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
ENV AUTH_SECRET="packetbd"
ENV BUCKET_REGION="ap-southeast-1"
ENV ACCESS_KEY="AKIAT7FGTGIJP3S4T34P"
ENV SECRET_KEY="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"
ENV BUCKET_NAME="packetbd"
ENV NODE_ENV="production"
ENV AUTH_TRUST_HOST="true"
ENV RESEND_API_KEY="re_EbtKpWfm_7JiaG6wvNhjTsSnDzqDDg2z2"
ENV ROOT_DOMAIN="packetbd.com"
ENV NEXTAUTH_URL="https://packetbd.com"

# Install dependencies and build
RUN pnpm install --prefer-offline --no-frozen-lockfile
RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_GOOGLE_ID="463067814945-5lbfb9e1lesom5kjf78ibqvfkrg776i9.apps.googleusercontent.com"
ENV AUTH_GOOGLE_SECRET="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"
ENV DATABASE_URL="postgresql://postgres.lruqkuukifiztacepfhv:44UcRxF3vZCDeo5A@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
ENV AUTH_SECRET="packetbd"
ENV BUCKET_REGION="ap-southeast-1"
ENV ACCESS_KEY="AKIAT7FGTGIJP3S4T34P"
ENV SECRET_KEY="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"
ENV BUCKET_NAME="packetbd"
ENV AUTH_TRUST_HOST="true"
ENV RESEND_API_KEY="re_EbtKpWfm_7JiaG6wvNhjTsSnDzqDDg2z2"
ENV ROOT_DOMAIN="packetbd.com"
ENV NEXTAUTH_URL="https://packetbd.com"

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