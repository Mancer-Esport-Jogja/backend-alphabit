/**
 * Common schema definitions for API documentation
 */
export const schemas = {
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'User ID (CUID)',
        example: 'clxyz123abc'
      },
      fid: {
        type: 'string',
        description: 'Farcaster ID (required)',
        example: '12345'
      },
      username: {
        type: 'string',
        nullable: true,
        description: 'Farcaster username',
        example: 'alice'
      },
      displayName: {
        type: 'string',
        nullable: true,
        description: 'Farcaster display name',
        example: 'Alice Crypto'
      },
      pfpUrl: {
        type: 'string',
        nullable: true,
        description: 'Profile picture URL',
        example: 'https://imagedelivery.net/.../original'
      },
      primaryEthAddress: {
        type: 'string',
        nullable: true,
        description: 'Primary Ethereum address from Farcaster',
        example: '0xf072abd2572d66dA48eB97e604F01A1d2e857eB1'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp'
      },
      lastActiveAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last activity timestamp'
      }
    }
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object'
      }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'string',
        example: 'Error message'
      }
    }
  }
};
