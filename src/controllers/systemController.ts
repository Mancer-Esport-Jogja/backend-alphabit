import { Request, Response, NextFunction } from 'express';

export const systemController = {
  /**
   * Returns system information.
   */
  getInfo: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: {
          message: "Alphabit Backend System Info",
          timestamp: new Date().toISOString(),
          version: "1.0.0"
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Health check endpoint.
   */
  getHealth: (req: Request, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime()
      }
    });
  }
};
