import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Handler for POST /api/flutterwave/webhook
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, verif-hash, x-flutterwave-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. This endpoint only accepts POST requests.',
    });
  }

  try {
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = (req.headers['verif-hash'] || req.headers['verif_hash'] || req.headers['x-flutterwave-signature']) as string | undefined;

    // 1. Signature Verification
    if (secretHash) {
      if (!signature || signature !== secretHash) {
        console.warn('🚨 [Flutterwave Webhook Serverless] 401 Unauthorized: Invalid signature');
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or missing Flutterwave webhook signature',
        });
      }
    } else {
      console.warn('⚠️ [Flutterwave Webhook Serverless] FLW_SECRET_HASH is not set in environment.');
    }

    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    const txData = payload?.data || payload;

    // 2. Safe Logging (masking sensitive data)
    const safeLogSummary = {
      event: payload?.event || payload?.['event.type'] || 'unknown',
      id: txData?.id,
      tx_ref: txData?.tx_ref,
      flw_ref: txData?.flw_ref,
      status: txData?.status,
      amount: txData?.amount,
      currency: txData?.currency,
      customer_email: txData?.customer?.email
        ? `${txData.customer.email.slice(0, 3)}***@${txData.customer.email.split('@')[1] || '***'}`
        : undefined,
      received_at: new Date().toISOString(),
    };
    console.log('🔔 [Flutterwave Webhook Serverless]:', JSON.stringify(safeLogSummary));

    // 3. Detect Successful Payment
    const isSuccessful =
      (payload?.event === 'charge.completed' || payload?.status === 'successful') &&
      (txData?.status === 'successful' || payload?.status === 'successful');

    if (!isSuccessful) {
      console.log(`ℹ️ [Flutterwave Webhook Serverless] Ignored non-payment event: ${payload?.event || txData?.status}`);
      return res.status(200).json({ status: 'ignored', message: 'Event does not require subscription activation' });
    }

    const txRef = txData?.tx_ref;
    const flwTransactionId = String(txData?.id || txData?.flw_ref || '');
    const amount = Number(txData?.amount || 0);
    const currency = (txData?.currency || 'USD').toUpperCase();
    const customerEmail = txData?.customer?.email?.toLowerCase().trim();

    // Extract card token and details
    const cardToken = txData?.card?.token || txData?.authorization?.token || txData?.payment_options?.token;
    const cardLast4 = txData?.card?.last_4digits || txData?.card?.last4 || null;
    const cardBrand = txData?.card?.issuer || txData?.card?.type || null;
    const cardExp = txData?.card?.expiry || null;

    // 4. Resolve Plan & User ID
    let rawPlan = (txData?.meta?.plan || '').toLowerCase();
    if (!rawPlan) {
      rawPlan = amount >= 15 ? 'enterprise' : 'pro';
    }
    const targetPlan: 'pro' | 'enterprise' = rawPlan === 'enterprise' ? 'enterprise' : 'pro';
    let targetUserId = txData?.meta?.user_id || txData?.meta?.userId;
    const isTrial = txData?.meta?.mode === 'trial' || txData?.meta?.is_trial === true || (txRef && txRef.includes('-TRL'));

    // Supabase Initialization
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
      !supabaseUrl.includes('your-supabase-project')
    );

    if (isSupabaseConfigured && supabaseUrl && supabaseKey) {
      const serverSupabase = createClient(supabaseUrl, supabaseKey);

      // Lookup user by email if user_id wasn't in metadata
      if (!targetUserId && customerEmail) {
        try {
          const { data: profile } = await serverSupabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .maybeSingle();

          if (profile?.id) {
            targetUserId = profile.id;
          } else {
            const { data: sub } = await serverSupabase
              .from('subscriptions')
              .select('user_id')
              .eq('user_id', customerEmail)
              .maybeSingle();
            if (sub?.user_id) {
              targetUserId = sub.user_id;
            }
          }
        } catch (lookupErr) {
          console.warn('⚠️ [Flutterwave Webhook Serverless] Error resolving user by email:', lookupErr);
        }
      }

      // 5. Idempotency Check: Prevent duplicate processing
      if (txRef || flwTransactionId) {
        try {
          const conditions: string[] = [];
          if (txRef) conditions.push(`flutterwave_ref.eq.${txRef}`);
          if (flwTransactionId) conditions.push(`flutterwave_transaction_id.eq.${flwTransactionId}`);

          const { data: existingPayments } = await serverSupabase
            .from('payments')
            .select('id, status, flutterwave_ref, flutterwave_transaction_id')
            .or(conditions.join(','))
            .limit(1);

          if (existingPayments && existingPayments.length > 0 && existingPayments[0].status === 'success') {
            console.log(`ℹ️ [Flutterwave Webhook Serverless] Idempotency: Transaction ${txRef || flwTransactionId} already processed.`);
            return res.status(200).json({
              status: 'success',
              message: 'Transaction already processed (idempotent)',
            });
          }
        } catch (idempErr) {
          console.warn('⚠️ [Flutterwave Webhook Serverless] Idempotency check notice:', idempErr);
        }
      }

      // 6. Update Subscription & Record Payment
      if (targetUserId) {
        try {
          if (isTrial) {
            const trialStart = new Date().toISOString();
            const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            await serverSupabase.from('subscriptions').upsert({
              user_id: targetUserId,
              plan: targetPlan,
              status: 'trialing',
              trial_started_at: trialStart,
              trial_ends_at: trialEnd,
              trial_used: true,
              card_token: cardToken,
              card_last4: cardLast4,
              card_brand: cardBrand,
              card_exp: cardExp,
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTransactionId,
              payment_provider: 'flutterwave',
              current_period_start: trialStart,
              current_period_end: trialEnd,
              next_billing_date: trialEnd,
              cancelled_at: null,
              updated_at: new Date().toISOString(),
            });

            await serverSupabase.from('payments').insert([{
              user_id: targetUserId,
              amount: amount,
              currency: currency,
              status: 'success',
              channel: txData?.payment_type || 'card',
              notes: 'Card authorization for 7-day free trial',
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTransactionId,
              payment_provider: 'flutterwave',
              paid_at: txData?.created_at || new Date().toISOString(),
            }]);
          } else {
            const periodStart = new Date().toISOString();
            const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();

            await serverSupabase.from('subscriptions').upsert({
              user_id: targetUserId,
              plan: targetPlan,
              status: 'active',
              card_token: cardToken,
              card_last4: cardLast4,
              card_brand: cardBrand,
              card_exp: cardExp,
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTransactionId,
              payment_provider: 'flutterwave',
              current_period_start: periodStart,
              current_period_end: periodEnd,
              next_billing_date: periodEnd,
              cancelled_at: null,
              updated_at: new Date().toISOString(),
            });

            await serverSupabase.from('payments').insert([{
              user_id: targetUserId,
              amount: amount,
              currency: currency,
              status: 'success',
              channel: txData?.payment_type || 'card',
              notes: 'Monthly subscription payment',
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTransactionId,
              payment_provider: 'flutterwave',
              paid_at: txData?.created_at || new Date().toISOString(),
            }]);
          }

          // Optional: Record activity log
          try {
            await serverSupabase.from('activities').insert([{
              user_id: targetUserId,
              type: 'subscription_upgraded',
              description: isTrial
                ? `7-Day Free Trial activated for ${targetPlan.toUpperCase()} plan via Flutterwave card authorization`
                : `Active subscription to ${targetPlan.toUpperCase()} plan renewed via Flutterwave ($${amount.toFixed(2)} ${currency})`,
              metadata: {
                tx_ref: txRef,
                flw_transaction_id: flwTransactionId,
                plan: targetPlan,
                is_trial: isTrial,
                amount,
                currency,
              },
            }]);
          } catch {
            // Non-blocking for activity log
          }

          console.log(`✅ [Flutterwave Webhook Serverless] Subscription updated for ${targetUserId}`);
        } catch (dbErr: any) {
          console.error('❌ [Flutterwave Webhook Serverless] DB error:', dbErr?.message || dbErr);
        }
      }
    }

    // 7. Acknowledge receipt with HTTP 200
    return res.status(200).json({
      status: 'success',
      message: 'Flutterwave webhook received and processed successfully',
    });
  } catch (err: any) {
    console.error('❌ [Flutterwave Webhook Serverless] Handler error:', err);
    return res.status(200).json({
      status: 'error',
      message: err.message || 'Webhook processing error',
    });
  }
}
