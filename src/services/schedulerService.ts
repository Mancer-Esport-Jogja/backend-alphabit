import { env } from '../config/env';
import { configService } from './configService';
import { syncAllActiveUsers, triggerIndexerUpdate } from './tradeService';

// Store timeout reference for graceful shutdown
let schedulerTimeout: NodeJS.Timeout | null = null;
let isSchedulerRunning = false;

/**
 * Initialize scheduler loop
 */
export async function initScheduler(): Promise<void> {
  const enabled = env.SYNC_SCHEDULER_ENABLED;
  const interval = parseInt(await configService.get('SYNC_INTERVAL_MS'), 10) || 900000; // 15 min default

  if (!enabled) {
    console.log('[Scheduler] Scheduler starts disabled (check config to enable)');
    return;
  } 

  console.log(`[Scheduler] Starting scheduler service (Interval: ${interval}ms)...`);

  // Start the loop immediately
  if (!isSchedulerRunning) {
    isSchedulerRunning = true;
    scheduleNextLoop(0);
  }
}

/**
 * Stop scheduler gracefully
 */
export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduler service...');
  isSchedulerRunning = false;
  if (schedulerTimeout) {
    clearTimeout(schedulerTimeout);
    schedulerTimeout = null;
  }
  console.log('[Scheduler] Scheduler service stopped');
}

/**
 * Internal recursive loop function
 */
async function scheduleNextLoop(delay: number) {
  if (schedulerTimeout) clearTimeout(schedulerTimeout);
  
  schedulerTimeout = setTimeout(async () => {
    if (!isSchedulerRunning) return;

    try {
      // 1. Check dynamic config
      const dynamicInterval = parseInt(await configService.get('SYNC_INTERVAL_MS'), 10) || 900000;

      console.log('[Scheduler] Starting sync cycle...');
      await runScheduledSync();

      // 2. Schedule next run
      if (isSchedulerRunning) {
        scheduleNextLoop(dynamicInterval);
      }
    } catch (error) {
      console.error('[Scheduler] Error in scheduler loop:', error);
      // Retry after default interval on error
      if (isSchedulerRunning) {
        scheduleNextLoop(900000); 
      }
    }
  }, delay);
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
  const delayMs = parseInt(await configService.get('SYNC_DELAY_AFTER_UPDATE'), 10) || 10000;
  await sleep(delayMs);
  return syncAllActiveUsers();
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
