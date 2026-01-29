import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🔍 Checking all table columns...\n');

  const tables = ['trade_activities', 'user_daily_stats', 'user_stats'];

  for (const table of tables) {
    const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ${table}
      ORDER BY ordinal_position
    `;
    
    console.log(`📋 ${table}:`);
    result.forEach((r, i) => console.log(`  ${i + 1}. ${r.column_name}`));
    console.log('');
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
