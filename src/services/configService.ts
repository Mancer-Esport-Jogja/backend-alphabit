import { prisma } from '../lib/prisma';
import { env } from '../config/env';

// Cache interface
interface CacheEntry {
  value: string;
  timestamp: number;
}

// In-memory cache
const configCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Service to handle dynamic configuration.
 * Falls back to environment variables if not found in database.
 * Includes caching to reduce DB hits.
 */
export const configService = {
  /**
   * Get configuration value by key.
   * Checks Cache -> Database -> Env -> Default.
   */
  get: async (key: string, defaultValue: string = ''): Promise<string> => {
    // 1. Check environment variables first (Static override)
    const envValue = getEnvFallback(key);
    if (envValue !== undefined && envValue !== '') {
      return envValue;
    }

    // 2. Check Cache
    const cached = configCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }

    try {
      // 3. Try to fetch from database
      const config = await prisma.config.findUnique({
        where: { key },
      });

      if (config) {
        // Update cache
        configCache.set(key, {
          value: config.value,
          timestamp: Date.now()
        });
        return config.value;
      }
    } catch (error) {
      console.warn(`[ConfigService] Failed to fetch config for key ${key} from DB, using fallback. Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 4. Fallback to default
    return defaultValue;
  },

  /**
   * Set configuration value
   * Invalidates cache for this key
   */
  set: async (key: string, value: string, description?: string): Promise<void> => {
    await prisma.config.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
    
    // Update cache immediately to reflect change
    configCache.set(key, {
      value,
      timestamp: Date.now()
    });
  },

  /**
   * Clear all cache (useful for testing or manual refresh)
   */
  clearCache: () => {
    configCache.clear();
  }
};

/**
 * Helper to get fallback from env variables
 */
function getEnvFallback(key: string): string | undefined {
  switch (key) {
    case 'DOMAIN': return env.DOMAIN;
    case 'THETANUTS_INDEXER_URL': return env.THETANUTS_INDEXER_URL;
    case 'ALPHABIT_REFERRER_ADDRESS': return env.ALPHABIT_REFERRER_ADDRESS;
    case 'SYNC_INTERVAL_MS': return String(env.SYNC_INTERVAL_MS);
    case 'SYNC_DELAY_AFTER_UPDATE': return String(env.SYNC_DELAY_AFTER_UPDATE);
    case 'LOG_INTERNAL_CONFIG': return env.LOG_INTERNAL_CONFIG;
    case 'LOG_EXTERNAL_CONFIG': return env.LOG_EXTERNAL_CONFIG;
    default: return undefined;
  }
}
