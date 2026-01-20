/**
 * System API documentation
 */
export const systemPaths = {
  '/system/info': {
    get: {
      summary: 'Get system information',
      description: 'Returns basic system information including version and timestamp',
      tags: ['System'],
      responses: {
        '200': {
          description: 'System information retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Alphabit Backend System Info' },
                      timestamp: { type: 'string', format: 'date-time' },
                      version: { type: 'string', example: '1.0.0' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/system/health': {
    get: {
      summary: 'Health check',
      description: 'Returns the health status and uptime of the service',
      tags: ['System'],
      responses: {
        '200': {
          description: 'Service is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      uptime: { 
                        type: 'number', 
                        description: 'Server uptime in seconds',
                        example: 12345.67 
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/health': {
    get: {
      summary: 'API Health check',
      description: 'Simple health check endpoint at /api/health',
      tags: ['System'],
      responses: {
        '200': {
          description: 'Service is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'ok' },
                  uptime: { type: 'number', example: 12345.67 }
                }
              }
            }
          }
        }
      }
    }
  }
};
