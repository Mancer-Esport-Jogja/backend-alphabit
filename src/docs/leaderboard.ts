/**
 * Leaderboard Endpoints Documentation
 */

export const leaderboardPaths = {
  '/leaderboard': {
    get: {
      tags: ['Leaderboard'],
      summary: 'Get leaderboard',
      description:
        'Leaderboard built from bucketed daily stats (event-driven rollup). Periods use UTC day buckets; 24h uses today + yesterday buckets.',
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: {
            type: 'string',
            enum: ['24h', '7d', '30d', 'all'],
            default: 'all'
          },
          description: 'Leaderboard window.'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            enum: ['pnl', 'roi', 'volume', 'win_rate'],
            default: 'pnl'
          },
          description: 'Metric used for ranking.'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10,
            maximum: 100
          },
          description: 'Page size (max 100).'
        },
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Page number (1-based).'
        }
      ],
      responses: {
        200: {
          description: 'Leaderboard data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        rank: { type: 'integer', example: 1 },
                        userId: { type: 'string', example: 'user_123' },
                        username: { type: 'string', example: 'trader_alpha' },
                        displayName: { type: 'string', example: 'Alpha Trader' },
                        pfpUrl: { type: 'string', example: 'https://example.com/pfp.png' },
                        stats: {
                          type: 'object',
                          properties: {
                            totalPnl: { type: 'number', example: 1500.5 },
                            roi: { type: 'number', example: 25.5 },
                            totalVolume: { type: 'number', example: 25000.0 },
                            totalTrades: { type: 'integer', example: 42 },
                            winRate: { type: 'number', example: 64.3 }
                          }
                        }
                      }
                    }
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      period: { type: 'string', example: '7d' },
                      sortBy: { type: 'string', example: 'pnl' },
                      total: { type: 'integer', example: 200 },
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 }
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
};
