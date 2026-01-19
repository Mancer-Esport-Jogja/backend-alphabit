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

    try {
      const payload = await client.verifyJwt({ 
        token, 
        domain: env.DOMAIN 
      });

      return { 
        valid: true, 
        fid: Number(payload.sub) 
      };
    } catch (e) {
      if (e instanceof Errors.InvalidTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      // Log unexpected errors
      console.error('Auth verification error:', e);
      return { valid: false, error: 'Verification failed' };
    }
  }
};
