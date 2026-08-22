/**
 * Paystack Integration Helper
 */

import { getAuthHeader } from './supabaseClient';

export function getPaystackPublicKey(): string {
  const key =
    (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string) ||
    (import.meta.env.PAYSTACK_PUBLIC_KEY as string) ||
    '';

  if (key && key.startsWith('sk_')) {
    console.error('🚨 SECURITY ERROR: Paystack Secret Key (sk_) was improperly exposed to frontend public key! Use a public key starting with pk_test_ or pk_live_.');
    return '';
  }
  return key;
}

export const PAYSTACK_PUBLIC_KEY = getPaystackPublicKey();

export interface PaystackInitOptions {
  email: string;
  amount: number; // Major unit (e.g. 29 for $29, 25000 for ₦25,000)
  currency?: string; // e.g. NGN, USD, GHS, KES, ZAR, EUR, GBP
  reference?: string;
  planName?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: { reference: string; status: string; data?: any }) => void;
  onError?: (error: { message: string; paystackResponse?: any; suggestion?: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

/**
 * Dynamically loads Paystack inline JS SDK if not present
 */
export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.PaystackPop) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('⚠️ Could not load Paystack inline.js script from CDN');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open Paystack payment modal or trigger server payment verification
 */
export async function openPaystackModal(options: PaystackInitOptions) {
  const publicKey = getPaystackPublicKey();
  const isTestMode = publicKey.startsWith('pk_test_');
  const selectedCurrency = (options.currency || 'USD').toUpperCase();
  
  // Guarantee unique reference for every single checkout attempt
  const uniqueRef =
    options.reference ||
    `SUB-${options.planName ? options.planName.toUpperCase() : 'PRO'}-${selectedCurrency}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  console.log(`💳 [Paystack Client] Initializing checkout...
  • Email: ${options.email}
  • Major Amount (USD): $${options.amount}
  • Minor Amount (Cents): ${Math.round(options.amount * 100)}
  • Currency: ${selectedCurrency}
  • Reference: ${uniqueRef}
  • Public Key Mode: ${isTestMode ? 'TEST MODE (pk_test_...)' : publicKey.startsWith('pk_live_') ? 'LIVE MODE (pk_live_...)' : 'UNCONFIGURED / PLACEHOLDER'}`);

  // Step 1: Initialize transaction via server backend API to validate with Paystack
  let initData: any = null;
  try {
    const authHeaders = await getAuthHeader();
    const initRes = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        email: options.email,
        amount: options.amount, // Server converts to minor unit (* 100)
        currency: selectedCurrency,
        reference: uniqueRef,
        metadata: options.metadata,
      }),
    });

    initData = await initRes.json();

    if (!initRes.ok || !initData.success) {
      let errMsg = initData.message || 'Paystack payment initialization failed.';
      if (
        initData.code === 'unsupported_currency' ||
        (errMsg && errMsg.toLowerCase().includes('currency'))
      ) {
        errMsg = 'USD payments are temporarily unavailable. Please try again later.';
      }

      console.warn('⚠️ Paystack API Initialization Response:', initData?.message || 'Initialization failed');

      if (options.onError) {
        options.onError({
          message: errMsg,
          paystackResponse: initData.paystackResponse || initData,
          suggestion: initData.suggestion,
        });
      }
      return;
    }
  } catch (err: any) {
    console.error('❌ Paystack Initialization Exception:', err);
    if (options.onError) {
      options.onError({
        message: err.message || 'Server network error during Paystack initialization',
        paystackResponse: { status: false, error: err.message },
      });
    }
    return;
  }

  // Handle Dev Simulation Mode if no real secret key is configured on server
  if (initData.devMode) {
    console.info('ℹ️ Running in Dev Simulation mode (no real PAYSTACK_SECRET_KEY set)');
    const verified = await verifyPaymentWithServer(uniqueRef, true, options.amount, options.email);
    if (verified.success) {
      options.onSuccess({ reference: uniqueRef, status: 'success', data: verified.data });
    } else {
      options.onClose();
    }
    return;
  }

  // Step 2: Load Paystack Inline SDK for Popup
  const scriptLoaded = await loadPaystackScript();

  if (scriptLoaded && window.PaystackPop) {
    try {
      const handleSuccess = function (response: any) {
        console.log('🔔 [Paystack Popup Callback]:', response);
        const refToVerify = response?.reference || response?.trxref || uniqueRef;

        verifyPaymentWithServer(refToVerify)
          .then((verifyResult) => {
            if (verifyResult.success) {
              options.onSuccess({
                reference: refToVerify,
                status: 'success',
                data: verifyResult.data,
              });
            } else {
              console.error('❌ Paystack payment completed in UI but server verification failed:', verifyResult);
              if (options.onError) {
                options.onError({
                  message: verifyResult.message || 'Payment verification failed on server.',
                  paystackResponse: verifyResult.data,
                });
              }
            }
          })
          .catch((err) => {
            console.error('❌ Verification error:', err);
            if (options.onError) {
              options.onError({ message: err.message || 'Verification error' });
            }
          });
      };

      const handleClose = function () {
        console.log('Paystack modal closed by user');
        options.onClose();
      };

      const actualCurrency = initData?.currency || selectedCurrency;
      const actualAmount = initData?.currency === 'NGN' && initData?.convertedFromUSD
        ? Math.round(options.amount * 1600 * 100)
        : Math.round(options.amount * 100);

      const popConfig: any = {
        key: publicKey || 'pk_test_sample_key',
        email: options.email,
        amount: actualAmount,
        currency: actualCurrency,
        ref: initData?.reference || uniqueRef,
        metadata: options.metadata,
        callback: function (res: any) {
          handleSuccess(res);
        },
        onSuccess: function (res: any) {
          handleSuccess(res);
        },
        onClose: function () {
          handleClose();
        },
        onCancel: function () {
          handleClose();
        },
      };

      if (initData?.access_code) {
        popConfig.access_code = initData.access_code;
      }

      const handler = window.PaystackPop.setup(popConfig);
      handler.openIframe();
      return;
    } catch (popupErr: any) {
      console.error('❌ PaystackPop inline launch error:', popupErr);
    }
  }

  // Fallback: Redirect to authorization URL if inline script fails or iframe is blocked
  if (initData.authorization_url && initData.authorization_url !== '#') {
    console.log('Redirecting to Paystack Authorization URL:', initData.authorization_url);
    window.location.href = initData.authorization_url;
  } else {
    if (options.onError) {
      options.onError({
        message: 'Could not launch Paystack checkout popup.',
        paystackResponse: initData.paystackResponse,
      });
    }
  }
}

/**
 * Verify payment with backend server
 */
export async function verifyPaymentWithServer(
  reference: string,
  simulated = false,
  amount?: number,
  email?: string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, simulated, amount, email }),
    });
    const result = await response.json();
    return {
      success: result.status === 'success' || result.data?.status === 'success',
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error('Server payment verification error:', error);
    return { success: false, message: error.message || 'Server verification failed' };
  }
}
