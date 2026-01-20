import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const authController = {
  /**
   * Authenticate user - create if not exists, otherwise return existing user
   * POST /auth
   */
  authenticate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { walletAddress, fid, pictureProfile } = req.body;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'walletAddress is required'
        });
        return;
      }

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            walletAddress,
            fid: fid ? BigInt(fid) : null,
            pictureProfile: pictureProfile || null
          }
        });
        isNewUser = true;
      } else {
        // Update lastActiveAt for existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastActiveAt: new Date(),
            // Update fid and pictureProfile if provided
            ...(fid && { fid: BigInt(fid) }),
            ...(pictureProfile && { pictureProfile })
          }
        });
      }

      res.status(isNewUser ? 201 : 200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            walletAddress: user.walletAddress,
            fid: user.fid?.toString() || null,
            pictureProfile: user.pictureProfile,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastActiveAt: user.lastActiveAt
          },
          isNewUser
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
