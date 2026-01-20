import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { neynarService } from '../services/neynar';

export const authController = {
  /**
   * Authenticate user - create if not exists, otherwise return existing user
   * Requires Bearer token from Farcaster Quick Auth
   * FID is extracted from the verified token (cannot be faked)
   * Profile data is fetched from Neynar API
   * 
   * POST /auth
   */
  authenticate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // FID comes from verified token (set by requireAuth middleware)
      const fid = req.user?.fid;
      
      if (!fid) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Fetch user profile data from Neynar
      const profileData = await neynarService.getUserDataByFid(fid);

      // Find user by FID (primary identity)
      let user = await prisma.user.findUnique({
        where: { fid: BigInt(fid) }
      });

      let isNewUser = false;

      if (!user) {
        // Create new user with verified FID and Neynar profile data
        user = await prisma.user.create({
          data: {
            fid: BigInt(fid),
            username: profileData.username,
            displayName: profileData.displayName,
            pfpUrl: profileData.pfpUrl,
            primaryEthAddress: profileData.primaryEthAddress
          }
        });
        isNewUser = true;
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastActiveAt: new Date(),
            // Update profile data from Neynar (always refresh)
            username: profileData.username || user.username,
            displayName: profileData.displayName || user.displayName,
            pfpUrl: profileData.pfpUrl || user.pfpUrl,
            // primaryEthAddress: profileData.primaryEthAddress || user.primaryEthAddress
          }
        });
      }

      res.status(isNewUser ? 201 : 200).json({
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
          },
          isNewUser
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
