/**
 * Users API documentation
 */
export const usersPaths = {
  '/users/me': {
    get: {
      summary: 'Get current user profile',
      description: `
Returns the authenticated user's full profile from database.

**Profile includes:**
- Identity: id, fid
- Farcaster profile: username, displayName, pfpUrl, primaryEthAddress
- Timestamps: createdAt, updatedAt, lastActiveAt

**Note:** User must authenticate first via /auth endpoint to have a stored profile.
      `,
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' }
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
        },
        '404': {
          description: 'User not found - Please authenticate first via /auth',
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
