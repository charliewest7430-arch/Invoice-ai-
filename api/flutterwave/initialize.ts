import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Handler for POST /api/flutterwave/initialize
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

    const { email, name, plan, businessId, mode = 'subscription' } = body || {};

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        status: 'failed',
        message: 'A valid email address is required to initiate checkout.',
      });
    }

    const selectedPlan = plan === 'enterprise' ? 'enterprise' : 'pro';
    const isTrial = mode === 'trial';
    const fullPlanPrice = selectedPlan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;
    const planTitle = selectedPlan === 'enterprise' ? 'Enterprise' : 'Pro';

    // Nominal $1 card authorization amount for 7-day free trial card tokenization, or full plan price
    const amount = isTrial ? 1.0 : fullPlanPrice;

    // Check if user already used a trial
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
      !supabaseUrl.includes('your-supabase-project')
    );
    const serverSupabase = isSupabaseConfigured && supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    if (isTrial && serverSupabase && email) {
      try {
        const { data: profile } = await serverSupabase.from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
        if (profile?.id) {
          const { data: existingSub } = await serverSupabase
            .from('subscriptions')
            .select('trial_started_at, trial_used')
            .eq('user_id', profile.id)
            .maybeSingle();

          if (existingSub && (existingSub.trial_started_at || existingSub.trial_used)) {
            return res.status(400).json({
              status: 'failed',
              message: 'A 7-day free trial has already been used on this account. Please select a plan to subscribe directly.',
            });
          }
        }
      } catch (checkErr) {
        console.warn('⚠️ Check trial serverless error:', checkErr);
      }
    }

    const prefix = isTrial ? 'IFLOW-TRL' : 'IFLOW-SUB';
    const tx_ref = `${prefix}-${selectedPlan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const flwSecretKey = process.env.FLW_SECRET_KEY;

    let appBaseUrl = process.env.APP_URL || 'https://www.invoiceflowai.cloud';
    if (!appBaseUrl.startsWith('http://') && !appBaseUrl.startsWith('https://')) {
      appBaseUrl = `https://${appBaseUrl}`;
    }
    const redirect_url = `${appBaseUrl.replace(/\/$/, '')}/?page=billing&flw_callback=true&tx_ref=${tx_ref}&plan=${selectedPlan}&mode=${mode}`;

    const title = isTrial
      ? `InvoiceFlow ${planTitle} 7-Day Free Trial Authorization`
      : `InvoiceFlow ${planTitle} Subscription`;

    const description = isTrial
      ? `Authorize card for 7-day free trial. Then $${fullPlanPrice}/month automatically. Cancel anytime before trial ends.`
      : `Monthly subscription to InvoiceFlow ${planTitle} Plan ($${fullPlanPrice}/month)`;

    if (flwSecretKey && flwSecretKey.startsWith('FLWSECK') && !flwSecretKey.includes('xxx')) {
      const flwResponse = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref,
          amount,
          currency: 'USD',
          redirect_url,
          payment_options: 'card,ussd,mobilemoney,banktransfer',
          customer: {
            email: email.trim(),
            name: name || 'InvoiceFlow Subscriber',
          },
          customizations: {
            title,
            description,
            logo: `${appBaseUrl}/favicon.ico`,
          },
          meta: {
            plan: selectedPlan,
            business_id: businessId,
            mode,
            is_trial: isTrial,
            full_plan_price: fullPlanPrice,
          },
        }),
      });

      const flwData = await flwResponse.json();

      if (flwData.status === 'success' && flwData.data?.link) {
        return res.json({
          status: 'success',
          message: 'Payment link generated successfully',
          data: {
            link: flwData.data.link,
            tx_ref,
            amount,
            currency: 'USD',
            mode,
          },
        });
      }
    }

    // Standard fallback / dev link
    return res.json({
      status: 'success',
      message: 'Checkout initialized',
      data: {
        tx_ref,
        amount,
        currency: 'USD',
        link: redirect_url,
        mode,
      },
    });
  } catch (err: any) {
    console.error('❌ Flutterwave Initialize Error:', err);
    return res.status(500).json({ status: 'failed', message: err.message || 'Initialization error' });
  }
}
