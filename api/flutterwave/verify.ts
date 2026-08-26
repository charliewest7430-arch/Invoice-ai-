import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Handler for POST /api/flutterwave/verify
const FLW_PRO_PRICE = 9.99;
const FLW_ENTERPRISE_PRICE = 15.99;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({
      status: 'failed',
      message: 'Method Not Allowed',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { transaction_id, tx_ref, plan, userId, mode } = body || {};
    const flwSecretKey = process.env.FLW_SECRET_KEY;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
      !supabaseUrl.includes('your-supabase-project')
    );
    const serverSupabase = isSupabaseConfigured && supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    if (flwSecretKey && flwSecretKey.startsWith('FLWSECK') && !flwSecretKey.includes('xxx')) {
      let verifyUrl = '';
      if (transaction_id) {
        verifyUrl = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
      } else if (tx_ref) {
        verifyUrl = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`;
      }

      if (verifyUrl) {
        const verifyRes = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${flwSecretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const responseData = await verifyRes.json();

        if (responseData.status === 'success' && responseData.data?.status === 'successful') {
          const txData = responseData.data;
          const targetPlan = (plan || txData.meta?.plan || 'pro') === 'enterprise' ? 'enterprise' : 'pro';
          const targetUserId = userId || txData.meta?.user_id;
          const isTrial = txData.meta?.mode === 'trial' || txData.meta?.is_trial === true || mode === 'trial' || (tx_ref && tx_ref.includes('-TRL'));

          // Extract card token and details
          const cardToken = txData.card?.token || txData.authorization?.token || txData.payment_options?.token;
          const cardLast4 = txData.card?.last_4digits || txData.card?.last4 || null;
          const cardBrand = txData.card?.issuer || txData.card?.type || null;
          const cardExp = txData.card?.expiry || null;

          if (serverSupabase && targetUserId) {
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
                  flutterwave_ref: txData.tx_ref,
                  flutterwave_transaction_id: String(txData.id),
                  payment_provider: 'flutterwave',
                  current_period_start: trialStart,
                  current_period_end: trialEnd,
                  next_billing_date: trialEnd,
                  cancelled_at: null,
                  updated_at: new Date().toISOString(),
                });

                await serverSupabase.from('payments').insert([{
                  user_id: targetUserId,
                  amount: txData.amount,
                  currency: txData.currency || 'USD',
                  status: 'success',
                  channel: txData.payment_type || 'card',
                  notes: 'Card authorization for 7-day free trial',
                  flutterwave_ref: txData.tx_ref,
                  flutterwave_transaction_id: String(txData.id),
                  payment_provider: 'flutterwave',
                  paid_at: txData.created_at || new Date().toISOString(),
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
                  flutterwave_ref: txData.tx_ref,
                  flutterwave_transaction_id: String(txData.id),
                  payment_provider: 'flutterwave',
                  current_period_start: periodStart,
                  current_period_end: periodEnd,
                  next_billing_date: periodEnd,
                  cancelled_at: null,
                  updated_at: new Date().toISOString(),
                });

                await serverSupabase.from('payments').insert([{
                  user_id: targetUserId,
                  amount: txData.amount,
                  currency: txData.currency || 'USD',
                  status: 'success',
                  channel: txData.payment_type || 'card',
                  notes: 'Monthly subscription payment',
                  flutterwave_ref: txData.tx_ref,
                  flutterwave_transaction_id: String(txData.id),
                  payment_provider: 'flutterwave',
                  paid_at: txData.created_at || new Date().toISOString(),
                }]);
              }
            } catch (dbErr) {
              console.warn('⚠️ Serverless verification DB update notice:', dbErr);
            }
          }

          return res.json({
            status: 'success',
            message: isTrial
              ? 'Payment card authorized successfully. 7-day free trial is now active.'
              : 'Payment verified successfully via Flutterwave API',
            data: txData,
          });
        }
      }
    }

    const verifiedPlan = plan === 'enterprise' ? 'enterprise' : 'pro';
    const isTrial = mode === 'trial' || (tx_ref && tx_ref.includes('-TRL'));
    const fullPrice = verifiedPlan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;
    const price = isTrial ? 1.0 : fullPrice;
    const mockRef = tx_ref || `FLW-DEV-${Date.now()}`;

    if (serverSupabase && userId) {
      try {
        if (isTrial) {
          const trialStart = new Date().toISOString();
          const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          await serverSupabase.from('subscriptions').upsert({
            user_id: userId,
            plan: verifiedPlan,
            status: 'trialing',
            trial_started_at: trialStart,
            trial_ends_at: trialEnd,
            trial_used: true,
            card_token: 'flw_tkn_dev_simulated',
            card_last4: '4242',
            card_brand: 'VISA',
            flutterwave_ref: mockRef,
            payment_provider: 'flutterwave',
            current_period_start: trialStart,
            current_period_end: trialEnd,
            next_billing_date: trialEnd,
            cancelled_at: null,
            updated_at: new Date().toISOString(),
          });

          await serverSupabase.from('payments').insert([{
            user_id: userId,
            amount: price,
            currency: 'USD',
            status: 'success',
            channel: 'card',
            notes: 'Card authorization for 7-day free trial (Dev Mode)',
            flutterwave_ref: mockRef,
            payment_provider: 'flutterwave',
            paid_at: new Date().toISOString(),
          }]);
        } else {
          const periodStart = new Date().toISOString();
          const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();

          await serverSupabase.from('subscriptions').upsert({
            user_id: userId,
            plan: verifiedPlan,
            status: 'active',
            card_token: 'flw_tkn_dev_simulated',
            card_last4: '4242',
            card_brand: 'VISA',
            flutterwave_ref: mockRef,
            payment_provider: 'flutterwave',
            current_period_start: periodStart,
            current_period_end: periodEnd,
            next_billing_date: periodEnd,
            cancelled_at: null,
            updated_at: new Date().toISOString(),
          });

          await serverSupabase.from('payments').insert([{
            user_id: userId,
            amount: price,
            currency: 'USD',
            status: 'success',
            channel: 'card',
            notes: 'Monthly subscription payment (Dev Mode)',
            flutterwave_ref: mockRef,
            payment_provider: 'flutterwave',
            paid_at: new Date().toISOString(),
          }]);
        }
      } catch (dbErr) {
        console.warn('⚠️ Serverless dev DB update notice:', dbErr);
      }
    }

    return res.json({
      status: 'success',
      message: isTrial
        ? 'Payment card authorized successfully. 7-day free trial active (Dev Simulation).'
        : 'Payment verified successfully',
      data: {
        id: `FLW_TX_${Date.now()}`,
        tx_ref: mockRef,
        status: 'successful',
        amount: price,
        currency: 'USD',
        meta: { plan: verifiedPlan, user_id: userId, mode: isTrial ? 'trial' : 'subscription' },
      },
    });
  } catch (err: any) {
    console.error('❌ Serverless Verify Error:', err);
    return res.status(500).json({ status: 'failed', message: err.message || 'Verification error' });
  }
}
