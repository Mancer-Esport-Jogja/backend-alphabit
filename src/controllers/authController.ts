import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { neynarService } from '../services/neynar';
import { configService } from '../services/configService';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

import { isDevelopment } from '../config/env';
import { getDevUserByFid } from '../config/mockData';

// Initialize public client for Smart Wallet signature verification (ERC-1271)
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

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

      // Check if user exists in database first
      let user = await prisma.user.findUnique({
        where: { fid: BigInt(fid) }
      });

      let isNewUser = false;

      if (user) {
        // User exists - skip Neynar fetch, just update streaks/activity
        
        // Calculate Streak (UTC Midnight)
        const now = new Date();
        const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        
        let newStreak = user.currentLoginStreak;
        let lastLoginDateToUpdate = user.lastLoginDate;
        
        if (!user.lastLoginDate) {
           // First time tracking streak
           newStreak = 1;
           lastLoginDateToUpdate = todayUtc;
        } else {
           // Compare UTC dates (ignoring time)
           const lastLoginUtc = new Date(Date.UTC(
             user.lastLoginDate.getUTCFullYear(), 
             user.lastLoginDate.getUTCMonth(), 
             user.lastLoginDate.getUTCDate()
           ));
           
           const diffTime = todayUtc.getTime() - lastLoginUtc.getTime();
           const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
           
           if (diffDays === 1) {
             // Consecutive day
             newStreak++;
             lastLoginDateToUpdate = todayUtc;
           } else if (diffDays > 1) {
             // Missed a day (or more)
             newStreak = 1;
             lastLoginDateToUpdate = todayUtc;
           }
           // if 0, same day, do nothing to streak
        }

        // Update existing user (WITHOUT updating profile from Neynar)
        const maxStreak = Math.max(newStreak, user.maxLoginStreak);

        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastActiveAt: new Date(),
            
            // Streak updates
            currentLoginStreak: newStreak,
            maxLoginStreak: maxStreak,
            lastLoginDate: lastLoginDateToUpdate,
          }
        });

      } else {
        // New user - fetch profile data from Neynar
        const profileData = await neynarService.getUserDataByFid(fid);

        // Fetch default status configuration
        // Default to 'true' (ACTIVE) if not set
        const defaultStatusActive = await configService.get('DEFAULT_USER_STATUS_ACTIVE', 'true');
        let initialStatus: 'ACTIVE' | 'INACTIVE' = defaultStatusActive === 'true' ? 'ACTIVE' : 'INACTIVE';

        // DEV MODE: Use status from mock data if available
        if (isDevelopment) {
            const devUser = getDevUserByFid(Number(fid));
            if (devUser && devUser.status) {
                // @ts-ignore - Prisma enum compatibility
                initialStatus = devUser.status;
            }
        }

        // Create new user with verified FID and Neynar profile data
        user = await prisma.user.create({
          data: {
            fid: BigInt(fid),
            username: profileData.username,
            displayName: profileData.displayName,
            pfpUrl: profileData.pfpUrl,
            primaryEthAddress: profileData.primaryEthAddress,
            status: initialStatus
          }
        });
        isNewUser = true;
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
            lastActiveAt: user.lastActiveAt,
            currentLoginStreak: user.currentLoginStreak,
            maxLoginStreak: user.maxLoginStreak,
            currentWinStreak: user.currentWinStreak,
            maxWinStreak: user.maxWinStreak,
            status: user.status
          },
          isNewUser
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bind a wallet address to the user account
   * Requires:
   * 1. Valid Auth Token (from Farcaster)
   * 2. Wallet Address
   * 3. Signature (SIWE) proving ownership of the wallet
   * 
   * POST /auth/bind-wallet
   */
  bindWallet: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fid = req.user?.fid;
      const { address, signature } = req.body;

      if (!fid) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      if (!address || !signature) {
        res.status(400).json({ success: false, error: 'Address and signature are required' });
        return;
      }

      // 1. Verify Signature (SIWE)
      // Message format should be consistent with Frontend: "Sync Wallet {address} to Alphabit Account {fid}"
      const message = `Sync Wallet ${address} to Alphabit Account ${fid}`;
      
      // Use publicClient to verify message (supports Smart Wallets / ERC-1271)
      const valid = await publicClient.verifyMessage({
        address: address,
        message: message,
        signature: signature,
      });

      if (!valid) {
        res.status(401).json({ success: false, error: 'Invalid signature' });
        return;
      }

      // 2. Update User
      const user = await prisma.user.update({
        where: { fid: BigInt(fid) },
        data: {
          primaryEthAddress: address
        }
      });
      
      console.log(`[Auth] User ${fid} bound wallet: ${address}`);

      res.status(200).json({
        success: true,
        data: {
            message: 'Wallet bound successfully',
            user: {
                id: user.id,
                fid: user.fid.toString(),
                primaryEthAddress: user.primaryEthAddress
            }
        }
      });

    } catch (error) {
      next(error);
    }
  }
};

