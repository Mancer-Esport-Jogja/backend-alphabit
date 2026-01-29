import { prisma } from '../src/lib/prisma';

/**
 * Manual Migration: Rename camelCase columns to snake_case
 */
async function main() {
  console.log('🔧 Renaming columns to snake_case...\n');

  try {
    await prisma.$executeRaw`
      BEGIN;
      
      ALTER TABLE trade_activities 
        RENAME COLUMN "normalizedVolume" TO normalized_volume;
      
      ALTER TABLE trade_activities 
        RENAME COLUMN "roiPercent" TO roi_percent;
      
      COMMIT;
    `;

    console.log('✅ Columns renamed successfully!\n');

    // Verify
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trade_activities'
        AND column_name IN ('normalized_volume', 'roi_percent', 'pnl')
      ORDER BY column_name
    `;

    console.log('Verified columns:');
    result.forEach(r => console.log(`  ✓ ${r.column_name}`));

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
