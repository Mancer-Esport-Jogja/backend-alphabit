/**
 * Mock Data for Development Environment
 * 
 * This file contains all mock data used during development.
 * Only active when NODE_ENV=development
 * 
 * @module config/mockData
 */

// ============================================================================
// Types
// ============================================================================

export interface DevUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  primaryEthAddress: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Dev token prefix pattern
 * - 'dev-token' → default dev user (index 0)
 * - 'dev-token-1' → dev user at index 1
 * - 'dev-token-2' → dev user at index 2
 */
export const DEV_TOKEN_PREFIX = 'dev-token';

/**
 * Mock users for development testing
 * Add more users here for multi-user testing scenarios
 */
export const DEV_USERS: DevUser[] = [
  {
    fid: 999999,
    username: 'dev_user',
    displayName: 'Development User',
    pfpUrl: 'https://i.imgur.com/YQwNqvu.png',
    primaryEthAddress: '0x0000000000000000000000000000000000000001'
  },
  {
    fid: 999998,
    username: 'dev_user_2',
    displayName: 'Development User 2',
    pfpUrl: 'https://i.imgur.com/YQwNqvu.png',
    primaryEthAddress: '0x0000000000000000000000000000000000000002'
  },
  {
    fid: 999997,
    username: 'dev_user_3',
    displayName: 'Development User 3',
    pfpUrl: 'https://i.imgur.com/YQwNqvu.png',
    primaryEthAddress: '0x0000000000000000000000000000000000000003'
  }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a token is a development token
 * @param token - The token to check
 * @returns true if token matches dev token pattern
 */
export function isDevToken(token: string): boolean {
  // Match 'dev-token' or 'dev-token-{number}'
  return token === DEV_TOKEN_PREFIX || /^dev-token-\d+$/.test(token);
}

/**
 * Get dev user by token
 * @param token - The dev token (e.g., 'dev-token', 'dev-token-1')
 * @returns DevUser if found, null otherwise
 */
export function getDevUserByToken(token: string): DevUser | null {
  if (!isDevToken(token)) {
    return null;
  }

  // 'dev-token' → index 0
  // 'dev-token-1' → index 1
  // 'dev-token-2' → index 2
  let index = 0;
  
  if (token !== DEV_TOKEN_PREFIX) {
    const match = token.match(/^dev-token-(\d+)$/);
    if (match) {
      index = parseInt(match[1], 10);
    }
  }

  return DEV_USERS[index] || null;
}

/**
 * Get dev user by FID
 * @param fid - The FID to lookup
 * @returns DevUser if found, null otherwise
 */
export function getDevUserByFid(fid: number): DevUser | null {
  return DEV_USERS.find(user => user.fid === fid) || null;
}

/**
 * Check if FID belongs to a dev user
 * @param fid - The FID to check
 * @returns true if FID is a dev user FID
 */
export function isDevUserFid(fid: number): boolean {
  return DEV_USERS.some(user => user.fid === fid);
}
