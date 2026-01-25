import { schemas, authPaths, usersPaths, systemPaths, nutsPaths, analyticsPaths, leaderboardPaths } from '../docs';

/**
 * Swagger/OpenAPI Configuration
 * 
 * Documentation is organized in src/docs/ folder:
 * - schemas.ts   : Common schema definitions
 * - auth.ts      : Auth endpoints documentation
 * - users.ts     : Users endpoints documentation  
 * - system.ts    : System endpoints documentation
 * - analytics.ts : Analytics endpoints documentation
 */
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Alphabit API',
    version: '1.0.0',
    description: `
## Alphabit Backend API

Backend service for Alphabit Web3 Mini-App.

### Authentication
Most endpoints require a Bearer token from Farcaster Quick Auth.

### Base URL
- **Production**: \`https://backend-alphabit.onrender.com\`
    `,
    contact: {
      name: 'Alphabit Team'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/api',
      description: 'Current environment server'
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and user registration'
    },
    {
      name: 'Users',
      description: 'User profile management'
    },
    {
      name: 'Nuts',
      description: 'Thetanuts Finance integration (orders and positions)'
    },
    {
      name: 'Analytics',
      description: 'User trading analytics and statistics'
    },
    {
      name: 'Leaderboard',
      description: 'Leaderboard built from bucketed daily stats (event-driven rollups)'
    },
    {
      name: 'System',
      description: 'System information and health checks'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Farcaster Quick Auth JWT token'
      }
    },
    schemas
  },
  paths: {
    ...authPaths,
    ...usersPaths,
    ...nutsPaths,
    ...analyticsPaths,
    ...leaderboardPaths,
    ...systemPaths
  }
};
