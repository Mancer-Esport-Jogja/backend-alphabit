import { createClient, Errors } from '@farcaster/quick-auth';
import { env } from '../config/env';

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
    if (!env.DOMAIN) {
      console.error('DOMAIN env var is missing');
      return { valid: false, error: 'Server configuration error' };
    }

    // Bypass for local development
    if (env.NODE_ENV === 'development' && token === 'dev-token') {
      console.warn('⚠️  Using DEV TOKEN bypass');
      return { valid: true, fid: 999999 };
    }

    try {
      const payload = await client.verifyJwt({ 
        token, 
        domain: env.DOMAIN 
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
      return { valid: false, error: 'Verification failed' };
    }
  }
};
