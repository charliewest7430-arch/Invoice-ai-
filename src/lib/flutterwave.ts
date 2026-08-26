/**
 * Flutterwave Payment Gateway Integration
 * Handles standard hosted checkout and verification
 */

import { getAuthHeader } from './supabaseClient';
import { PRO_PRICE, ENTERPRISE_PRICE } from './planLimits';

export interface FlutterwaveCheckoutOptions {
  plan: 'pro' | 'enterprise';
  email: string;
  name?: string;
  businessId?: string;
  callbackUrl?: string;
  onSuccess?: (response: { reference: string; status: string; data?: any }) => void;
  onError?: (error: { message: string; data?: any }) => void;
  onCancel?: () => void;
}

export interface FlutterwaveInitResponse {
  success: boolean;
  link?: string;
  tx_ref: string;
  plan: 'pro' | 'enterprise';
  amount: number;
  currency: string;
  devMode?: boolean;
  message?: string;
  flutterwaveResponse?: any;
}

/**
 * Initializes a Flutterwave Standard hosted checkout session via server-side API.
 * Never exposes Flutterwave secret keys to the browser.
 */
export async function initiateFlutterwaveCheckout(options: FlutterwaveCheckoutOptions): Promise<void> {
  const planName = options.plan;
  const expectedAmount = planName === 'pro' ? PRO_PRICE : ENTERPRISE_PRICE;

  console.log(`💳 [Flutterwave Client] Initializing checkout for ${planName.toUpperCase()} Plan ($${expectedAmount}/mo)...`);

  try {
    const authHeaders = await getAuthHeader();
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.invoiceflowai.cloud';
    const callbackUrl = options.callbackUrl || `${currentOrigin}/billing?flw_callback=1&plan=${planName}`;

    const res = await fetch('/api/flutterwave/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        plan: planName,
        email: options.email,
        name: options.name,
        callbackUrl,
        metadata: {
          businessId: options.businessId,
          plan: planName,
        },
      }),
    });

    const initData: FlutterwaveInitResponse = await res.json();

    if (!res.ok || !initData.success) {
      const errorMsg = initData.message || 'Failed to initialize Flutterwave checkout session.';
      console.warn('⚠️ Flutterwave initialization declined:', errorMsg);
      if (options.onError) {
        options.onError({ message: errorMsg, data: initData });
      }
      return;
    }

    // If hosted link returned from Flutterwave v3 API, redirect to Flutterwave Standard checkout
    if (initData.link && initData.link.startsWith('http')) {
      console.log('🔗 Redirecting to Flutterwave Standard Checkout:', initData.link);
      // Save pending verification ref
      try {
        sessionStorage.setItem('invoiceflow_flw_pending_tx', JSON.stringify({
          tx_ref: initData.tx_ref,
          plan: planName,
          amount: initData.amount,
        }));
      } catch (e) {
        console.warn('Storage notice:', e);
      }
      window.location.href = initData.link;
      return;
    }

    // Dev Simulation Mode (when FLW_SECRET_KEY is not configured in development)
    if (initData.devMode) {
      console.info('ℹ️ Running Flutterwave in Development Simulation Mode');
      const verifyRes = await verifyFlutterwaveTransaction({
        tx_ref: initData.tx_ref,
        plan: planName,
        simulated: true,
      });

      if (verifyRes.success) {
        if (options.onSuccess) {
          options.onSuccess({
            reference: initData.tx_ref,
            status: 'success',
            data: verifyRes.data,
          });
        }
      } else if (options.onError) {
        options.onError({ message: verifyRes.message || 'Simulation verification failed' });
      }
      return;
    }

    if (options.onError) {
      options.onError({ message: 'No valid checkout link was returned from payment provider.' });
    }
  } catch (err: any) {
    console.error('❌ Flutterwave Checkout Error:', err);
    if (options.onError) {
      options.onError({ message: err.message || 'Network error during checkout initialization.' });
    }
  }
}

/**
 * Verifies a Flutterwave transaction via server-side API.
 */
export async function verifyFlutterwaveTransaction(params: {
  transaction_id?: string | number;
  tx_ref?: string;
  plan?: 'pro' | 'enterprise';
  simulated?: boolean;
}): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/flutterwave/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (res.ok && (data.status === 'success' || data.success === true)) {
      return { success: true, data: data.data || data };
    }

    return {
      success: false,
      message: data.message || 'Transaction verification failed.',
      data,
    };
  } catch (err: any) {
    console.error('❌ Transaction Verification Network Error:', err);
    return {
      success: false,
      message: err.message || 'Network error during payment verification.',
    };
  }
}
