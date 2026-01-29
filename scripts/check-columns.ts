import { prisma } from '../src/lib/prisma';

async function main() {
  const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'trade_activities'
    ORDER BY ordinal_position
  `;
  
  console.log('trade_activities columns:');
  result.forEach((r, i) => console.log(`  ${i + 1}. ${r.column_name}`));
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
