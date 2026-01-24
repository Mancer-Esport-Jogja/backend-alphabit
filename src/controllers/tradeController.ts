/**
 * Trade Controller - Handles trade-related endpoints
 */
import { Request, Response } from 'express';
import { syncUserTrades, getUserTrades, getUserTradeStats } from '../services/tradeService';
import { triggerManualSync } from '../services/schedulerService';
import { ErrorCodes, createErrorResponse } from '../lib/errors';
import prisma from '../lib/prisma';

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    fid: number;
  };
}

export const tradeController = {
  /**
   * POST /nuts/trades/sync
   * Sync user trades from Thetanuts to database
   * Requires authentication
   */
  syncTrades: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.fid) {
        return res.status(401).json(createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'Authentication required'
        ));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { fid: BigInt(req.user.fid) },
      });

      if (!user) {
        return res.status(404).json(createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'User not found'
        ));
      }

      if (!user.primaryEthAddress) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.MISSING_REQUIRED_FIELD,
          'User does not have a wallet address configured'
        ));
      }

      const result = await syncUserTrades(user.id, user.primaryEthAddress);

      res.status(200).json({
        success: true,
        data: result,
        message: `Synced ${result.synced} trades (${result.created} new, ${result.updated} updated)`,
      });
    } catch (error) {
      console.error('[TradeController] syncTrades error:', error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.SYNC_TRADES_FAILED,
        'Failed to sync trades from Thetanuts'
      ));
    }
  },

  /**
   * GET /nuts/trades
   * Get user trades from database
   * Requires authentication
   */
  getTrades: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.fid) {
        return res.status(401).json(createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'Authentication required'
        ));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { fid: BigInt(req.user.fid) },
      });

      if (!user) {
        return res.status(404).json(createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'User not found'
        ));
      }

      // Parse query params
      const status = req.query.status as 'OPEN' | 'SETTLED' | 'EXPIRED' | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await getUserTrades(user.id, { status, limit, offset });

      res.status(200).json({
        success: true,
        data: result.trades,
        meta: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + result.trades.length < result.total,
        },
      });
    } catch (error) {
      console.error('[TradeController] getTrades error:', error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.FETCH_TRADES_FAILED,
        'Failed to fetch trades'
      ));
    }
  },

  /**
   * GET /nuts/trades/stats
   * Get user trade statistics
   * Requires authentication
   */
  getTradeStats: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.fid) {
        return res.status(401).json(createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'Authentication required'
        ));
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { fid: BigInt(req.user.fid) },
      });

      if (!user) {
        return res.status(404).json(createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'User not found'
        ));
      }

      const stats = await getUserTradeStats(user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[TradeController] getTradeStats error:', error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.FETCH_TRADES_FAILED,
        'Failed to fetch trade statistics'
      ));
    }
  },

  /**
   * POST /nuts/trades/sync-all
   * Sync trades for all users (admin token required)
   */
  syncAllTrades: async (_req: Request, res: Response) => {
    try {
      const result = await triggerManualSync();
      res.status(200).json({
        success: true,
        data: result,
        message: `Synced ${result.totalSynced} trades across ${result.usersProcessed} users`,
      });
    } catch (error) {
      console.error('[TradeController] syncAllTrades error:', error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.SYNC_TRADES_FAILED,
        'Failed to sync all user trades'
      ));
    }
  },
};
