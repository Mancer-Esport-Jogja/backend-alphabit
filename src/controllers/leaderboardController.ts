import { Request, Response, NextFunction } from 'express';
import { leaderboardService } from '../services/leaderboardService';
import { LEADERBOARD_METRICS, LEADERBOARD_PERIODS, LeaderboardPeriod, LeaderboardMetric } from '../lib/leaderboard';

export const leaderboardController = {
  /**
   * GET /api/leaderboard
   * Query Params:
   * - period: '24h', '7d', '30d', 'all' (default: 'all')
   * - sortBy: 'pnl', 'roi', 'volume', 'win_rate' (default: 'pnl')
   * - limit: number (default: 10)
   * - page: number (default: 1)
   */
  getLeaderboard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const period = (req.query.period as LeaderboardPeriod) || 'all';
      const sortBy = (req.query.sortBy as LeaderboardMetric) || 'pnl';
      const limit = parseInt(req.query.limit as string) || 10;
      const page = parseInt(req.query.page as string) || 1;

      // Validate inputs
      if (!LEADERBOARD_PERIODS.includes(period)) {
        res.status(400).json({ success: false, error: 'Invalid period. Use: 24h, 7d, 30d, all' });
        return;
      }
      if (!LEADERBOARD_METRICS.includes(sortBy)) {
        res.status(400).json({ success: false, error: 'Invalid sortBy. Use: pnl, roi, volume, win_rate' });
        return;
      }

      const result = await leaderboardService.getLeaderboard(period, sortBy, limit, page);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          period,
          sortBy,
          ...result.meta
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
