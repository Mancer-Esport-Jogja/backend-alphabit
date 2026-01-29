/**
 * Trade Service - Handles syncing and fetching trade activities
 */
import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';
import { env } from '../config/env';
import { configService } from './configService';
import { getOptionTypeLabel } from '../lib/payoutCalculator';
import { statsService } from './statsService';
import { fetchWithLogging } from '../lib/httpClient';
import { sendBatchNotification } from './notificationService';


// Thetanuts API position type - Complete mapping from API response
interface ThetanutsPosition {
  address: string;
  status: string;                     // "open" | "settled"
  buyer: string;
  seller: string;
  referrer: string | null;
  createdBy: string;
  
  // Entry transaction info
  entryTimestamp: number;
  entryTxHash: string;
  entryBlock: number;
  entryPremium: string;
  entryFeePaid: string;
  
  // Close transaction info (only for settled)
  closeTimestamp: number | null;
  closeTxHash: string | null;
  closeBlock: number | null;
  
  // Collateral info
  collateralToken: string;
  collateralSymbol: string;
  collateralDecimals: number;
  
  // Option details
  underlyingAsset: string;
  priceFeed: string;
  strikes: string[];
  expiryTimestamp: number;
  numContracts: string;
  collateralAmount: string;
  optionType: number;                 // Raw bitmask (optionTypeRaw)
  
  // Settlement data (null for open positions)
  settlement: {
    settlementPrice: string;
    payoutBuyer: string | null;
    collateralReturnedSeller: string | null;
    exercised: boolean | null;
    deliveryAmount: string | null;
    deliveryCollateral: string | null;
    explicitDecision: string | null;
    oracleFailure: boolean | null;
    oracleFailureReason: string | null;
  } | null;
  
  // Explicit close data (for early/manual close)
  explicitClose: unknown | null;
}

type TradeStatus = 'OPEN' | 'SETTLED' | 'EXPIRED';

/**
 * Determine if option is a call based on optionType number
 * From Thetanuts docs: optionType is a bitmask where bit 0 = isCall
 */
function isCallFromOptionType(optionType: number): boolean {
  return (optionType & 1) === 1;
}

/**
 * Determine if position is long based on optionType number
 * From Thetanuts docs: optionType is a bitmask where bit 8 = isLong
 */
function isLongFromOptionType(optionType: number): boolean {
  return (optionType & 256) === 256;
}

/**
 * Map Thetanuts position to TradeActivity create input
 */
function mapPositionToTradeActivity(userId: string, position: ThetanutsPosition) {
  const isCall = isCallFromOptionType(position.optionType);
  const isLong = isLongFromOptionType(position.optionType);
  const optionType = getOptionTypeLabel(position.strikes.length, isCall);

  let status: TradeStatus = 'OPEN';
  if (position.status === 'settled') {
    status = 'SETTLED';
  } else if (position.expiryTimestamp * 1000 < Date.now() && position.status !== 'settled') {
    status = 'EXPIRED';
  }

  return {
    userId,
    
    // Identifiers
    optionAddress: position.address,
    txHash: position.entryTxHash,
    status,
    
    // Option details
    underlyingAsset: position.underlyingAsset,
    optionType,
    optionTypeRaw: position.optionType,
    isCall,
    isLong,
    strikes: position.strikes,
    expiryTimestamp: new Date(position.expiryTimestamp * 1000),
    
    // Parties
    buyer: position.buyer,
    seller: position.seller,
    referrer: position.referrer || null,
    createdBy: position.createdBy || null,
    
    // Collateral & Oracle
    collateralToken: position.collateralToken,
    collateralSymbol: position.collateralSymbol,
    collateralDecimals: position.collateralDecimals,
    priceFeed: position.priceFeed || null,
    
    // Entry financials
    entryPremium: position.entryPremium,
    entryFeePaid: position.entryFeePaid,
    numContracts: position.numContracts,
    collateralAmount: position.collateralAmount,
    
    // Entry transaction
    entryTimestamp: new Date(position.entryTimestamp * 1000),
    entryBlock: position.entryBlock || null,
    
    // Settlement data
    settlementPrice: position.settlement?.settlementPrice || null,
    payoutBuyer: position.settlement?.payoutBuyer || null,
    collateralReturnedSeller: position.settlement?.collateralReturnedSeller || null,
    exercised: position.settlement?.exercised ?? null,
    
    // Close transaction
    closeTimestamp: position.closeTimestamp 
      ? new Date(position.closeTimestamp * 1000) 
      : null,
    closeTxHash: position.closeTxHash || null,
    closeBlock: position.closeBlock || null,
    
    // Oracle failure tracking
    oracleFailure: position.settlement?.oracleFailure ?? false,
    oracleFailureReason: position.settlement?.oracleFailureReason || null,
    
    // Explicit close - use Prisma.JsonNull for null JSON values
    explicitClose: position.explicitClose 
      ? (position.explicitClose as Prisma.InputJsonValue)
      : Prisma.DbNull,
      
    // Analytics Data (Computed)
    pnl: calculatePnL(position),
    roiPercent: calculateRoi(position),
    normalizedVolume: calculateVolume(position),
  };
}

