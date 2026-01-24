/**
 * Analytics Endpoints Documentation
 */

export const analyticsPaths = {
  '/user/analytics/summary': {
    get: {
      tags: ['Analytics'],
      summary: 'Get user analytics summary',
      description: 'Retrieve high-level statistics for the authenticated user, including PnL, win rate, and volume.',
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Successful retrieval of analytics summary',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      netPnL: {
                        type: 'string',
                        example: '150.00'
                      },
                      totalVolume: {
                        type: 'string',
                        example: '5000.00'
                      },
                      winRate: {
                        type: 'number',
                        example: 60.5
                      },
                      totalTrades: {
                        type: 'integer',
                        example: 42
                      },
                      currentWinStreak: {
                        type: 'integer',
                        example: 3
                      },
                      bestWinStreak: {
                        type: 'integer',
                        example: 8
                      },
                      rank: {
                        type: 'integer',
                        example: 15
                      },
                      topPercentile: {
                        type: 'number',
                        example: 10
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized'
        },
        404: {
          description: 'User not found'
        }
      }
    }
  },
  '/user/analytics/pnl-history': {
    get: {
      tags: ['Analytics'],
      summary: 'Get PnL history',
      description: 'Retrieve historical Profit and Loss data for charting.',
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['7d', '30d', 'all'],
            default: '30d'
          },
          description: 'Time period for the history data'
        }
      ],
      responses: {
        200: {
          description: 'Successful retrieval of PnL history',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean'
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: {
                          type: 'string',
                          format: 'date',
                          example: '2023-10-01'
                        },
                        pnl: {
                          type: 'number',
                          example: 50.00
                        },
                        cumulativePnl: {
                          type: 'number',
                          example: 150.00
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized'
        }
      }
    }
  },
  '/user/analytics/distribution': {
    get: {
      tags: ['Analytics'],
      summary: 'Get portfolio distribution',
      description: 'Retrieve breakdown of trades by asset, result, and strategy.',
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Successful retrieval of distribution data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      assets: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'BTC' },
                            count: { type: 'integer', example: 10 },
                            volume: { type: 'string', example: '1000.00' }
                          }
                        }
                      },
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'Win' },
                            count: { type: 'integer', example: 5 }
                          }
                        }
                      },
                      strategies: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'CALL_SPREAD' },
                            count: { type: 'integer', example: 8 }
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
        401: {
          description: 'Unauthorized'
        }
      }
    }
  }
};
