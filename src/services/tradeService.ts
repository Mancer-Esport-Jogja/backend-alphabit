/**
 * Trade Service - Handles syncing and fetching trade activities
 */
import prisma from '../lib/prisma';
import { env } from '../config/env';
import { getOptionTypeLabel } from '../lib/payoutCalculator';

// Thetanuts API position type
interface ThetanutsPosition {
  address: string;
  status: string;
  buyer: string;
  seller: string;
  referrer: string;
  createdBy: string;
  entryTimestamp: number;
  entryTxHash: string;
  entryPremium: string;
  entryFeePaid: string;
  collateralToken: string;
  collateralSymbol: string;
  collateralDecimals: number;
  underlyingAsset: string;
  priceFeed: string;
  strikes: string[];
  expiryTimestamp: number;
  numContracts: string;
  collateralAmount: string;
  optionType: number;
  settlement: {
    settlementPrice: string;
    payoutBuyer: string;
    payoutSeller: string;
  } | null;
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
    optionAddress: position.address,
    txHash: position.entryTxHash,
    status,
    underlyingAsset: position.underlyingAsset,
    optionType,
    isCall,
    isLong,
    strikes: position.strikes,
    expiryTimestamp: new Date(position.expiryTimestamp * 1000),
    buyer: position.buyer,
    seller: position.seller,
    referrer: position.referrer || null,
    collateralToken: position.collateralToken,
    collateralSymbol: position.collateralSymbol,
    collateralDecimals: position.collateralDecimals,
    entryPremium: position.entryPremium,
    entryFeePaid: position.entryFeePaid,
    numContracts: position.numContracts,
    collateralAmount: position.collateralAmount,
    entryTimestamp: new Date(position.entryTimestamp * 1000),
    // Settlement data
    settlementPrice: position.settlement?.settlementPrice || null,
    payoutBuyer: position.settlement?.payoutBuyer || null,
    payoutSeller: position.settlement?.payoutSeller || null,
    settledAt: position.settlement ? new Date() : null,
  };
}

/**
 * Fetch positions from Thetanuts API
 */
async function fetchPositionsFromThetanuts(
  walletAddress: string, 
  type: 'open' | 'history'
): Promise<ThetanutsPosition[]> {
  const endpoint = type === 'open' ? 'positions' : 'history';
  const url = `${env.THETANUTS_INDEXER_URL}/user/${walletAddress}/${endpoint}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Thetanuts API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Sync user trades from Thetanuts to database
 */
export async function syncUserTrades(userId: string, walletAddress: string): Promise<{
  synced: number;
  created: number;
  updated: number;
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
  if (env.ALPHABIT_REFERRER_ADDRESS) {
    positionsToSync = positionsToSync.filter(
      p => p.referrer?.toLowerCase() === env.ALPHABIT_REFERRER_ADDRESS.toLowerCase()
    );
  }

  let created = 0;
  let updated = 0;

  // Upsert each position
  for (const position of positionsToSync) {
    const data = mapPositionToTradeActivity(userId, position);
    
    const existing = await prisma.tradeActivity.findUnique({
      where: { txHash: position.entryTxHash },
    });

    if (existing) {
      await prisma.tradeActivity.update({
        where: { txHash: position.entryTxHash },
        data: {
          status: data.status,
          settlementPrice: data.settlementPrice,
          payoutBuyer: data.payoutBuyer,
          payoutSeller: data.payoutSeller,
          settledAt: data.settledAt,
        },
      });
      updated++;
    } else {
      await prisma.tradeActivity.create({
        data,
      });
      created++;
    }
  }

  return {
    synced: positionsToSync.length,
    created,
    updated,
  };
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