/**
 * Calculate PnL in USD
 */
function calculatePnL(position: ThetanutsPosition): number | null {
  if (position.status !== 'settled' || !position.settlement?.payoutBuyer) return null;
  
  const decimals = position.collateralDecimals || 6;
  const divisor = Math.pow(10, decimals);
  
  const premium = Number(position.entryPremium) / divisor;
  const payout = Number(position.settlement.payoutBuyer) / divisor;
  
  return payout - premium;
}

/**
 * Calculate ROI in %
 */
function calculateRoi(position: ThetanutsPosition): number | null {
  if (position.status !== 'settled' || !position.settlement?.payoutBuyer) return null;
  
  const decimals = position.collateralDecimals || 6;
  const divisor = Math.pow(10, decimals);
  
  const premium = Number(position.entryPremium) / divisor;
  const payout = Number(position.settlement.payoutBuyer) / divisor;
  
  if (premium === 0) return 0;
  
  return ((payout - premium) / premium) * 100;
}


/**
 * Calculate Normalized Volume (Entry Premium - actual user spend)
 */
function calculateVolume(position: ThetanutsPosition): number {
  const decimals = position.collateralDecimals || 6;
  const divisor = Math.pow(10, decimals);
  return Number(position.entryPremium) / divisor;
}


/**
 * Fetch positions from Thetanuts API
 */
