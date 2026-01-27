/**
 * Auth API documentation
 */
export const authPaths = {
  '/auth': {
    post: {
      summary: 'Authenticate user',
      description: `
Authenticate and register user with Farcaster Quick Auth.

**Flow:**
1. User authenticates with Farcaster → gets JWT token (contains FID)
2. FE calls this endpoint with Bearer token
3. BE verifies token, extracts FID, fetches profile from Neynar, creates/updates user

**Profile Data:**
- Username, display name, profile picture URL are fetched from Neynar API
- Primary ETH address is also retrieved from Farcaster data

**Note:** FID is extracted from the verified JWT token and cannot be faked. No request body required.
      `,
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      responses: {
        '201': {
          description: 'New user created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      isNewUser: { type: 'boolean', example: true }
                    }
                  }
                }
              }
            }
          }
        },
        '200': {
          description: 'Existing user returned',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      isNewUser: { type: 'boolean', example: false }
                    }
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized - Missing or invalid Bearer token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/auth/bind-wallet': {
    post: {
      summary: 'Bind wallet to user',
      description: `
Bind an Ethereum wallet address to the authenticated user.

**Requirements:**
- Bearer token (Farcaster Quick Auth)
- Wallet \`address\`
- \`signature\` proving wallet ownership

**Signature message format (must match backend):**
\`Bind Wallet {address} to Alphabit Account {fid}\`
      `,
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BindWalletRequest' }
          }
        }
      },
      responses: {
        '200': {
          description: 'Wallet bound successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BindWalletResponse' }
            }
          }
        },
        '400': {
          description: 'Bad request - Address and signature are required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '401': {
          description: 'Unauthorized - Missing token or invalid signature',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  }
};
