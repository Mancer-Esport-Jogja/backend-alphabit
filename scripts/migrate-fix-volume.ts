import { prisma } from '../src/lib/prisma';
import { Prisma } from '../src/generated/prisma/client';

/**
 * Migration: Fix Volume Calculation (SQL-based)
 * Uses raw SQL for direct database updates - faster than ORM
 */
async function main() {
  console.log('🔧 Starting volume recalculation (SQL method)...\n');

  try {
    // Step 1: Update trade_activities.normalized_volume
    console.log('📊 Step 1: Updating trade_activities.normalized_volume...');
    
    const updateResult = await prisma.$executeRaw`
      UPDATE trade_activities
      SET normalized_volume = (entry_premium::numeric / POWER(10, collateral_decimals))
    `;
    
    console.log(`✅ Updated ${updateResult} trades\n`);

    // Verify Step 1
    console.log('🔍 Verifying trade_activities...');
    const sampleTrades = await prisma.$queryRaw<Array<{
      id: string;
      entry_premium: string;
      collateral_decimals: number;
      normalized_volume: Prisma.Decimal;
      correct_volume: number;
    }>>`
      SELECT 
        id,
        entry_premium,
        collateral_decimals,
        normalized_volume,
        (entry_premium::numeric / POWER(10, collateral_decimals)) as correct_volume
      FROM trade_activities
      LIMIT 5
    `;

    console.log('Sample trades:');
    sampleTrades.forEach(t => {
      const correct = Number(t.correct_volume);
      const current = Number(t.normalized_volume);
      const isCorrect = Math.abs(correct - current) < 0.001;
      console.log(`  ${t.id}: ${current.toFixed(2)} ${isCorrect ? '✅' : '❌'}`);
    });
    console.log('');

    // Step 2: Recalculate user_daily_stats
    console.log('📊 Step 2: Recalculating user_daily_stats...');
    
    await prisma.$executeRaw`TRUNCATE TABLE user_daily_stats RESTART IDENTITY CASCADE`;
    
    const dailyInserted = await prisma.$executeRaw`
      INSERT INTO user_daily_stats (
        id,
        user_id,
        date_utc,
        total_pnl,
        total_volume,
        total_trades,
        win_count,
        win_rate,
        total_roi_percent,
        updated_at
      )
      SELECT
        gen_random_uuid() AS id,
        user_id,
        DATE_TRUNC('day', close_timestamp AT TIME ZONE 'UTC')::date AS date_utc,
        SUM(COALESCE(pnl, 0)) AS total_pnl,
        SUM(COALESCE(normalized_volume, 0)) AS total_volume,
        COUNT(id) AS total_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS win_count,
        CASE 
          WHEN COUNT(id) > 0 THEN (SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END)::numeric / COUNT(id)::numeric * 100)
          ELSE 0
        END AS win_rate,
        AVG(COALESCE(roi_percent, 0)) AS total_roi_percent,
        NOW() AS updated_at
      FROM trade_activities
      WHERE status = 'SETTLED' AND close_timestamp IS NOT NULL
      GROUP BY user_id, DATE_TRUNC('day', close_timestamp AT TIME ZONE 'UTC')::date
    `;
    
    console.log(`✅ Inserted ${dailyInserted} daily stat records\n`);

    // Step 3: Recalculate user_stats for all periods
    console.log('📊 Step 3: Recalculating user_stats...');
    
    await prisma.$executeRaw`TRUNCATE TABLE user_stats RESTART IDENTITY CASCADE`;
    
    // 24h stats
    await prisma.$executeRaw`
      INSERT INTO user_stats (
        id, user_id, period, total_pnl, total_volume, total_trades, win_count, win_rate, total_roi_percent, updated_at
      )
      SELECT
        gen_random_uuid() AS id,
        user_id, '24h', SUM(total_pnl), SUM(total_volume), SUM(total_trades), SUM(win_count),
        CASE WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric /  SUM(total_trades)::numeric * 100) ELSE 0 END,
        AVG(total_roi_percent), NOW()
      FROM user_daily_stats
      WHERE date_utc >= CURRENT_DATE - INTERVAL '1 day'
      GROUP BY user_id
    `;

    // 7d stats
    await prisma.$executeRaw`
      INSERT INTO user_stats (
        id, user_id, period, total_pnl, total_volume, total_trades, win_count, win_rate, total_roi_percent, updated_at
      )
      SELECT
        gen_random_uuid() AS id,
        user_id, '7d', SUM(total_pnl), SUM(total_volume), SUM(total_trades), SUM(win_count),
        CASE WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100) ELSE 0 END,
        AVG(total_roi_percent), NOW()
      FROM user_daily_stats
      WHERE date_utc >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY user_id
    `;

    // 30d stats
    await prisma.$executeRaw`
      INSERT INTO user_stats (
        id, user_id, period, total_pnl, total_volume, total_trades, win_count, win_rate, total_roi_percent, updated_at
      )
      SELECT
        gen_random_uuid() AS id,
        user_id, '30d', SUM(total_pnl), SUM(total_volume), SUM(total_trades), SUM(win_count),
        CASE WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100) ELSE 0 END,
        AVG(total_roi_percent), NOW()
      FROM user_daily_stats
      WHERE date_utc >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY user_id
    `;

    // All-time stats
    await prisma.$executeRaw`
      INSERT INTO user_stats (
        id, user_id, period, total_pnl, total_volume, total_trades, win_count, win_rate, total_roi_percent, updated_at
      )
      SELECT
        gen_random_uuid() AS id,
        user_id, 'all', SUM(total_pnl), SUM(total_volume), SUM(total_trades), SUM(win_count),
        CASE WHEN SUM(total_trades) > 0 THEN (SUM(win_count)::numeric / SUM(total_trades)::numeric * 100) ELSE 0 END,
        AVG(total_roi_percent), NOW()
      FROM user_daily_stats
      GROUP BY user_id
    `;

    console.log(`✅ Recalculated user_stats for all periods\n`);

    // Final Summary
    console.log('📈 Final Summary:');
    const summary = await prisma.$queryRaw<Array<{
      table_name: string;
      total_rows: bigint;
      total_volume: Prisma.Decimal;
    }>>`
      SELECT 
        'trade_activities'::text as table_name,
        COUNT(*)::bigint as total_rows,
        SUM(normalized_volume) as total_volume
      FROM trade_activities
      UNION ALL
      SELECT 
        'user_daily_stats'::text,
        COUNT(*)::bigint,
        SUM(total_volume)
      FROM user_daily_stats
      UNION ALL
      SELECT 
        'user_stats'::text,
        COUNT(*)::bigint,
        SUM(total_volume)
      FROM user_stats
    `;

    console.table(summary.map(s => ({
      Table: s.table_name,
      Rows: Number(s.total_rows),
      'Total Volume': Number(s.total_volume).toFixed(2)
    })));

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
