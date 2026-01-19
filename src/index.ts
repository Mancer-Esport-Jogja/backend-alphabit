import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes'; // Revert import to root routes
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middleware
app.use(helmet()); 
app.use(morgan('dev')); 
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// Routes
// Direct resource routing (e.g., /users, /system)
app.use('/', routes); 

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Global Error Handler (Must be last)
app.use(errorHandler);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Start server
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
