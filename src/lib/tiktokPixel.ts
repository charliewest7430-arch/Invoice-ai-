/**
 * TikTok Pixel Integration Utility for InvoiceFlow AI
 * Pixel ID: DA6B9BJC77U48103RALG
 */

export const DEFAULT_TIKTOK_PIXEL_ID = 'DA6B9BJC77U48103RALG';

export function getTikTokPixelId(): string {
  const envId =
    (import.meta.env.VITE_TIKTOK_PIXEL_ID as string) ||
    (import.meta.env.TIKTOK_PIXEL_ID as string) ||
    '';
  return envId.trim() || DEFAULT_TIKTOK_PIXEL_ID;
}

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: any;
    _ttq_initialized?: boolean;
    _ttq_tracked_purchases?: Set<string>;
    _ttq_last_page_view?: { path: string; timestamp: number };
  }
}

// In-memory set for purchase & trial deduplication within the active session
const trackedPurchaseRefs = new Set<string>();
const trackedTrialKeys = new Set<string>();

/**
 * Initializes the TikTok Pixel tracking script safely
 */
export function initTikTokPixel(customPixelId?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const pixelId = customPixelId || getTikTokPixelId();

  if (!pixelId) {
    console.warn('⚠️ [TikTok Pixel] No Pixel ID configured. Initialization skipped.');
    return;
  }

  // Prevent duplicate script injection and initialization
  if (window._ttq_initialized || (window.ttq && window.ttq._i && window.ttq._i[pixelId])) {
    console.info(`ℹ️ [TikTok Pixel] Already initialized for ID: ${pixelId}`);
    return;
  }

  try {
    /* TikTok Pixel Base Code */
    (function (w: any, d: Document, t: string) {
      w.TiktokAnalyticsObject = t;
      var ttq = (w[t] = w[t] || []);
      ttq.methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
        'disableCookie',
        'holdConsent',
        'revokeConsent',
        'grantConsent',
      ];
      ttq.setAndDefer = function (t: any, e: any) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (var i = 0; i < ttq.methods.length; i++) {
        ttq.setAndDefer(ttq, ttq.methods[i]);
      }
      ttq.instance = function (t: any) {
        var e = ttq._i[t] || [];
        for (var n = 0; n < ttq.methods.length; n++) {
          ttq.setAndDefer(e, ttq.methods[n]);
        }
        return e;
      };
      ttq.load = function (e: string, n?: any) {
        var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = r;
        ttq._t = ttq._t || {};
        ttq._t[e] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = n || {};
        var o = document.createElement('script');
        o.type = 'text/javascript';
        o.async = true;
        o.src = r + '?sdkid=' + e + '&lib=' + t;
        var firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(o, firstScript);
        } else {
          document.head.appendChild(o);
        }
      };

      ttq.load(pixelId);
      ttq.page();
    })(window, document, 'ttq');

    window._ttq_initialized = true;
    console.info(`🎯 [TikTok Pixel] Initialized successfully with ID: ${pixelId}`);
  } catch (error) {
    console.error('❌ [TikTok Pixel] Safe initialization error:', error);
  }
}

/**
 * 1. PageView Event
 * Tracks SPA navigation and page loads without duplicate bursts
 */
export function trackPageView(pageName?: string): void {
  if (typeof window === 'undefined') return;

  try {
    const pageIdentifier = pageName || window.location.pathname || 'app';
    const now = Date.now();

    // Prevent immediate duplicate PageView fires on the same page within 500ms
    if (
      window._ttq_last_page_view &&
      window._ttq_last_page_view.path === pageIdentifier &&
      now - window._ttq_last_page_view.timestamp < 500
    ) {
      return;
    }

    window._ttq_last_page_view = { path: pageIdentifier, timestamp: now };

    if (window.ttq && typeof window.ttq.page === 'function') {
      window.ttq.page();
      console.info(`📊 [TikTok Pixel] PageView tracked: ${pageIdentifier}`);
    } else if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('PageView', { page_name: pageIdentifier });
      console.info(`📊 [TikTok Pixel] PageView tracked: ${pageIdentifier}`);
    }
  } catch (error) {
    console.warn('⚠️ [TikTok Pixel] Safe PageView error:', error);
  }
}

