import { Request, Response, NextFunction } from 'express';

export const marketController = {
  /**
   * Proxies Binance klines (historical data)
   * GET /api/market/klines?symbol=ETHUSDT&interval=5m&limit=50
   */
  getBinanceKlines: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { symbol = 'ETHUSDT', interval = '5m', limit = '50' } = req.query;
      
      const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      
      const response = await fetch(binanceUrl);
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: {
            code: 'BINANCE_ERROR',
            message: `Binance API responded with status ${response.status}`,
          },
        });
      }
      
      const data = await response.json();
      
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
