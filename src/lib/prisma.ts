import '../config/env'; // Ensure env vars are loaded
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
console.log('[DEBUG] lib/prisma: Connection String exists?', !!connectionString);
console.log('[DEBUG] lib/prisma: Connection String start:', connectionString?.substring(0, 15));

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
