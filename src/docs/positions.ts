/**
 * Positions API documentation
 */
export const positionsPaths = {
  '/nuts/positions': {
    post: {
      summary: 'Get user positions or history',
      description: `
Fetches user positions or history from Thetanuts Finance.

**Type Options:**
- \`open\` - Returns current open positions
- \`history\` - Returns position history
      `,
      tags: ['Nuts'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['address', 'type'],
              properties: {
                address: {
                  type: 'string',
                  description: 'User wallet address',
                  example: '0x1234567890abcdef1234567890abcdef12345678'
                },
                type: {
                  type: 'string',
                  enum: ['open', 'history'],
                  description: 'Type of data to fetch',
                  example: 'open'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Positions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Raw response from Thetanuts Finance'
              }
            }
          }
        },
        '400': {
          description: 'Bad request - missing or invalid parameters',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        '500': {
          description: 'Server error',
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
