import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false // Disable CSP for Swagger in dev
})); 
app.use(morgan('dev')); 
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Swagger API Documentation - Only available in non-production
if (env.NODE_ENV !== 'production') {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Alphabit API Docs'
  }));
  console.log('📚 Swagger docs available at /docs');
}

// Routes
app.use('/', routes); 

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Global Error Handler (Must be last)
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
});
