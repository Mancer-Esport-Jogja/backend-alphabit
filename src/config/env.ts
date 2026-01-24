import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  DOMAIN: process.env.DOMAIN || '', // Required for Farcaster Auth
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  NEYNAR_API_KEY: process.env.NEYNAR_API_KEY || '',
  // Thetanuts Integration
  ALPHABIT_REFERRER_ADDRESS: process.env.ALPHABIT_REFERRER_ADDRESS || '',
  THETANUTS_INDEXER_URL: process.env.THETANUTS_INDEXER_URL || 'https://optionbook-indexer.thetanuts.finance/api/v1',
  THETANUTS_ORDERS_URL: process.env.THETANUTS_ORDERS_URL || 'https://round-snowflake-9c31.devops-118.workers.dev/',
  // Sync Scheduler Config
  SYNC_SCHEDULER_ENABLED: process.env.SYNC_SCHEDULER_ENABLED === 'true', // Default false
  SYNC_INTERVAL_MS: parseInt(process.env.SYNC_INTERVAL_MS || '900000', 10), // Default 15 min (15 * 60 * 1000)
  SYNC_DELAY_AFTER_UPDATE: parseInt(process.env.SYNC_DELAY_AFTER_UPDATE || '10000', 10), // 10s default
};

/**
 * Helper to check if running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

if (!env.DOMAIN && env.NODE_ENV === 'production') {
  console.warn('WARNING: DOMAIN is not set in environment variables. Authentication may fail.');
}

if (!env.NEYNAR_API_KEY) {
  console.warn('WARNING: NEYNAR_API_KEY is not set. User profile data will not be fetched from Neynar.');
}
