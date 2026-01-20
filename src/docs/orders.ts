/**
 * Orders API documentation
 */
export const ordersPaths = {
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
  }
};
