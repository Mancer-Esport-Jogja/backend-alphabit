import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export const analyticsService = {
  /**
   * Get high-level summary stats for a user
   */
  getUserSummary: async (userId: string) => {
    // 1. Fetch user for streak info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        currentWinStreak: true, 
        maxWinStreak: true 
      }
    });

    if (!user) throw new Error('User not found');

    // 2. Fetch all trades for calculation
    // We fetch minimal fields needed for calculation to reduce load
    const trades = await prisma.tradeActivity.findMany({
      where: { userId },
      select: {
        status: true,
        collateralAmount: true,
        collateralDecimals: true,
        entryPremium: true,
        payoutBuyer: true,
        collateralReturnedSeller: true // fallback if needed? No, payoutBuyer is strictly for buyer
      }
    });

    let netPnL = 0;
    let totalVolume = 0;
    let settledTradesCount = 0;
    let winTradesCount = 0;

    for (const trade of trades) {
      const decimals = trade.collateralDecimals || 6;
      const divisor = Math.pow(10, decimals);
      const isSettled = trade.status === 'SETTLED';

      // Volume (Active + Settled)
      const volume = Number(trade.collateralAmount) / divisor;
      totalVolume += volume;

      if (isSettled) {
        settledTradesCount++;

        // PnL Calculation
        const premium = Number(trade.entryPremium) / divisor;
        const payout = Number(trade.payoutBuyer || '0') / divisor;
        
        netPnL += (payout - premium);

        // Win Rate Logic (Win = Payout > 0)
        // Some definitions might say Win = Payout > Premium, but usually "ITM" is Win.
        // The prompt analysis implied Payout > 0.
        if (payout > 0) {
          winTradesCount++;
        }
      }
    }

    const winRate = settledTradesCount > 0 
      ? (winTradesCount / settledTradesCount) * 100 
      : 0;

    // 3. Simple Mock Rank/Percentile (Since we don't have global aggregates yet)
    // In a real app, we'd run a count query where volume > userVolume
    // For now, we return placeholders or compute if cheap
    const rank = await analyticsService.calculateUserRank(userId, totalVolume);

    return {
      netPnL: netPnL.toFixed(2),
      totalVolume: totalVolume.toFixed(2),
      winRate: parseFloat(winRate.toFixed(2)),
      totalTrades: trades.length,
      currentWinStreak: user.currentWinStreak,
      bestWinStreak: user.maxWinStreak,
      rank: rank.rank,
      topPercentile: rank.percentile
    };
  },

  /**
   * Calculate Rank based on Total Volume
   */
  calculateUserRank: async (userId: string, userVolume: number) => {
      // This is heavy if we do it for everyone. 
      // Simplified: Count users with tradeActivity
      // For a proper implementation, we'd implement a nightly cron to cache ranks.
      // Here, we just return a sensible default to avoid scanning whole DB on every request.
      return { rank: 0, percentile: 0 }; 
  },

  /**
   * Get PnL History for Time Series Chart
   */
  getPnLHistory: async (userId: string, period: '7d' | '30d' | 'all' = '30d') => {
    let dateFilter = new Date();
    if (period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    if (period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    if (period === 'all') dateFilter = new Date(0); // Epoch

    const trades = await prisma.tradeActivity.findMany({
      where: { 
        userId,
        status: 'SETTLED',
        closeTimestamp: {
          gte: dateFilter
        }
      },
      orderBy: { closeTimestamp: 'asc' },
      select: {
        closeTimestamp: true,
        entryPremium: true,
        payoutBuyer: true,
        collateralDecimals: true
      }
    });

    const history: any[] = [];
    let cumulativePnL = 0;

    // We can aggregate by day in JS
    const dailyMap = new Map<string, number>();

    for (const trade of trades) {
      if (!trade.closeTimestamp) continue;
      
      const dateKey = trade.closeTimestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const decimals = trade.collateralDecimals || 6;
      const divisor = Math.pow(10, decimals);
      
      const premium = Number(trade.entryPremium) / divisor;
      const payout = Number(trade.payoutBuyer || '0') / divisor;
      const tradePnL = payout - premium;

      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + tradePnL);
    }

    // Convert to array and calculate cumulative
    for (const [date, pnl] of dailyMap.entries()) {
      cumulativePnL += pnl;
      history.push({
        date,
        pnl: parseFloat(pnl.toFixed(2)),
        cumulativePnL: parseFloat(cumulativePnL.toFixed(2))
      });
    }

    return history;
  },

  /**
   * Get Distribution Data (Pie/Donut Charts)
   */
  getDistribution: async (userId: string, period?: '7d' | '30d' | 'all') => {
    let entryDateFilter: Date | undefined;
    let closeDateFilter: Date | undefined;

    if (period && period !== 'all') {
      const now = new Date();
      entryDateFilter = new Date(now);
      closeDateFilter = new Date(now);

      const days = period === '7d' ? 7 : 30;
      entryDateFilter.setDate(now.getDate() - days);
      closeDateFilter.setDate(now.getDate() - days);
    }

    // 1. Fetch trades for Assets & Strategies (based on Entry Time)
    const entryTrades = await prisma.tradeActivity.findMany({
      where: { 
        userId,
        ...(entryDateFilter && { entryTimestamp: { gte: entryDateFilter } })
      },
      select: {
        underlyingAsset: true,
        optionType: true,
        collateralAmount: true,
        collateralDecimals: true
      }
    });

    // 2. Fetch trades for Results (Win/Loss) - based on Settlement Time
    const resultTrades = await prisma.tradeActivity.findMany({
      where: { 
        userId,
        status: { in: ['SETTLED', 'EXPIRED'] }, // Results only make sense for closed trades
        ...(closeDateFilter && { closeTimestamp: { gte: closeDateFilter } })
      },
      select: {
        status: true,
        payoutBuyer: true
      }
    });

    const assetMap = new Map<string, { count: number, volume: number }>();
    const strategyMap = new Map<string, number>();
    const resultMap = { 'Win': 0, 'Loss': 0, 'Expired': 0 };

    // Process Assets & Strategies (Entry filtered)
    for (const trade of entryTrades) {
      // Assets
      const decimals = trade.collateralDecimals || 6;
      const divisor = Math.pow(10, decimals);
      const volume = Number(trade.collateralAmount) / divisor;
      
      const assetStat = assetMap.get(trade.underlyingAsset) || { count: 0, volume: 0 };
      assetStat.count++;
      assetStat.volume += volume;
      assetMap.set(trade.underlyingAsset, assetStat);

      // Strategies
      if (trade.optionType) {
        strategyMap.set(trade.optionType, (strategyMap.get(trade.optionType) || 0) + 1);
      }
    }

    // Process Results (Close filtered)
    for (const trade of resultTrades) {
      if (trade.status === 'EXPIRED') {
        resultMap['Expired']++;
      } else if (trade.status === 'SETTLED') {
         const payout = Number(trade.payoutBuyer || '0');
         if (payout > 0) resultMap['Win']++;
         else resultMap['Loss']++;
      }
    }

    return {
      assets: Array.from(assetMap.entries()).map(([k, v]) => ({ 
        label: k, 
        count: v.count, 
        volume: v.volume.toFixed(2) 
      })),
      results: Object.entries(resultMap).map(([k, v]) => ({ label: k, count: v })),
      strategies: Array.from(strategyMap.entries()).map(([k, v]) => ({ label: k, count: v }))
    };
  }
};
