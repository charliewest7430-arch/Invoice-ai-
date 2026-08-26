import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Handler for /api/billing/cron
const FLW_PRO_PRICE = 9.99;
const FLW_ENTERPRISE_PRICE = 15.99;

/**
 * Cron Authentication Validator for Vercel Serverless Function
 * Strictly validates Authorization: Bearer <CRON_SECRET>
 * No query parameters or secondary headers are allowed.
 */
function validateCronAuthorization(req: any): { authorized: boolean; reason?: string } {
  const isProduction = process.env.NODE_ENV === 'production';
  const expectedSecret = process.env.CRON_SECRET;

  // In production, CRON_SECRET is strictly mandatory
  if (isProduction && (!expectedSecret || expectedSecret.length < 8)) {
    return { authorized: false, reason: 'CRON_SECRET is not configured on server in production environment' };
  }

  // In development, if CRON_SECRET is not set, permit local developer testing
  if (!isProduction && (!expectedSecret || expectedSecret.length < 5)) {
    return { authorized: true };
  }

  // Strictly check Authorization: Bearer <token> ONLY
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : '';

  if (!bearerToken || bearerToken !== expectedSecret) {
    return { authorized: false, reason: 'Invalid or missing Authorization Bearer token' };
  }

  return { authorized: true };
}

