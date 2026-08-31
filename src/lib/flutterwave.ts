/**
 * Flutterwave Payment Gateway Integration
 * Handles standard hosted checkout and verification
 */

import { getAuthHeader } from './supabaseClient';
import { PRO_PRICE, ENTERPRISE_PRICE } from './planLimits';

export interface FlutterwaveCheckoutOptions {
  plan?: 'pro' | 'enterprise' | string;
  amount?: number | string;
  currency?: string;
  email: string;
  name?: string;
  phoneNumber?: string;
  businessId?: string;
  mode?: 'trial' | 'subscription' | 'one_time';
  callbackUrl?: string;
  redirectUrl?: string;
  paymentOptions?: string;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  metadata?: Record<string, any>;
  onSuccess?: (response: { reference: string; status: string; data?: any }) => void;
  onError?: (error: { message: string; data?: any }) => void;
  onCancel?: () => void;
}

export interface FlutterwaveInitResponse {
  success: boolean;
  link?: string;
  tx_ref: string;
  plan: 'pro' | 'enterprise' | string;
  mode?: 'trial' | 'subscription' | 'one_time';
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
  const planName = options.plan || 'pro';
  const isTrial = options.mode === 'trial';
  const planTitle = planName === 'enterprise' ? 'Enterprise' : 'Pro';
  const fullPlanPrice = planName === 'enterprise' ? ENTERPRISE_PRICE : PRO_PRICE;

