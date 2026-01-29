import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';
import { LEADERBOARD_PERIODS, LeaderboardPeriod, getBucketStartDate } from '../lib/leaderboard';

const ZERO_DECIMAL = new Prisma.Decimal(0);

export const statsService = {
  /**
   * Recalculate bucketed daily stats for a user (idempotent, self-correcting).
   */
  recalculateUserDailyStats: async (userId: string) => {
    // Aggregate trades grouped by UTC date
    const dailyRows = await prisma.$queryRaw<Array<{
      dateUtc: Date;
      totalPnl: Prisma.Decimal;
      totalVolume: Prisma.Decimal;
      totalTrades: number;
      winCount: number;
      totalRoiPercent: Prisma.Decimal;
    }>>(Prisma.sql`
      SELECT
        DATE_TRUNC('day', t.close_timestamp AT TIME ZONE 'UTC')::date AS "dateUtc",
        SUM(COALESCE(t.pnl, 0)) AS "totalPnl",
        SUM(COALESCE(t.normalized_volume, 0)) AS "totalVolume",
        COUNT(t.id)::int AS "totalTrades",
        SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END)::int AS "winCount",
        AVG(COALESCE(t.roi_percent, 0)) AS "totalRoiPercent"
      FROM "trade_activities" t
      WHERE t.user_id = ${userId}
        AND t.status = 'SETTLED'
        AND t.close_timestamp IS NOT NULL
      GROUP BY 1
    `);

    const existing = await prisma.userDailyStats.findMany({
      where: { userId },
      select: { dateUtc: true },
    });

    const incomingDates = new Set(
      dailyRows.map((row) => normalizeDateUtc(row.dateUtc).toISOString())
    );

    // Delete stale buckets when no trades exist for that date
    const staleDates = existing
      .map((d) => normalizeDateUtc(d.dateUtc).toISOString())
      .filter((d) => !incomingDates.has(d));

    if (staleDates.length > 0) {
      await prisma.userDailyStats.deleteMany({
        where: {
          userId,
          dateUtc: { in: staleDates.map((iso) => new Date(iso)) },
        },
      });
    }

    // Upsert current buckets
    for (const row of dailyRows) {
      const dateUtc = normalizeDateUtc(row.dateUtc);
      const totalTrades = row.totalTrades || 0;
      const winCount = row.winCount || 0;
      const winRate =
        totalTrades > 0
          ? new Prisma.Decimal(winCount).div(totalTrades).mul(100)
          : ZERO_DECIMAL;

      await prisma.userDailyStats.upsert({
        where: {
          userId_dateUtc: {
            userId,
            dateUtc,
          },
        },
        create: {
          userId,
          dateUtc,
          totalPnl: row.totalPnl || ZERO_DECIMAL,
          totalVolume: row.totalVolume || ZERO_DECIMAL,
          totalTrades,
          winCount,
          winRate,
          totalRoiPercent: row.totalRoiPercent || ZERO_DECIMAL,
        },
        update: {
          totalPnl: row.totalPnl || ZERO_DECIMAL,
          totalVolume: row.totalVolume || ZERO_DECIMAL,
          totalTrades,
          winCount,
          winRate,
          totalRoiPercent: row.totalRoiPercent || ZERO_DECIMAL,
        },
      });
    }
  },

  /**
   * Roll up daily buckets into period leaderboard stats (24h/7d/30d/all).
   */
  recalculateUserStats: async (userId: string) => {
    for (const period of LEADERBOARD_PERIODS) {
      await rollupPeriodFromDaily(userId, period);
    }
  },
};

async function rollupPeriodFromDaily(userId: string, period: LeaderboardPeriod) {
  const startDate = getBucketStartDate(period);
  const where = {
    userId,
    ...(startDate ? { dateUtc: { gte: startDate } } : {}),
  };

  const aggregates = await prisma.userDailyStats.aggregate({
    where,
    _sum: {
      totalPnl: true,
      totalVolume: true,
      totalTrades: true,
      winCount: true,
    },
    _avg: {
      totalRoiPercent: true,
    },
  });

  const totalTrades = aggregates._sum?.totalTrades || 0;
  const winCount = aggregates._sum?.winCount || 0;

  if (totalTrades === 0) {
    await prisma.userStats.deleteMany({ where: { userId, period } });
    return;
  }

  const totalPnl = aggregates._sum?.totalPnl || ZERO_DECIMAL;
  const totalVolume = aggregates._sum?.totalVolume || ZERO_DECIMAL;
  const totalRoiPercent = aggregates._avg?.totalRoiPercent || ZERO_DECIMAL;
  const winRate = new Prisma.Decimal(winCount).div(totalTrades).mul(100);

  const payload = {
    userId,
    period,
    totalPnl,
    totalVolume,
    totalTrades,
    winCount,
    winRate,
    totalRoiPercent,
  };

  await prisma.userStats.upsert({
    where: { userId_period: { userId, period } },
    create: payload,
    update: payload,
  });

  console.log(
    `[StatsService] Recalculated stats for user ${userId} (${period}): PnL=${totalPnl}, Trades=${totalTrades}`
  );
}

function normalizeDateUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
