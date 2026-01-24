import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  if (!env.ADMIN_SYNC_TOKEN) {
    res.status(500).json({
      success: false,
      error: 'Admin token is not configured',
    });
    return;
  }

  const headerToken = req.headers['x-admin-token'];
  const token = Array.isArray(headerToken) ? headerToken[0] : headerToken;

  if (!token || token !== env.ADMIN_SYNC_TOKEN) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid admin token',
    });
    return;
  }

  next();
}
