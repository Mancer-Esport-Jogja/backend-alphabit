import * as cron from 'node-cron';
import { env } from '../config/env';
import { configService } from './configService';
import { syncAllActiveUsers, triggerIndexerUpdate } from './tradeService';

// Store cron task references for graceful shutdown
let scheduledSyncTask: cron.ScheduledTask | null = null;

/**
 * Initialize all scheduler jobs
 */
export async function initScheduler(): Promise<void> {
  const enabled = await configService.get('SYNC_SCHEDULER_ENABLED') === 'true';
  const interval = parseInt(await configService.get('SYNC_INTERVAL_MINUTES'), 10) || 15;

  if (!enabled) {
    console.log('[Scheduler] Scheduler is disabled via config');
    return;
  }

  console.log('[Scheduler] Starting scheduler service...');

  // Scheduled Sync - runs every N minutes
  const cronExpression = `*/${interval} * * * *`;
  
  scheduledSyncTask = cron.schedule(cronExpression, async () => {
    // Check enabled status dynamically every run
    const dynamicEnabled = await configService.get('SYNC_SCHEDULER_ENABLED') === 'true';
    if (!dynamicEnabled) {
      console.log('[Scheduler] Sync skipped (disabled in config)');
      return;
    }

    console.log('[Scheduler] Starting scheduled sync cycle...');
    await runScheduledSync();
  });

  console.log(`[Scheduler] Scheduled sync configured: every ${interval} minutes`);
  console.log('[Scheduler] Scheduler service started successfully');
}

/**
 * Stop all scheduler jobs gracefully
 */
export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduler service...');
  
  if (scheduledSyncTask) {
    scheduledSyncTask.stop();
    scheduledSyncTask = null;
  }
  
  console.log('[Scheduler] Scheduler service stopped');
}

/**
 * Run a scheduled sync cycle
 * 1. Trigger /update once
 * 2. Wait for indexer to process
 * 3. Sync all active users
 */
export async function runScheduledSync(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Step 1: Trigger indexer update
    console.log('[Scheduler] Triggering indexer update...');
    await triggerIndexerUpdate();
    
    // Step 2: Wait for indexer to process
    const delayMs = parseInt(await configService.get('SYNC_DELAY_AFTER_UPDATE'), 10) || 10000;
    console.log(`[Scheduler] Waiting ${delayMs}ms for indexer to process...`);
    await sleep(delayMs);
    
    // Step 3: Sync all active users
    console.log('[Scheduler] Syncing all active users...');
    const result = await syncAllActiveUsers();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Scheduler] Sync cycle completed in ${duration}s:`, {
      usersProcessed: result.usersProcessed,
      totalSynced: result.totalSynced,
      totalCreated: result.totalCreated,
      totalUpdated: result.totalUpdated,
      errors: result.errors,
    });
  } catch (error) {
    console.error('[Scheduler] Sync cycle failed:', error);
  }
}

/**
 * Manually trigger a sync cycle (for testing/admin)
 */
export async function triggerManualSync(): Promise<{
  usersProcessed: number;
  totalSynced: number;
  totalCreated: number;
  totalUpdated: number;
  errors: number;
}> {
  console.log('[Scheduler] Manual sync triggered');
  await triggerIndexerUpdate();
  await sleep(env.SYNC_DELAY_AFTER_UPDATE);
  return syncAllActiveUsers();
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
