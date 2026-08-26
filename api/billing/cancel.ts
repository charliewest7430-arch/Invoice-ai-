import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function Handler for POST /api/billing/cancel
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

    const { userId } = body || {};
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const isSupabaseConfigured = Boolean(
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
      !supabaseUrl.includes('your-supabase-project')
    );

    if (isSupabaseConfigured && supabaseUrl && supabaseKey && userId) {
      const serverSupabase = createClient(supabaseUrl, supabaseKey);
      const cancelledAt = new Date().toISOString();

      const { data: updatedSub, error: updateErr } = await serverSupabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancelled_at: cancelledAt,
          next_billing_date: null,
          updated_at: cancelledAt,
        })
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (updateErr) {
        return res.status(500).json({ success: false, message: updateErr.message });
      }

      return res.json({
        success: true,
        message: 'Subscription / trial has been cancelled. No automatic billing will occur.',
        subscription: updatedSub,
      });
    }

    return res.json({
      success: true,
      message: 'Subscription cancelled (Dev Mode).',
      subscription: {
        user_id: userId,
        status: 'canceled',
        cancelled_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}
