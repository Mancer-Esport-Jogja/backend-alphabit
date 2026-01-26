import { createClient, Errors } from '@farcaster/quick-auth';
import { env, isDevelopment } from '../config/env';
import { configService } from './configService';
import { isDevToken, getDevUserByToken } from '../config/mockData';

// Initialize the Quick Auth client
const client = createClient();

export interface VerificationResult {
  valid: boolean;
  fid?: number;
  error?: string;
}

export const authService = {
  /**
   * Verifies a Farcaster Quick Auth token.
   * @param token The JWT token provided by the frontend.
   * @returns Verification result containing validity and FID if successful.
   */
  verifyToken: async (token: string): Promise<VerificationResult> => {
    // Development bypass - only in development mode with dev tokens
    if (isDevelopment && isDevToken(token)) {
      const devUser = getDevUserByToken(token);
      if (devUser) {
        console.warn(`⚠️  [DEV AUTH BYPASS] Using dev user: ${devUser.username} (FID: ${devUser.fid})`);
        return { valid: true, fid: devUser.fid };
      }
    }

    // Production validation
    const domain = await configService.get('DOMAIN');
    if (!domain) {
      console.error('DOMAIN env var is missing');
      return { valid: false, error: 'Server configuration error' };
    }

    try {
      const payload = await client.verifyJwt({ 
        token, 
        domain 
      });

      return { 
        valid: true, 
        fid: Number(payload.sub) 
      };
    } catch (e: any) {
      // Handle jose library specific errors
      if (e instanceof Errors.InvalidTokenError || e.code === 'ERR_JWS_INVALID') {
        return { valid: false, error: 'Invalid token format' };
      }
      
      // Log unexpected errors
      console.error('Auth verification error:', e);
      return { valid: false, error: 'Token verification failed' };
    }
  }
};
