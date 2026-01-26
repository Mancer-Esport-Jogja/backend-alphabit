import { Request, Response, NextFunction } from 'express';

import { getLogConfig, formatLogBody } from '../config/logging';

export const requestResponseLogger = (req: Request, res: Response, next: NextFunction) => {
  const config = getLogConfig('internal');

  // 1. Check Master Toggle & Exclusions
  if (!config.enabled || config.excludePaths.some(path => req.url.startsWith(path))) {
    return next();
  }

  // 2. Log Request
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  
  if (config.body && req.body && Object.keys(req.body).length > 0) {
    const formattedBody = formatLogBody(req.body, config);
    console.log('[REQUEST BODY]', formattedBody);
  }

  // 3. Capture Response Body
  const originalSend = res.send;
  res.send = function (body: any): Response {
    console.log(`[RESPONSE] ${res.statusCode} ${req.url}`);
    
    if (config.body) {
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        const formattedBody = formatLogBody(parsed, config);
        console.log('[RESPONSE BODY]', formattedBody);
      } catch (e) {
        // Fallback for non-JSON strings or buffers
        const strBody = String(body);
        if (strBody.length > config.maxBodyLength) {
           console.log('[RESPONSE BODY]', strBody.substring(0, config.maxBodyLength) + ' ... (truncated)');
        } else {
           console.log('[RESPONSE BODY]', strBody);
        }
      }
    }
    
    return originalSend.call(this, body);
  };

  next();
};
