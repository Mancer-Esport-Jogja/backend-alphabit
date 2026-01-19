import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DOMAIN: process.env.DOMAIN || '', // Required for Farcaster Auth
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

if (!env.DOMAIN && env.NODE_ENV === 'production') {
  console.warn('WARNING: DOMAIN is not set in environment variables. Authentication may fail.');
}
