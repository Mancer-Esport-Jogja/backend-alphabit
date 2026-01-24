import { prisma } from '../lib/prisma';
import { env } from '../config/env';

/**
 * Service to handle dynamic configuration.
 * Falls back to environment variables if not found in database.
 */
export const configService = {
  /**
   * Get configuration value by key.
   * Checks database first, then falls back to env, then default value.
   */
  get: async (key: string, defaultValue: string = ''): Promise<string> => {
    try {
      // Try to fetch from database
      // The prisma client types will be updated after migration/generation
      // Using any for now to avoid build errors if types aren't ready
      const config = await (prisma as any).config.findUnique({
        where: { key },
      });

      if (config) {
        return config.value;
      }
    } catch (error) {
      console.warn(`[ConfigService] Failed to fetch config for key ${key} from DB, using fallback:`, error);
    }

    // Fallback to environment variables for specific known keys
    // This ensures backward compatibility and bootstrap capability
    if (key === 'DOMAIN') {
      return env.DOMAIN || defaultValue;
    }
    if (key === 'THETANUTS_INDEXER_URL') {
      return env.THETANUTS_INDEXER_URL || defaultValue;
    }
    if (key === 'ALPHABIT_REFERRER_ADDRESS') {
      return env.ALPHABIT_REFERRER_ADDRESS || defaultValue;
    }

    return defaultValue;
  },

  /**
   * Set configuration value
   */
  set: async (key: string, value: string, description?: string): Promise<void> => {
    await (prisma as any).config.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }
};
