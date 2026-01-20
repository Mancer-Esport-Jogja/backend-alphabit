/**
 * Nuts API documentation (Thetanuts Finance integration)
 */
export const nutsPaths = {
  '/nuts/orders': {
    get: {
      summary: 'Get orders list',
      description: 'Fetches orders from external provider (proxy to external service)',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Orders retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Raw response from external provider'
              }
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
  },
  '/nuts/positions': {
    post: {
      summary: 'Get user positions or history',
      description: `
Fetches user positions or history from Thetanuts Finance.

**Type Options:**
- \`open\` - Returns current open positions (requires address)
- \`history\` - Returns position history (requires address)
- \`all\` - Returns all open positions (address must be null/empty)
      `,
      tags: ['Nuts'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type'],
              properties: {
                address: {
                  type: 'string',
                  nullable: true,
                  description: 'User wallet address (required for open/history, must be null for all)',
                  example: '0x1234567890abcdef1234567890abcdef12345678'
                },
                type: {
                  type: 'string',
                  enum: ['open', 'history', 'all'],
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
  },
  '/nuts/update': {
    get: {
      summary: 'Get update info',
      description: 'Fetches update information from Thetanuts Finance',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Update info retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Raw response from Thetanuts Finance'
              }
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
  },
  '/nuts/stats': {
    get: {
      summary: 'Get stats',
      description: 'Fetches statistics from Thetanuts Finance',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Stats retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Raw response from Thetanuts Finance'
              }
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
