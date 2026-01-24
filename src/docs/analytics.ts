/**
 * Analytics Endpoints Documentation
 */

export const analyticsPaths = {
  '/user/analytics/summary': {
    get: {
      tags: ['Analytics'],
      summary: 'Get user analytics summary',
      description: 'Retrieve high-level statistics for the authenticated user based on their entire trading history.',
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
                        description: 'Total Net Profit/Loss (Payout - Premium) in USDC. Returned as string to preserve precision.',
                        example: '150.00'
                      },
                      totalVolume: {
                        type: 'string',
                        description: 'Total collateral volume of all trades in USDC. Returned as string to preserve precision.',
                        example: '5000.00'
                      },
                      winRate: {
                        type: 'number',
                        format: 'float',
                        description: 'Win rate percentage (0-100), calculated from settled trades where payout > 0.',
                        example: 60.5
                      },
                      totalTrades: {
                        type: 'integer',
                        description: 'Total number of trades placed.',
                        example: 42
                      },
                      currentWinStreak: {
                        type: 'integer',
                        description: 'Current consecutive winning trades.',
                        example: 3
                      },
                      bestWinStreak: {
                        type: 'integer',
                        description: 'All-time best consecutive winning trades record.',
                        example: 8
                      },
                      rank: {
                        type: 'integer',
                        description: 'Global user rank (based on volume).',
                        example: 15
                      },
                      topPercentile: {
                        type: 'number',
                        description: 'User percentile ranking (e.g., 10 = Top 10%).',
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
          description: 'Unauthorized - Missing or invalid token'
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
      description: 'Retrieve historical Net Profit/Loss data points for time-series charting. Data includes daily PnL and cumulative PnL curve.',
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
            enum: ['1d', '7d', '30d', 'all'],
            default: '30d'
          },
          description: 'Time period for the history data. Defaults to 30d.'
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
                          description: 'Date of the data point (YYYY-MM-DD) or (YYYY-MM-DD HH:00) for 1d period',
                          example: '2023-10-01'
                        },
                        pnl: {
                          type: 'number',
                          description: 'Net PnL for this specific day in USDC.',
                          example: 50.00
                        },
                        cumulativePnl: {
                          type: 'number',
                          description: 'Cumulative Net PnL from start of period up to this day in USDC.',
                          example: 150.00
                        }
                      }
                    }
                  }
                }
              },
              example: {
                success: true,
                data: [
                   { date: '2023-10-25 14:00', pnl: 50.00, cumulativePnl: 50.00 },
                   { date: '2023-10-25 15:00', pnl: -20.00, cumulativePnl: 30.00 },
                   { date: '2023-10-25 16:00', pnl: 100.00, cumulativePnl: 130.00 },
                   { date: '2023-10-25 17:00', pnl: 0, cumulativePnl: 130.00 }
                ]
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
      description: 'Retrieve breakdown of trades by Asset (e.g. BTC, ETH), Result (Win/Loss), and Strategy. Supports volume calculation.',
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
             enum: ['1d', '7d', '30d', 'all'],
             default: 'all'
           },
           description: 'Optional time period to filter data. Assets/Strategies filtered by Entry Time, Results filtered by Settlement Time.'
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
                        description: 'Distribution by Underlying Asset',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'BTC', description: 'Asset Symbol' },
                            count: { type: 'integer', example: 10, description: 'Number of trades' },
                            volume: { type: 'string', example: '1000.00', description: 'Volume in USDC (String)' }
                          }
                        }
                      },
                      results: {
                        type: 'array',
                        description: 'Distribution by Trade Result (Win/Loss/Expired)',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'Win', description: 'Result Type' },
                            count: { type: 'integer', example: 5, description: 'Number of trades' }
                          }
                        }
                      },
                      strategies: {
                        type: 'array',
                        description: 'Distribution by Option Strategy',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string', example: 'CALL_SPREAD', description: 'Strategy Name' },
                            count: { type: 'integer', example: 8, description: 'Number of trades' }
                          }
                        }
                      }
                    }
                  }
                }
              },
              example: {
                success: true,
                data: {
                  assets: [
                    { label: 'BTC', count: 12, volume: '15000.00' },
                    { label: 'ETH', count: 8, volume: '8000.00' }
                  ],
                  results: [
                    { label: 'Win', count: 15 },
                    { label: 'Loss', count: 4 },
                    { label: 'Expired', count: 1 }
                  ],
                  strategies: [
                    { label: 'CALL_SPREAD', count: 10 },
                    { label: 'PUT_SPREAD', count: 10 }
                  ]
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
