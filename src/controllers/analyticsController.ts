import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import prisma from '../lib/prisma';

export const analyticsController = {
  /**
   * GET /api/user/analytics/summary
   */
  getSummary: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.fid) throw new Error('Unauthorized');

      // Resolve FID to User ID
      const user = await prisma.user.findUnique({
        where: { fid: BigInt(req.user.fid) },
        select: { id: true }
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const data = await analyticsService.getUserSummary(user.id);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/user/analytics/pnl-history
   */
  getPnLHistory: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.fid) throw new Error('Unauthorized');

      const user = await prisma.user.findUnique({
        where: { fid: BigInt(req.user.fid) },
        select: { id: true }
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const rawPeriod = req.query.period as string | undefined;
      const normalizedPeriod = rawPeriod === '1d' ? '24h' : rawPeriod;
      const period = (normalizedPeriod as '24h' | '7d' | '30d' | 'all') || '30d';
      const data = await analyticsService.getPnLHistory(user.id, period);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/user/analytics/distribution
   */
  getDistribution: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.fid) throw new Error('Unauthorized');

      const user = await prisma.user.findUnique({
        where: { fid: BigInt(req.user.fid) },
        select: { id: true }
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const rawPeriod = req.query.period as string | undefined;
      const normalizedPeriod = rawPeriod === '1d' ? '24h' : rawPeriod;
      const period = (normalizedPeriod as '24h' | '7d' | '30d' | 'all') || 'all';
      const data = await analyticsService.getDistribution(user.id, period);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
