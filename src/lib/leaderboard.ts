export type LeaderboardPeriod = '24h' | '7d' | '30d' | 'all';
export type LeaderboardMetric = 'pnl' | 'roi' | 'volume' | 'win_rate';

export const LEADERBOARD_PERIODS: LeaderboardPeriod[] = ['24h', '7d', '30d', 'all'];
export const LEADERBOARD_METRICS: LeaderboardMetric[] = ['pnl', 'roi', 'volume', 'win_rate'];

export function getPeriodStartDate(period: LeaderboardPeriod): Date | null {
  const now = Date.now();
  if (period === '24h') return new Date(now - 24 * 60 * 60 * 1000);
  if (period === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (period === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return null;
}

/**
 * Start date for bucketed daily rollups (floored to 00:00 UTC)
 */
export function getBucketStartDate(period: LeaderboardPeriod): Date | null {
  const start = getPeriodStartDate(period);
  if (!start) return null;

  const utc = new Date(start);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
}
