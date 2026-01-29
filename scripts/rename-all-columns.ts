import { prisma } from '../src/lib/prisma';

/**
 * Rename ALL camelCase columns to snake_case across all tables
 */
async function main() {
  console.log('🔧 Renaming ALL camelCase columns to snake_case...\n');

  try {
    await prisma.$executeRaw`
      BEGIN;
      
      -- user_daily_stats
      ALTER TABLE user_daily_stats RENAME COLUMN "totalPnl" TO total_pnl;
      ALTER TABLE user_daily_stats RENAME COLUMN "totalRoiPercent" TO total_roi_percent;
      ALTER TABLE user_daily_stats RENAME COLUMN "totalVolume" TO total_volume;
      ALTER TABLE user_daily_stats RENAME COLUMN "totalTrades" TO total_trades;
      ALTER TABLE user_daily_stats RENAME COLUMN "winCount" TO win_count;
      ALTER TABLE user_daily_stats RENAME COLUMN "winRate" TO win_rate;
      
      -- user_stats
      ALTER TABLE user_stats RENAME COLUMN "totalPnl" TO total_pnl;
      ALTER TABLE user_stats RENAME COLUMN "totalRoiPercent" TO total_roi_percent;
      ALTER TABLE user_stats RENAME COLUMN "totalVolume" TO total_volume;
      ALTER TABLE user_stats RENAME COLUMN "totalTrades" TO total_trades;
      ALTER TABLE user_stats RENAME COLUMN "winCount" TO win_count;
      ALTER TABLE user_stats RENAME COLUMN "winRate" TO win_rate;
      
      COMMIT;
    `;

    console.log('✅ All columns renamed successfully!\n');

    // Verify
    const dailyStats = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_daily_stats' AND column_name LIKE '%\_%'
      ORDER BY column_name
    `;

    console.log('Verified user_daily_stats columns:');
    dailyStats.forEach(r => console.log(`  ✓ ${r.column_name}`));
    console.log('');

    const stats = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_stats' AND column_name LIKE '%\_%'
      ORDER BY column_name
    `;

    console.log('Verified user_stats columns:');
    stats.forEach(r => console.log(`  ✓ ${r.column_name}`));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
