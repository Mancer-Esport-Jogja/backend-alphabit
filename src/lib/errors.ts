/**
 * Custom error classes for Thetanuts integration
 */

export class ThetanutsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'THETANUTS_API_ERROR'
  ) {
    super(message);
    this.name = 'ThetanutsApiError';
  }
}

export const ErrorCodes = {
  // Thetanuts API errors
  FETCH_ORDERS_FAILED: 'FETCH_ORDERS_FAILED',
  FETCH_POSITIONS_FAILED: 'FETCH_POSITIONS_FAILED',
  FETCH_HISTORY_FAILED: 'FETCH_HISTORY_FAILED',
  FETCH_STATS_FAILED: 'FETCH_STATS_FAILED',
  FETCH_UPDATE_FAILED: 'FETCH_UPDATE_FAILED',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  
  // Validation errors
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_TYPE: 'INVALID_TYPE',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Trade errors
  SYNC_TRADES_FAILED: 'SYNC_TRADES_FAILED',
  FETCH_TRADES_FAILED: 'FETCH_TRADES_FAILED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Helper to create standardized error response
 */
export function createErrorResponse(code: ErrorCode, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
