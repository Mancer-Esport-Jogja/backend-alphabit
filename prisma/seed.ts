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
    },
    // Scheduler Configs
    {
      key: 'SYNC_SCHEDULER_ENABLED',
      value: process.env.SYNC_SCHEDULER_ENABLED || 'false',
      description: 'Enable background sync scheduler'
    },
    {
      key: 'SYNC_INTERVAL_MS',
      value: process.env.SYNC_INTERVAL_MS || '900000',
      description: 'Sync scheduler interval in milliseconds'
    },
    {
      key: 'SYNC_DELAY_AFTER_UPDATE',
      value: process.env.SYNC_DELAY_AFTER_UPDATE || '10000',
      description: 'Delay (ms) after indexer update'
    },
    // Logging Configs
    {
      key: 'LOG_INTERNAL_CONFIG',
      value: process.env.LOG_INTERNAL_CONFIG || '{"enabled":true,"body":true,"maxBodyLength":1000,"sensitiveKeys":["password","token","authorization","secret","key"],"excludePaths":["/api/health","/metrics","/favicon.ico"],"minify":false}',
      description: 'Internal API logging configuration (JSON)'
    },
    {
      key: 'LOG_EXTERNAL_CONFIG',
      value: process.env.LOG_EXTERNAL_CONFIG || '{"enabled":true,"body":true,"maxBodyLength":1000,"sensitiveKeys":["password","token","authorization","secret","key","apiKey"],"excludePaths":[],"minify":false}',
      description: 'External API logging configuration (JSON)'
    },
    // Neynar API Config
    {
      key: 'NEYNAR_API_URL',
      value: 'https://api.neynar.com/v2',
      description: 'Neynar API base URL for notifications'
    },
    // Expiry Reminder Config
    {
      key: 'EXPIRY_REMINDER_ENABLED',
      value: 'true',
      description: 'Enable daily expiry reminder notification at 7 AM UTC'
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

  // Seed notification templates
  const notificationTemplates = [
    {
      code: 'TRADE_SETTLED',
      title: 'Trade Settled ✅',
      body: 'Your trade has been settled! Check your results.',
      targetUrl: 'https://app.alphabit.xyz/trades'
    },
    {
      code: 'TRADE_EXPIRED',
      title: 'Trade Expired ⏰',
      body: 'Your trade has expired.',
      targetUrl: 'https://app.alphabit.xyz/trades'
    },
    {
      code: 'TRADE_EXPIRING_SOON',
      title: 'Trade Expiring Soon ⏳',
      body: 'Your trade will expire in 1 hour! Take action now.',
      targetUrl: 'https://app.alphabit.xyz/trades'
    }
  ];

  for (const template of notificationTemplates) {
    const result = await prisma.notificationTemplate.upsert({
      where: { code: template.code },
      update: {
        title: template.title,
        body: template.body,
        targetUrl: template.targetUrl
      },
      create: template,
    });
    console.log(`Created/Updated notification template: ${result.code}`);
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
