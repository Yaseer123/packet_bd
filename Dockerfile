# Install dependencies only when needed
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
# Set environment variables for build time
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
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Set environment variables for runtime
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

RUN npm install -g pnpm
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000
ENV PORT 3000

CMD ["pnpm", "start"]