export default async function handler(req: any, res: any) {
  try {
    const authResult = validateCronAuthorization(req);
    if (!authResult.authorized) {
      return res.status(401).json({
        status: 'error',
        message: authResult.reason || 'Unauthorized cron invocation',
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
      !supabaseUrl.includes('your-supabase-project')
    );

    if (!isSupabaseConfigured || !supabaseUrl || !supabaseKey) {
      return res.json({ status: 'success', message: 'Supabase not configured, skipping cron worker' });
    }

    const serverSupabase = createClient(supabaseUrl, supabaseKey);
    const flwSecretKey = process.env.FLW_SECRET_KEY;
    const now = new Date();
    const nowIso = now.toISOString();
    const lockUntilIso = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    // 1. Find candidate subscriptions due for trial conversion, active monthly renewal, or past_due retry
    const { data: candidateSubs, error: fetchErr } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .is('cancelled_at', null)
      .not('card_token', 'is', null)
      .in('status', ['trialing', 'active', 'past_due']);

    if (fetchErr || !candidateSubs) {
      console.warn('⚠️ [Recurring Billing] Error fetching candidate subscriptions:', fetchErr?.message);
      return res.json({ status: 'success', processed: 0, succeeded: 0, failed: 0, skipped: 0 });
    }

    const dueSubs = candidateSubs.filter((sub: any) => {
      if (sub.billing_lock_until && new Date(sub.billing_lock_until) > now) {
        return false;
      }

      if (sub.status === 'trialing') {
        return sub.trial_ends_at && new Date(sub.trial_ends_at) <= now;
      }

      if (sub.status === 'active' || sub.status === 'past_due') {
        const dueDate = sub.next_billing_date || sub.current_period_end;
        return dueDate && new Date(dueDate) <= now;
      }

      return false;
    });

    for (const sub of dueSubs) {
      const isTrial = sub.status === 'trialing';
      const targetDate = isTrial ? (sub.trial_ends_at || nowIso) : (sub.next_billing_date || sub.current_period_end || nowIso);
      const dateKey = targetDate.split('T')[0];
      const cycleKey = `${sub.user_id}_${isTrial ? 'trial' : 'renew'}_${dateKey}`;

      // 2. Database-level idempotency check: Has this billing cycle already been completed?
      try {
        const { data: existingCycle } = await serverSupabase
          .from('billing_cycles')
          .select('*')
          .eq('user_id', sub.user_id)
          .eq('cycle_key', cycleKey)
          .maybeSingle();

        if (existingCycle && existingCycle.status === 'completed') {
          const nextPeriodEnd = new Date(now.getTime() + 30 * 86400000).toISOString();
          await serverSupabase.from('subscriptions').update({
            status: 'active',
            trial_used: true,
            next_billing_date: nextPeriodEnd,
            current_period_end: nextPeriodEnd,
            last_billed_period: cycleKey,
            billing_lock_until: null,
            updated_at: nowIso,
          }).eq('user_id', sub.user_id);
          skipped++;
          continue;
        }

        if (existingCycle && existingCycle.status === 'processing' && existingCycle.locked_until && new Date(existingCycle.locked_until) > now) {
          skipped++;
          continue;
        }
      } catch (cycleCheckErr) {
        console.warn('⚠️ [Billing Cycle Check Notice]:', cycleCheckErr);
      }

      // 3. ATOMIC LOCK ACQUISITION in Supabase
      const { data: claimedSub, error: claimErr } = await serverSupabase
        .from('subscriptions')
        .update({
          billing_lock_until: lockUntilIso,
          updated_at: nowIso,
        })
        .eq('user_id', sub.user_id)
        .is('cancelled_at', null)
        .or(`billing_lock_until.is.null,billing_lock_until.lte.${nowIso}`)
        .select('id, user_id, plan, card_token, status, retry_count')
        .maybeSingle();

      if (claimErr || !claimedSub) {
        skipped++;
        continue;
      }

      // 4. Record cycle attempt in billing_cycles table
      const plan = (claimedSub.plan === 'enterprise' ? 'enterprise' : 'pro') as 'pro' | 'enterprise';
      const price = plan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;
      const cleanCycleSuffix = cycleKey.replace(/[^a-zA-Z0-9-]/g, '').slice(-16);
      const txRef = `FLW-REC-${plan.toUpperCase().slice(0, 3)}-${sub.user_id.slice(0, 6)}-${cleanCycleSuffix}`;

      try {
        await serverSupabase.from('billing_cycles').upsert({
          user_id: sub.user_id,
          cycle_key: cycleKey,
          tx_ref: txRef,
          plan: plan,
          amount: price,
          status: 'processing',
          locked_until: lockUntilIso,
          attempt_count: (sub.retry_count || 0) + 1,
          updated_at: nowIso,
        }, { onConflict: 'user_id,cycle_key' });
      } catch (upsertErr) {
        console.warn('⚠️ [Billing Cycles Upsert Notice]:', upsertErr);
      }

      processed++;

      // Lookup user email & name
      let userEmail = 'billing@customer.com';
      let userName = 'Subscriber';
      try {
        const { data: profile } = await serverSupabase.from('profiles').select('email, full_name').eq('id', sub.user_id).maybeSingle();
        if (profile?.email) {
          userEmail = profile.email;
          userName = profile.full_name || userName;
        }
      } catch {
        // Fallback
      }

      if (flwSecretKey && flwSecretKey.startsWith('FLWSECK') && !flwSecretKey.includes('xxx')) {
        try {
          const names = userName.trim().split(' ');
          const chargeRes = await fetch('https://api.flutterwave.com/v3/tokenized-charges', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${flwSecretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: claimedSub.card_token,
              currency: 'USD',
              country: 'US',
              amount: price,
              email: userEmail,
              first_name: names[0] || 'Subscriber',
              last_name: names.slice(1).join(' ') || 'Customer',
              tx_ref: txRef,
              narration: `InvoiceFlow ${plan.toUpperCase()} Subscription Renewal`,
            }),
          });

          const chargeData = await chargeRes.json();

          if (chargeRes.ok && chargeData.status === 'success' && chargeData.data?.status === 'successful') {
            succeeded++;
            const periodStart = new Date().toISOString();
            const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
            const flwTxId = String(chargeData.data.id || '');

            // Update billing cycle to completed
            await serverSupabase.from('billing_cycles').update({
              status: 'completed',
              locked_until: null,
              flutterwave_transaction_id: flwTxId,
              error_message: null,
              updated_at: periodStart,
            }).eq('user_id', sub.user_id).eq('cycle_key', cycleKey);

            // Update subscription to active
            await serverSupabase.from('subscriptions').update({
              status: 'active',
              plan: plan,
              trial_used: true,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              next_billing_date: periodEnd,
              last_billed_period: cycleKey,
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTxId,
              billing_lock_until: null,
              retry_count: 0,
              last_payment_error: null,
              updated_at: periodStart,
            }).eq('user_id', sub.user_id);

            // Record payment (idempotent upsert by flutterwave_ref)
            await serverSupabase.from('payments').upsert([{
              user_id: sub.user_id,
              amount: price,
              currency: 'USD',
              status: 'success',
              channel: 'card_token',
              notes: `Automatic subscription renewal for ${plan.toUpperCase()} plan`,
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTxId,
              payment_provider: 'flutterwave',
              paid_at: periodStart,
            }], { onConflict: 'flutterwave_ref' });
          } else {
            failed++;
            const errMsg = chargeData.message || 'Payment declined by card issuer';

            await serverSupabase.from('billing_cycles').update({
              status: 'failed',
              locked_until: null,
              error_message: errMsg,
              updated_at: new Date().toISOString(),
            }).eq('user_id', sub.user_id).eq('cycle_key', cycleKey);

            await serverSupabase.from('subscriptions').update({
              status: 'past_due',
              retry_count: (claimedSub.retry_count || 0) + 1,
              last_payment_error: errMsg,
              billing_lock_until: null,
              updated_at: new Date().toISOString(),
            }).eq('user_id', sub.user_id);

            await serverSupabase.from('payments').upsert([{
              user_id: sub.user_id,
              amount: price,
              currency: 'USD',
              status: 'failed',
              channel: 'card_token',
              notes: `Automatic subscription renewal failed: ${errMsg}`,
              flutterwave_ref: txRef,
              payment_provider: 'flutterwave',
              paid_at: new Date().toISOString(),
            }], { onConflict: 'flutterwave_ref' });
          }
        } catch (callErr: any) {
          failed++;
          await serverSupabase.from('subscriptions').update({
            billing_lock_until: null,
            last_payment_error: callErr?.message || 'Network exception',
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id);

          await serverSupabase.from('billing_cycles').update({
            status: 'failed',
            locked_until: null,
            error_message: callErr?.message || 'Network exception',
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id).eq('cycle_key', cycleKey);
        }
      } else {
        // Dev Simulation Auto-Renew
        succeeded++;
        const periodStart = new Date().toISOString();
        const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();

        await serverSupabase.from('billing_cycles').update({
          status: 'completed',
          locked_until: null,
          updated_at: periodStart,
        }).eq('user_id', sub.user_id).eq('cycle_key', cycleKey);

        await serverSupabase.from('subscriptions').update({
          status: 'active',
          plan: plan,
          trial_used: true,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          next_billing_date: periodEnd,
          last_billed_period: cycleKey,
          flutterwave_ref: txRef,
          billing_lock_until: null,
          retry_count: 0,
          last_payment_error: null,
          updated_at: periodStart,
        }).eq('user_id', sub.user_id);

        await serverSupabase.from('payments').upsert([{
          user_id: sub.user_id,
          amount: price,
          currency: 'USD',
          status: 'success',
          channel: 'card_token',
          notes: `Automatic subscription renewal for ${plan.toUpperCase()} plan (Dev Mode)`,
          flutterwave_ref: txRef,
          payment_provider: 'flutterwave',
          paid_at: periodStart,
        }], { onConflict: 'flutterwave_ref' });
      }
    }

    return res.json({
      status: 'success',
      processed,
      succeeded,
      failed,
      skipped,
    });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