async function fetchPositionsFromThetanuts(
  walletAddress: string, 
  type: 'open' | 'history'
): Promise<ThetanutsPosition[]> {
  const endpoint = type === 'open' ? 'positions' : 'history';
  const indexerUrl = await configService.get('THETANUTS_INDEXER_URL');
  const url = `${indexerUrl}/user/${walletAddress}/${endpoint}`;
  
  const response = await fetchWithLogging(url);
  if (!response.ok) {
    throw new Error(`Thetanuts API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Sync user trades from Thetanuts to database
 * Returns count of status transitions for notification purposes
 */
export async function syncUserTrades(userId: string, walletAddress: string): Promise<{
  synced: number;
  created: number;
  updated: number;
  settledCount: number;
  expiredCount: number;
}> {
  // Fetch both open positions and history
  const [positions, history] = await Promise.all([
    fetchPositionsFromThetanuts(walletAddress, 'open'),
    fetchPositionsFromThetanuts(walletAddress, 'history'),
  ]);

  // Combine and deduplicate by txHash
  const allPositions = [...positions, ...history];
  const uniquePositions = new Map<string, ThetanutsPosition>();
  for (const pos of allPositions) {
    uniquePositions.set(pos.entryTxHash, pos);
  }

  // Filter by our referrer if configured
  let positionsToSync = Array.from(uniquePositions.values());
  const referrerAddress = await configService.get('ALPHABIT_REFERRER_ADDRESS');
  
  if (referrerAddress) {
    positionsToSync = positionsToSync.filter(
      p => p.referrer?.toLowerCase() === referrerAddress.toLowerCase()
    );
  }

  let created = 0;
  let updated = 0;
  let settledCount = 0;
  let expiredCount = 0;

  // Upsert each position
  for (const position of positionsToSync) {
    const data = mapPositionToTradeActivity(userId, position);
    
    const existing = await prisma.tradeActivity.findUnique({
      where: { txHash: position.entryTxHash },
    });

    if (existing) {
      // Check for status transition: OPEN → SETTLED/EXPIRED
      const statusChanged = existing.status === 'OPEN' && data.status !== 'OPEN';
      
      await prisma.tradeActivity.update({
        where: { txHash: position.entryTxHash },
        data: {
          // Status can change from OPEN → SETTLED/EXPIRED
          status: data.status,
          
          // Settlement data (populated when settled)
          settlementPrice: data.settlementPrice,
          payoutBuyer: data.payoutBuyer,
          collateralReturnedSeller: data.collateralReturnedSeller,
          exercised: data.exercised,
          
          // Close transaction (populated when settled)
          closeTimestamp: data.closeTimestamp,
          closeTxHash: data.closeTxHash,
          closeBlock: data.closeBlock,
          
          // Oracle failure tracking
          oracleFailure: data.oracleFailure,
          oracleFailureReason: data.oracleFailureReason,
          
          // Explicit close
          explicitClose: data.explicitClose,

          // Analytics Data
          pnl: data.pnl,
          roiPercent: data.roiPercent,
          normalizedVolume: data.normalizedVolume,
        },
      });
      updated++;
      
      // Track status transitions for notifications
      if (statusChanged) {
        if (data.status === 'SETTLED') settledCount++;
        if (data.status === 'EXPIRED') expiredCount++;
      }
    } else {
      await prisma.tradeActivity.create({
        data,
      });
      created++;
    }
  }

  // Recalculate Win Streak (UTC-based logic not needed for win streak as it is event based)
  await updateWinStreakForUser(userId);

  // Recalculate User Stats (Leaderboard - Option B)
  // This is the "Event-Driven" trigger with "Self-Correction" (Full Recalculation)
  if (created > 0 || updated > 0) {
    await statsService.recalculateUserDailyStats(userId);
    await statsService.recalculateUserStats(userId);
  }

  return {
    synced: positionsToSync.length,
    created,
    updated,
    settledCount,
    expiredCount,
  };
}

/**
 * Recalculate and update Win Streak for a user
 */
async function updateWinStreakForUser(userId: string) {
  // Fetch all settled trades sorted by time
  const settledTrades = await prisma.tradeActivity.findMany({
    where: { 
      userId,
      status: 'SETTLED'
    },
    orderBy: { entryTimestamp: 'asc' }, // Oldest first
    select: { payoutBuyer: true }
  });

  let currentStreak = 0;
  let maxStreak = 0;

  for (const trade of settledTrades) {
    const payout = parseFloat(trade.payoutBuyer || '0');
    if (payout > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Update user stats
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentWinStreak: currentStreak,
      maxWinStreak: maxStreak
    }
  });
}

/**
 * Get user trades from database
 */
export async function getUserTrades(
  userId: string,
  options?: {
    status?: TradeStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{
  trades: Awaited<ReturnType<typeof prisma.tradeActivity.findMany>>;
  total: number;
}> {
  const where = {
    userId,
    ...(options?.status && { status: options.status }),
  };

  const [trades, total] = await Promise.all([
    prisma.tradeActivity.findMany({
      where,
      orderBy: { entryTimestamp: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.tradeActivity.count({ where }),
  ]);

  return { trades, total };
}

/**
 * Get trade by txHash
 */
export async function getTradeByTxHash(txHash: string) {
  return prisma.tradeActivity.findUnique({
    where: { txHash },
    include: { user: true },
  });
}

/**
 * Get user trade statistics
 */
export async function getUserTradeStats(userId: string) {
  const [openCount, settledCount, expiredCount] = await Promise.all([
    prisma.tradeActivity.count({ where: { userId, status: 'OPEN' } }),
    prisma.tradeActivity.count({ where: { userId, status: 'SETTLED' } }),
    prisma.tradeActivity.count({ where: { userId, status: 'EXPIRED' } }),
  ]);

  return {
    total: openCount + settledCount + expiredCount,
    open: openCount,
    settled: settledCount,
    expired: expiredCount,
  };
}

// ═══════════════════════════════════════════════════════════════════
// SCHEDULER SUPPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Trigger Thetanuts indexer update
 * Call this before syncing to ensure data is fresh
 */
export async function triggerIndexerUpdate(): Promise<void> {
  const indexerUrl = await configService.get('THETANUTS_INDEXER_URL');
  const url = `${indexerUrl}/update`;
  
  try {
    const response = await fetchWithLogging(url, { method: 'POST' });
    if (!response.ok) {
      console.warn(`[TradeService] Indexer update returned ${response.status}`);
    } else {
      console.log('[TradeService] Indexer update triggered successfully');
    }
  } catch (error) {
    console.error('[TradeService] Failed to trigger indexer update:', error);
    // Don't throw - sync can still proceed with potentially stale data
  }
}

/**
 * Sync trades for all active users with wallet addresses
 * Used by scheduler for periodic background sync
 */
export async function syncAllActiveUsers(): Promise<{
  usersProcessed: number;
  totalSynced: number;
  totalCreated: number;
  totalUpdated: number;
  errors: number;
}> {
  // Get all ACTIVE users with wallet addresses
  const users = await prisma.user.findMany({
    where: {
      primaryEthAddress: { not: null },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      fid: true,
      primaryEthAddress: true,
      username: true,
    },
  });

  console.log(`[TradeService] Found ${users.length} users with wallets to sync`);

  let totalSynced = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let errors = 0;
  
  // Collect FIDs for batch notifications
  const settledFids: number[] = [];
  const expiredFids: number[] = [];

  for (const user of users) {
    if (!user.primaryEthAddress) continue;

    try {
      const result = await syncUserTrades(user.id, user.primaryEthAddress);
      totalSynced += result.synced;
      totalCreated += result.created;
      totalUpdated += result.updated;
      
      // Collect FIDs with status transitions
      if (result.settledCount > 0) settledFids.push(Number(user.fid));
      if (result.expiredCount > 0) expiredFids.push(Number(user.fid));
      
      if (result.synced > 0) {
        console.log(`[TradeService] User ${user.username || user.id}: synced ${result.synced} trades (settled: ${result.settledCount}, expired: ${result.expiredCount})`);
      }
    } catch (error) {
      errors++;
      console.error(`[TradeService] Failed to sync user ${user.id}:`, error);
    }
  }

  // Send batch notifications (1 API call per status type)
  try {
    if (settledFids.length > 0) {
      await sendBatchNotification('TRADE_SETTLED', settledFids);
    }
    if (expiredFids.length > 0) {
      await sendBatchNotification('TRADE_EXPIRED', expiredFids);
    }
  } catch (error) {
    console.error('[TradeService] Failed to send notifications:', error);
  }

  return {
    usersProcessed: users.length,
    totalSynced,
    totalCreated,
    totalUpdated,
    errors,
  };
}

/**
 * Get FIDs of ACTIVE users with trades expiring within a time window
 * Used by expiry reminder cron job at 7 AM UTC
 */
export async function getExpiringTrades(withinMinutes: number = 60): Promise<number[]> {
  const now = new Date();
  const expiryWindow = new Date(now.getTime() + withinMinutes * 60 * 1000);
  
  const trades = await prisma.tradeActivity.findMany({
    where: {
      status: 'OPEN',
      expiryTimestamp: {
        gte: now,
        lte: expiryWindow
      },
      user: {
        status: 'ACTIVE'
      }
    },
    include: { 
      user: { 
        select: { fid: true } 
      } 
    }
  });
  
  // Get unique FIDs
  const fids = [...new Set(trades.map(t => Number(t.user.fid)))];
  console.log(`[TradeService] Found ${trades.length} trades expiring within ${withinMinutes} minutes for ${fids.length} users`);
  return fids;
}