/**
 * 2. ViewContent Event
 * Tracks viewing key marketing, conversion, or pricing content
 */
export function trackViewContent(params?: {
  content_id?: string;
  content_type?: string;
  content_name?: string;
  value?: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('ViewContent', {
        content_id: params?.content_id || 'invoiceflow_pricing',
        content_type: params?.content_type || 'product',
        content_name: params?.content_name || 'InvoiceFlow AI Subscription Plans',
        value: params?.value,
        currency: params?.currency || 'USD',
      });
      console.info('📊 [TikTok Pixel] ViewContent event tracked:', params?.content_name || 'Pricing');
    }
  } catch (error) {
    console.warn('⚠️ [TikTok Pixel] Safe ViewContent error:', error);
  }
}

/**
 * 3. CompleteRegistration Event
 * Tracks user account creation only after successful registration
 */
export function trackCompleteRegistration(params?: {
  method?: string;
  userId?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('CompleteRegistration', {
        content_name: 'User Registration',
        status: 'success',
        registration_method: params?.method || 'email',
      });
      console.info('🎉 [TikTok Pixel] CompleteRegistration event tracked successfully');
    }
  } catch (error) {
    console.warn('⚠️ [TikTok Pixel] Safe CompleteRegistration error:', error);
  }
}

/**
 * 4. StartTrial Event
 * Tracks 7-day free trial activation (deduplicated per activation)
 */
export function trackStartTrial(params?: {
  plan?: string;
  value?: number;
  currency?: string;
  userId?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const dedupeKey = `${params?.userId || 'session'}_trial_${params?.plan || 'pro'}`;

    // Prevent duplicate fires within the same session
    if (trackedTrialKeys.has(dedupeKey)) {
      return;
    }

    try {
      const storageKey = `tt_trial_${dedupeKey}`;
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
      sessionStorage.setItem(storageKey, 'true');
    } catch {
      // Storage access safety in private mode
    }

    trackedTrialKeys.add(dedupeKey);

    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('StartTrial', {
        content_name: '7-Day Pro Free Trial',
        content_id: params?.plan || 'pro_trial',
        content_type: 'product',
        value: params?.value ?? 0,
        currency: params?.currency || 'USD',
      });
      console.info('🚀 [TikTok Pixel] StartTrial event tracked successfully');
    }
  } catch (error) {
    console.warn('⚠️ [TikTok Pixel] Safe StartTrial error:', error);
  }
}

/**
 * 5. Purchase Event
 * Tracks verified payment/subscription completion (deduplicated by order_id/ref)
 */
export function trackPurchase(params: {
  value: number;
  currency: string;
  order_id?: string;
  content_id?: string;
  content_name?: string;
  content_type?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const orderId = params.order_id || `order_${Date.now()}`;

    // Deduplication check: Do not re-fire on page refresh for already tracked order
    if (trackedPurchaseRefs.has(orderId)) {
      console.info(`ℹ️ [TikTok Pixel] Purchase ref ${orderId} already tracked in memory. Skipping duplicate.`);
      return;
    }

    try {
      const storedKey = `tt_purchase_${orderId}`;
      if (localStorage.getItem(storedKey)) {
        console.info(`ℹ️ [TikTok Pixel] Purchase ref ${orderId} already tracked in storage. Skipping duplicate.`);
        return;
      }
      localStorage.setItem(storedKey, new Date().toISOString());
    } catch {
      // Storage access safety
    }

    trackedPurchaseRefs.add(orderId);

    if (window.ttq && typeof window.ttq.track === 'function') {
      window.ttq.track('Purchase', {
        value: params.value,
        currency: params.currency || 'USD',
        order_id: orderId,
        content_id: params.content_id || 'pro_subscription',
        content_name: params.content_name || 'InvoiceFlow Plan Subscription',
        content_type: params.content_type || 'product',
      });
      console.info(`💰 [TikTok Pixel] Purchase event tracked: $${params.value} ${params.currency} (Order Ref: ${orderId})`);
    }
  } catch (error) {
    console.warn('⚠️ [TikTok Pixel] Safe Purchase error:', error);
  }
}
