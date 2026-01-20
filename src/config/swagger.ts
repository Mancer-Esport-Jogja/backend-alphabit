import { schemas, authPaths, usersPaths, systemPaths, ordersPaths } from '../docs';

/**
 * Swagger/OpenAPI Configuration
 * 
 * Documentation is organized in src/docs/ folder:
 * - schemas.ts   : Common schema definitions
 * - auth.ts      : Auth endpoints documentation
 * - users.ts     : Users endpoints documentation  
 * - system.ts    : System endpoints documentation
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
- **Development**: \`http://localhost:3000\`
- **Production**: \`http://be.alphabit.mfahrurozi.my.id\`
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
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'http://be.alphabit.mfahrurozi.my.id/api',
      description: 'Production server'
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
      name: 'Orders',
      description: 'Order management'
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
    ...ordersPaths,
    ...systemPaths
  }
};
