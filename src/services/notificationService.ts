/**
 * Notification Service - Handles Neynar push notifications
 */
import prisma from '../lib/prisma';
import { env } from '../config/env';
import { configService } from './configService';
import { fetchWithLogging } from '../lib/httpClient';

// Default Neynar API URL
const DEFAULT_NEYNAR_API_URL = 'https://api.neynar.com/v2';

/**
 * Get notification template from database
 */
async function getTemplate(code: string) {
  const template = await prisma.notificationTemplate.findUnique({
    where: { code, isActive: true },
  });
  
  if (!template) {
    console.warn(`[NotificationService] Template not found: ${code}`);
    return null;
  }
  
  return template;
}

/**
 * Send batch notification to multiple Farcaster users
 * Single API call for multiple FIDs
 */
export async function sendBatchNotification(
  templateCode: string,
  fids: number[]
): Promise<boolean> {
  if (fids.length === 0) {
    console.log('[NotificationService] No FIDs to notify, skipping');
    return false;
  }

  // Check API key
  if (!env.NEYNAR_API_KEY) {
    console.warn('[NotificationService] NEYNAR_API_KEY not set, skipping notification');
    return false;
  }

  // Get template from database
  const template = await getTemplate(templateCode);
  if (!template) {
    return false;
  }

  // Get Neynar API URL from config (database) with fallback
  const neynarApiUrl = await configService.get('NEYNAR_API_URL', DEFAULT_NEYNAR_API_URL);
  const url = `${neynarApiUrl}/farcaster/frame/notifications/`;

  try {
    const response = await fetchWithLogging(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        notification: {
          title: template.title,
          body: template.body,
          target_url: template.targetUrl,
          uuid: crypto.randomUUID(),
        },
        target_fids: fids,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NotificationService] Neynar API error: ${response.status} - ${errorText}`);
      return false;
    }

    console.log(`[NotificationService] Sent "${templateCode}" notification to ${fids.length} FIDs: [${fids.join(', ')}]`);
    return true;
  } catch (error) {
    console.error('[NotificationService] Failed to send notification:', error);
    return false;
  }
}

export const notificationService = {
  sendBatchNotification,
  getTemplate,
};
