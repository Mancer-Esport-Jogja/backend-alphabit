import { Request, Response, NextFunction } from 'express';

export const requestResponseLogger = (req: Request, res: Response, next: NextFunction) => {
  // 1. Log Request
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[REQUEST BODY]', JSON.stringify(req.body, null, 2));
  }

  // 2. Capture Response Body
  const originalSend = res.send;
  res.send = function (body: any): Response {
    console.log(`[RESPONSE] ${res.statusCode} ${req.url}`);
    
    // Attempt to parse if it's JSON string, otherwise just log as is
    try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        console.log('[RESPONSE BODY]', JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log('[RESPONSE BODY]', body);
    }
    
    return originalSend.call(this, body);
  };

  next();
};
