import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        fid: number;
      };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
    return;
  }

  const token = authorization.split(' ')[1];
  const result = await authService.verifyToken(token);

  if (!result.valid || !result.fid) {
    res.status(401).json({ error: result.error || 'Unauthorized' });
    return;
  }

  // Attach user info to request
  req.user = { fid: result.fid };
  
  next();
};
