import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting seeding...');

  const configs = [
    {
      key: 'DOMAIN',
      value: process.env.DOMAIN || '',
      description: 'Farcaster Mini-App domain for auth verification'
    },
    {
      key: 'THETANUTS_INDEXER_URL',
      value: process.env.THETANUTS_INDEXER_URL || 'https://optionbook-indexer.thetanuts.finance/api/v1',
      description: 'Thetanuts Indexer URL'
    },
    {
      key: 'ALPHABIT_REFERRER_ADDRESS',
      value: process.env.ALPHABIT_REFERRER_ADDRESS || '',
      description: 'Alphabit Referrer Address'
    }
  ];

  for (const config of configs) {
    const result = await prisma.config.upsert({
      where: { key: config.key },
      update: {
        description: config.description
      },
      create: config,
    });
    console.log(`Created/Updated config: ${result.key}`);
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
