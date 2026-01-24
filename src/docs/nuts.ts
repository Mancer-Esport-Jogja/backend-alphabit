/**
 * Nuts API documentation (Thetanuts Finance integration)
 */
export const nutsPaths = {
  '/nuts/config': {
    get: {
      summary: 'Get Thetanuts configuration',
      description: 'Returns contract addresses, ABIs, and referrer address for frontend integration',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Configuration retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      referrer: { type: 'string', example: '0x...' },
                      contracts: { type: 'object' },
                      abi: { type: 'object' },
                      urls: { type: 'object' }
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
  '/nuts/orders': {
    get: {
      summary: 'Get orders list',
      description: 'Fetches available option orders from Thetanuts',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Orders retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object' }
                }
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

**Referrer Filtering:**
Set \`filterByReferrer: true\` to only return positions created via Alphabit.
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
                  description: 'User wallet address',
                  example: '0x1234567890abcdef1234567890abcdef12345678'
                },
                type: {
                  type: 'string',
                  enum: ['open', 'history', 'all'],
                  description: 'Type of data to fetch',
                  example: 'open'
                },
                filterByReferrer: {
                  type: 'boolean',
                  description: 'Filter by Alphabit referrer address',
                  example: false
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
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'array' },
                  meta: {
                    type: 'object',
                    properties: {
                      count: { type: 'number' },
                      filteredByReferrer: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Bad request',
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
    post: {
      summary: 'Trigger sync after trade',
      description: 'Triggers indexer sync on Thetanuts. Call after executing a trade.',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Sync triggered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/nuts/stats': {
    get: {
      summary: 'Get Thetanuts stats',
      description: 'Fetches protocol statistics from Thetanuts Finance',
      tags: ['Nuts'],
      responses: {
        '200': {
          description: 'Stats retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/nuts/payout/calculate': {
    post: {
      summary: 'Calculate option payout',
      description: 'Calculate max payout, payout at price, and break-even for an option order',
      tags: ['Nuts'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['strikes', 'isCall', 'numContracts'],
              properties: {
                strikes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Strike prices (8 decimals)',
                  example: ['10000000000', '11000000000']
                },
                isCall: {
                  type: 'boolean',
                  description: 'Is this a call option',
                  example: true
                },
                price: {
                  type: 'string',
                  description: 'Premium price (8 decimals)',
                  example: '5000000'
                },
                numContracts: {
                  type: 'number',
                  description: 'Number of contracts',
                  example: 1
                },
                settlementPrice: {
                  type: 'number',
                  description: 'Settlement price for payout calculation',
                  example: 105
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Payout calculated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      maxPayout: { type: 'number' },
                      payoutAtPrice: { type: 'number', nullable: true },
                      breakeven: { type: 'number', nullable: true },
                      optionType: { type: 'string' }
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
  '/nuts/trades/sync': {
    post: {
      summary: 'Sync trades to database',
      description: 'Syncs user trades from Thetanuts to local database. Requires authentication.',
      tags: ['Nuts - Trades (BE Only - Not Used)'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Trades synced successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      synced: { type: 'number' },
                      created: { type: 'number' },
                      updated: { type: 'number' }
                    }
                  },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/nuts/trades/sync-all': {
    post: {
      summary: 'Sync all users trades to database',
      description: 'Syncs trades for all users. Requires admin token header.',
      tags: ['Nuts - Trades (BE Only - Not Used)'],
      parameters: [
        {
          name: 'x-admin-token',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          description: 'Admin token configured in ADMIN_SYNC_TOKEN'
        }
      ],
      responses: {
        '200': {
          description: 'All user trades synced successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      usersProcessed: { type: 'number' },
                      totalSynced: { type: 'number' },
                      totalCreated: { type: 'number' },
                      totalUpdated: { type: 'number' },
                      errors: { type: 'number' }
                    }
                  },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/nuts/trades': {
    get: {
      summary: 'Get user trades',
      description: 'Get user trades from local database. Requires authentication.',
      tags: ['Nuts - Trades (BE Only - Not Used)'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['OPEN', 'SETTLED', 'EXPIRED'] },
          description: 'Filter by trade status'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50, maximum: 100 },
          description: 'Number of results'
        },
        {
          name: 'offset',
          in: 'query',
          schema: { type: 'integer', default: 0 },
          description: 'Pagination offset'
        }
      ],
      responses: {
        '200': {
          description: 'Trades retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { type: 'array' },
                  meta: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      limit: { type: 'number' },
                      offset: { type: 'number' },
                      hasMore: { type: 'boolean' }
                    }
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    }
  },
  '/nuts/trades/stats': {
    get: {
      summary: 'Get trade statistics',
      description: 'Get user trade statistics. Requires authentication.',
      tags: ['Nuts - Trades (BE Only - Not Used)'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Stats retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      open: { type: 'number' },
                      settled: { type: 'number' },
                      expired: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized',
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