  // 1. Validate Customer Email (REQUIRED by Flutterwave)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = (options.email || '').trim().toLowerCase();
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    const errorMsg = 'A valid customer email address is required for checkout.';
    console.error('❌ [Flutterwave Checkout] Validation Error:', errorMsg, { email: options.email });
    if (options.onError) {
      options.onError({ message: errorMsg });
    }
    return;
  }

  // 2. Validate Payment Amount (REQUIRED by Flutterwave: must be > 0)
  let finalAmount: number;
  if (options.amount !== undefined && options.amount !== null && options.amount !== '') {
    finalAmount = typeof options.amount === 'number' ? options.amount : parseFloat(String(options.amount));
  } else {
    finalAmount = isTrial ? 1.0 : fullPlanPrice;
  }

  if (isNaN(finalAmount) || finalAmount <= 0) {
    const errorMsg = 'A valid payment amount greater than 0 is required.';
    console.error('❌ [Flutterwave Checkout] Validation Error:', errorMsg, { amount: finalAmount });
    if (options.onError) {
      options.onError({ message: errorMsg });
    }
    return;
  }

  // 3. Generate unique transaction reference (REQUIRED by Flutterwave)
  const uniqueTxRef = `INV-${planName.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // 4. Build redirect and callback URLs
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://www.invoiceflowai.cloud';
  const redirectUrl =
    options.redirectUrl ||
    options.callbackUrl ||
    `${currentOrigin}/billing?flw_callback=1&plan=${planName}&mode=${options.mode || 'subscription'}`;

  // 5. Construct full Flutterwave v3 payload with all REQUIRED and RECOMMENDED fields
  const customerName = (options.name || cleanEmail.split('@')[0] || 'Subscriber').trim();
  const customerPhone = (options.phoneNumber || '').trim();

  const title =
    options.customizations?.title ||
    (isTrial ? `InvoiceFlow ${planTitle} 7-Day Free Trial` : `InvoiceFlow ${planTitle} Subscription`);

  const description =
    options.customizations?.description ||
    (isTrial
      ? 'Authorize card for 7-day free trial ($1.00 verification). Cancel anytime.'
      : `Monthly subscription to InvoiceFlow ${planTitle} Plan ($${finalAmount}/month)`);

  const logoUrl = options.customizations?.logo || `${currentOrigin}/favicon.ico`;

  const payload = {
    // --- REQUIRED FLUTTERWAVE V3 FIELDS ---
    tx_ref: uniqueTxRef,
    amount: finalAmount,
    currency: options.currency || 'USD',
    customer: {
      email: cleanEmail,
      name: customerName,
      phonenumber: customerPhone,
    },

    // --- RECOMMENDED FLUTTERWAVE V3 FIELDS ---
    redirect_url: redirectUrl,
    payment_options: options.paymentOptions || 'card,mobilemoney,ussd,banktransfer',
    customizations: {
      title,
      description,
      logo: logoUrl,
    },
    meta: {
      plan: planName,
      mode: options.mode || 'subscription',
      business_id: options.businessId,
      full_plan_price: fullPlanPrice,
      is_trial: isTrial,
      ...(options.metadata || {}),
    },

    // Top-level aliases for hybrid backend routers
    plan: planName,
    mode: options.mode || 'subscription',
    email: cleanEmail,
    name: customerName,
    callbackUrl: redirectUrl,
    metadata: {
      plan: planName,
      mode: options.mode || 'subscription',
      businessId: options.businessId,
      ...(options.metadata || {}),
    },
  };

  // Log the exact request body before sending for easy debugging
  console.log('📤 [Flutterwave Checkout] Sending payload to /api/flutterwave/initialize:', JSON.stringify(payload, null, 2));

  try {
    const authHeaders = await getAuthHeader();

    const res = await fetch('/api/flutterwave/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let initData: any = null;
    try {
      initData = text ? JSON.parse(text) : {};
    } catch {
      initData = { status: 'error', message: text || `Server responded with status ${res.status}` };
    }

    console.log('📥 [Flutterwave Checkout] Received response:', initData);

    // Extract hosted checkout link across all response shapes
    const checkoutUrl =
      (typeof initData.data?.link === 'string' && initData.data.link.startsWith('http') ? initData.data.link : null) ||
      (typeof initData.link === 'string' && initData.link.startsWith('http') ? initData.link : null) ||
      (typeof initData.data?.checkout_url === 'string' && initData.data.checkout_url.startsWith('http') ? initData.data.checkout_url : null) ||
      (typeof initData.checkout_url === 'string' && initData.checkout_url.startsWith('http') ? initData.checkout_url : null) ||
      (typeof initData.flutterwaveResponse?.data?.link === 'string' && initData.flutterwaveResponse.data.link.startsWith('http') ? initData.flutterwaveResponse.data.link : null);

    // 1. Success with Flutterwave payment link: redirect to Flutterwave hosted checkout
    if ((initData.status === 'success' || initData.success === true) && checkoutUrl) {
      console.log('🔗 [Flutterwave Checkout] Redirecting to Flutterwave checkout URL:', checkoutUrl);
      try {
        sessionStorage.setItem('invoiceflow_flw_pending_tx', JSON.stringify({
          tx_ref: uniqueTxRef,
          plan: planName,
          mode: options.mode || 'subscription',
          amount: finalAmount,
        }));
      } catch (e) {
        console.warn('Storage notice:', e);
      }
      window.location.href = checkoutUrl;
      return;
    }

    // 2. Dev Simulation Mode (if explicitly returned by server in test sandbox)
    if (initData.devMode) {
      console.info('ℹ️ Running Flutterwave in Development Simulation Mode');
      const verifyRes = await verifyFlutterwaveTransaction({
        tx_ref: uniqueTxRef,
        plan: planName as any,
        mode: options.mode as any,
        simulated: true,
      });

      if (verifyRes.success) {
        if (options.onSuccess) {
          options.onSuccess({
            reference: uniqueTxRef,
            status: 'success',
            data: verifyRes.data,
          });
        }
      } else if (options.onError) {
        options.onError({ message: verifyRes.message || 'Simulation verification failed' });
      }
      return;
    }

    // 3. Failure: Display exact error message from Flutterwave API response
    const errorMsg =
      initData.message ||
      initData.error ||
      initData.flutterwaveResponse?.message ||
      (res.status === 401
        ? 'Please sign in or create an account to start your upgrade.'
        : 'Failed to initialize Flutterwave checkout session.');

    console.warn('⚠️ [Flutterwave Checkout] Initialization error:', errorMsg);
    if (options.onError) {
      options.onError({ message: errorMsg, data: initData });
    }
  } catch (err: any) {
    console.error('❌ [Flutterwave Checkout] Network Exception:', err);
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
  mode?: 'trial' | 'subscription';
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

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || `Server responded with status ${res.status}` };
    }

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

/**
 * Cancels a subscription / trial via server-side API.
 */
export async function cancelSubscriptionApi(): Promise<{ success: boolean; message?: string; data?: any }> {
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/billing/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({}),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text || `Server responded with status ${res.status}` };
    }

    if (res.ok && (data.status === 'success' || data.success === true)) {
      return { success: true, data: data.data || data };
    }

    return {
      success: false,
      message: data.message || 'Failed to cancel subscription.',
      data,
    };
  } catch (err: any) {
    console.error('❌ Cancel Subscription Network Error:', err);
    return {
      success: false,
      message: err.message || 'Network error while canceling subscription.',
    };
  }
}
