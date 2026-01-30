import prisma from '../lib/prisma';
import type { Prisma } from '../generated/prisma/client';
import { LeaderboardMetric, LeaderboardPeriod } from '../lib/leaderboard';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  stats: {
    totalPnl: number;
    roi: number;
    totalVolume: number;
    totalTrades: number;
    winRate: number;
  };
  streak: number;
}

export const leaderboardService = {
  /**
   * Get Leaderboard with filtering and pagination
   */
  getLeaderboard: async (
    period: LeaderboardPeriod,
    sortBy: LeaderboardMetric = 'pnl',
    limit: number = 10,
    page: number = 1
  ): Promise<{ data: LeaderboardEntry[]; meta: { total: number; page: number; limit: number } }> => {
    const offset = (page - 1) * limit;

    const orderBy = getOrderBy(sortBy);

    const [stats, total] = await Promise.all([
      prisma.userStats.findMany({
        where: { period },
        include: { user: true },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.userStats.count({ where: { period } }),
    ]);

    const data: LeaderboardEntry[] = stats.map((stat, index) => ({
      rank: offset + index + 1,
      userId: stat.userId,
      username: stat.user.username,
      displayName: stat.user.displayName,
      pfpUrl: stat.user.pfpUrl,
      streak: stat.user.currentWinStreak,
      stats: {
        totalPnl: Number(stat.totalPnl),
        roi: Number(stat.totalRoiPercent),
        totalVolume: Number(stat.totalVolume),
        totalTrades: stat.totalTrades,
        winRate: Number(stat.winRate),
      },
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }
};

function getOrderBy(sortBy: LeaderboardMetric): Prisma.UserStatsOrderByWithRelationInput {
  if (sortBy === 'roi') return { totalRoiPercent: 'desc' };
  if (sortBy === 'volume') return { totalVolume: 'desc' };
  if (sortBy === 'win_rate') return { winRate: 'desc' };
  return { totalPnl: 'desc' };
}
