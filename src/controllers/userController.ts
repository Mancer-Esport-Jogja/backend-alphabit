import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const userController = {
  /**
   * Returns the authenticated user's full profile from database.
   * GET /users/me
   */
  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fid = req.user?.fid;

      if (!fid) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Fetch full user from database
      const user = await prisma.user.findUnique({
        where: { fid: BigInt(fid) }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found. Please authenticate first via /auth endpoint.'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            fid: user.fid.toString(),
            username: user.username,
            displayName: user.displayName,
            pfpUrl: user.pfpUrl,
            primaryEthAddress: user.primaryEthAddress,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastActiveAt: user.lastActiveAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
