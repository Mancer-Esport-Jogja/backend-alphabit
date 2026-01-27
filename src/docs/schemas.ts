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
      },
      currentLoginStreak: {
        type: 'integer',
        description: 'Current daily login streak count',
        example: 3
      },
      maxLoginStreak: {
        type: 'integer',
        description: 'Maximum daily login streak achieved',
        example: 10
      },
      currentWinStreak: {
        type: 'integer',
        description: 'Current trading win streak count',
        example: 2
      },
      maxWinStreak: {
        type: 'integer',
        description: 'Maximum trading win streak achieved',
        example: 5
      }
    }
  },
  BindWalletRequest: {
    type: 'object',
    required: ['address', 'signature'],
    properties: {
      address: {
        type: 'string',
        description: 'Ethereum wallet address to bind',
        example: '0xf072abd2572d66dA48eB97e604F01A1d2e857eB1'
      },
      signature: {
        type: 'string',
        description: 'Signature proving wallet ownership (SIWE-style message signature)',
        example: '0x...'
      }
    }
  },
  BindWalletResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Wallet bound successfully' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'clxyz123abc' },
              fid: { type: 'string', example: '12345' },
              primaryEthAddress: {
                type: 'string',
                example: '0xf072abd2572d66dA48eB97e604F01A1d2e857eB1'
              }
            }
          }
        }
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
