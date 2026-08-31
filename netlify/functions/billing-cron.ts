import { schedule } from '@netlify/functions';
import { processDueSubscriptions } from '../../server';

/**
 * Netlify Scheduled Function for Recurring Subscription Billing
 * Runs automatically every hour ('0 * * * *')
 * 
 * Features & Safety:
 * - Direct execution of shared billing worker (processDueSubscriptions)
 * - Atomic DB locks (billing_lock_until) prevent concurrent double-charging
 * - No sensitive tokens/secrets are logged
 */
export const handler = schedule('0 * * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`[Netlify Billing Cron] Starting hourly subscription check at ${timestamp}`);

  try {
    const result = await processDueSubscriptions();
    console.log(
      `[Netlify Billing Cron] Hourly cycle completed successfully. Processed: ${result.processed}, Succeeded: ${result.succeeded}, Failed: ${result.failed}, Skipped: ${result.skipped}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        timestamp,
        summary: result,
      }),
    };
  } catch (err: any) {
    console.error(`[Netlify Billing Cron] Execution encountered an error:`, err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'An error occurred during billing cycle execution',
      }),
    };
  }
});
