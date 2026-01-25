# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies with legacy-peer-deps to resolve @farcaster/quick-auth peer conflict
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client and build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Generate Prisma client for production
RUN npx prisma generate

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

# Expose port
EXPOSE 3000

# Set NODE_ENV
ENV NODE_ENV=production

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
