import { env } from './env';

export interface LogConfig {
  enabled: boolean;          // Master toggle
  body: boolean;             // Log body?
  maxBodyLength: number;     // Max chars to log
  sensitiveKeys: string[];   // Keys to redact
  excludePaths: string[];    // Paths to ignore (only for internal)
  minify: boolean;           // Minify JSON output?
}

const DEFAULT_INTERNAL_CONFIG: LogConfig = {
  enabled: true,
  body: true,
  maxBodyLength: 1000,
  sensitiveKeys: ['password', 'token', 'authorization', 'secret', 'key'],
  excludePaths: ['/api/health', '/metrics', '/favicon.ico'],
  minify: false,
};

const DEFAULT_EXTERNAL_CONFIG: LogConfig = {
  enabled: true,
  body: true,
  maxBodyLength: 1000,
  sensitiveKeys: ['password', 'token', 'authorization', 'secret', 'key', 'apiKey'],
  excludePaths: [], // Not used for external
  minify: false,
};

import { configService } from '../services/configService';

/**
 * Parse logging configuration from database/env
 */
export const getLogConfig = async (type: 'internal' | 'external'): Promise<LogConfig> => {
  const defaults = type === 'internal' ? DEFAULT_INTERNAL_CONFIG : DEFAULT_EXTERNAL_CONFIG;
  const configKey = type === 'internal' ? 'LOG_INTERNAL_CONFIG' : 'LOG_EXTERNAL_CONFIG';
  
  const configValue = await configService.get(configKey, JSON.stringify(defaults));

  try {
    const userConfig = JSON.parse(configValue);
    return { ...defaults, ...userConfig };
  } catch (error) {
    console.warn(`[Config] Failed to parse ${type} logging config JSON. Using defaults.`, error);
    return defaults;
  }
};

/**
 * Helper to redact sensitive keys in an object
 */
export const redactSensitiveData = (data: any, sensitiveKeys: string[]): any => {
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, sensitiveKeys));
  }

  const redacted = { ...data };
  for (const key of Object.keys(redacted)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      redacted[key] = '***';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key], sensitiveKeys);
    }
  }
  return redacted;
};

/**
 * Helper to format body for logging (truncate + minify/pretty)
 */
export const formatLogBody = (body: any, config: LogConfig): string => {
  if (!body) return '';

  const sensitive = redactSensitiveData(body, config.sensitiveKeys);
  const jsonString = config.minify 
    ? JSON.stringify(sensitive)
    : JSON.stringify(sensitive, null, 2);

  if (jsonString.length > config.maxBodyLength) {
    return jsonString.substring(0, config.maxBodyLength) + ` ... (truncated ${jsonString.length - config.maxBodyLength} chars)`;
  }
  
  return jsonString;
};
