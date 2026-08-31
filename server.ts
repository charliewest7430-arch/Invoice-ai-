import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

function sanitizeSupabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url) return undefined;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  url = url.replace(/\/(rest|auth|storage|graphql)(\/v[0-9]+)?(\/.*)?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

// Initialize Server-Side Supabase Client (prefers service role key for webhook/admin operations, falls back to anon key)
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.trim().replace(/^["']|["']$/g, '') : undefined;
const supabaseAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!.trim().replace(/^["']|["']$/g, '') : undefined;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  (supabaseServiceKey || supabaseAnonKey) &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  !supabaseUrl.includes('your-supabase-project')
);

const serverSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey || supabaseAnonKey!)
  : null;

// Server middleware / helper to verify that a request has an authenticated session
async function verifyServerAuth(req: express.Request): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (serverSupabase && token) {
    try {
      const { data: { user }, error } = await serverSupabase.auth.getUser(token);
      if (error || !user) {
        return { authenticated: false, error: 'Invalid or expired authentication session. Please sign in to upgrade.' };
      }
      return { authenticated: true, user };
    } catch (e: any) {
      return { authenticated: false, error: e?.message || 'Authentication error' };
    }
  }

  // If Supabase is configured and no token was passed
  if (serverSupabase && !token) {
    return {
      authenticated: false,
      error: 'Authentication required. Please sign in or create an account to proceed with subscription upgrade.',
    };
  }

  // In unconfigured development environment, ensure demo requests or unauthenticated requests are blocked
  if (!token) {
    const isExplicitDemo = req.body?.metadata?.userId?.includes('demo') || req.body?.metadata?.isDemo || !req.body?.metadata?.userId;
    if (isExplicitDemo) {
      return {
        authenticated: false,
        error: 'Authentication required. Please sign in or create an account to proceed with subscription upgrade.',
      };
    }
  }

  return { authenticated: true };
}

app.use(express.json());

// Normalize Netlify serverless function paths (e.g., /.netlify/functions/api/* -> /api/*)
app.use((req, res, next) => {
  if (req.url && req.url.startsWith('/.netlify/functions/api')) {
    const stripped = req.url.replace(/^\/\.netlify\/functions\/api/, '');
    req.url = stripped.startsWith('/api') ? stripped : '/api' + (stripped.startsWith('/') ? stripped : '/' + stripped);
  }
  next();
});

// Enable CORS middleware for all endpoints and preflight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Structured AI error classification
export type AiErrorType =
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'rate_limit_exceeded'
  | 'service_unavailable'
  | 'network_error'
  | 'safety_blocked'
  | 'model_not_found'
  | 'generic_error';

export interface ClassifiedAiError {
  statusCode: number;
  errorType: AiErrorType;
  title: string;
  message: string;
  suggestion: string;
  retryable: boolean;
}

// Helper to parse and classify Gemini API errors into clear, actionable, structured messages
const parseGeminiError = (error: any): ClassifiedAiError => {
  const errMsg = error?.message || (typeof error === 'string' ? error : 'Unknown AI error');
  const errStr = `${JSON.stringify(error)} ${errMsg}`.toLowerCase();

  if (
    errStr.includes('api_key_invalid') ||
    errStr.includes('api key not valid') ||
    errStr.includes('unregistered callers') ||
    errStr.includes('permissiondenied') ||
    errStr.includes('permission_denied') ||
    (errStr.includes('400') && errStr.includes('api key')) ||
    (errStr.includes('403') && errStr.includes('api key'))
  ) {
    return {
      statusCode: 401,
      errorType: 'invalid_api_key',
      title: 'Invalid Gemini API Key',
      message: 'The configured Gemini API key is invalid, unauthenticated, or has expired.',
      suggestion: 'Please verify or generate a new key and update GEMINI_API_KEY in the Settings > Secrets panel.',
      retryable: false,
    };
  }

  if (
    errStr.includes('resource_exhausted') ||
    errStr.includes('429') ||
    errStr.includes('quota exceeded') ||
    errStr.includes('rate limit') ||
    errStr.includes('too many requests')
  ) {
    return {
      statusCode: 429,
      errorType: 'rate_limit_exceeded',
      title: 'Rate Limit / Quota Exceeded',
      message: 'The Gemini API request rate limit or token quota has been exceeded for this project.',
      suggestion: 'Please wait 10–30 seconds before retrying your prompt.',
      retryable: true,
    };
  }

  if (
    errStr.includes('503') ||
    errStr.includes('unavailable') ||
    errStr.includes('high demand') ||
    errStr.includes('overloaded') ||
    errStr.includes('service unavailable')
  ) {
    return {
      statusCode: 503,
      errorType: 'service_unavailable',
      title: 'AI Service Temporarily Unavailable',
      message: 'Google Gemini servers are currently experiencing high traffic or temporary load spikes.',
      suggestion: 'Your request was not completed. Please try again in a few moments.',
      retryable: true,
    };
  }

  if (
    errStr.includes('not found') ||
    errStr.includes('404') ||
    errStr.includes('is not found for api version') ||
    errStr.includes('unsupported')
  ) {
    return {
      statusCode: 404,
      errorType: 'model_not_found',
      title: 'AI Model Unavailable',
      message: 'The requested Gemini model version is not available or is unsupported.',
      suggestion: 'Please verify the model configuration in the server settings.',
      retryable: false,
    };
  }

  if (
    errStr.includes('safety') ||
    errStr.includes('blocked') ||
    errStr.includes('harm_category') ||
    errStr.includes('safety_rating')
  ) {
    return {
      statusCode: 400,
      errorType: 'safety_blocked',
      title: 'Content Safety Filter Triggered',
      message: 'The request or response was flagged by Gemini content safety filters.',
      suggestion: 'Please revise or rephrase your input to conform with standard safety policies.',
      retryable: false,
    };
  }

  if (
    errStr.includes('fetch failed') ||
    errStr.includes('econnrefused') ||
    errStr.includes('etimedout') ||
    errStr.includes('enotfound') ||
    errStr.includes('network error') ||
    errStr.includes('socket hang up')
  ) {
    return {
      statusCode: 503,
      errorType: 'network_error',
      title: 'Network Connection Error',
      message: 'A network communication error occurred between the server and Google Gemini API.',
      suggestion: 'Please check server network connectivity and retry your request.',
      retryable: true,
    };
  }

  return {
    statusCode: 500,
    errorType: 'generic_error',
    title: 'AI Request Failed',
    message: errMsg || 'An unexpected error occurred while communicating with Gemini AI.',
    suggestion: 'Please review your input and try again.',
    retryable: true,
  };
};

// Multi-model resilient generator with automatic fallback on 503 high demand or quota limits
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];

const generateContentWithFallback = async (
  ai: GoogleGenAI,
  requestParams: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'> & { model?: string }
) => {
  const primary = requestParams.model || 'gemini-3.5-flash';
  const modelsToTry = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  let lastError: any;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...requestParams,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errStr = `${err?.message || ''} ${JSON.stringify(err)}`.toLowerCase();
      const isTransientOrQuota =
        errStr.includes('503') ||
        errStr.includes('unavailable') ||
        errStr.includes('high demand') ||
        errStr.includes('overloaded') ||
        errStr.includes('resource_exhausted') ||
        errStr.includes('429') ||
        errStr.includes('quota') ||
        errStr.includes('404') ||
        errStr.includes('not found') ||
        errStr.includes('fetch failed') ||
        errStr.includes('econnreset');

      if (isTransientOrQuota) {
        console.warn(`[Gemini Resiliency] Model ${model} encountered transient condition (${err?.message || '503/429/404'}). Falling back to next available model...`);
        continue;
      }
      // If non-transient security or policy error, throw immediately
      throw err;
    }
  }
  throw lastError;
};

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * AI Endpoint 1: Generate Invoice from text description
 */
app.post('/api/ai/generate-invoice', async (req, res) => {
  try {
    const { prompt, defaultCurrency = 'USD', clients = [] } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    
    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'Missing Gemini API key. Please configure GEMINI_API_KEY in the Settings > Secrets panel.',
        errorType: 'missing_api_key',
        title: 'Gemini API Key Required',
        message: 'No Gemini API key was detected on the server.',
        suggestion: 'Please configure GEMINI_API_KEY in the Settings > Secrets panel to enable AI invoice generation.',
        retryable: false,
      });
    }

    const clientListStr = clients.map((c: any) => `- ${c.name} (${c.email || 'no email'}, ${c.company || 'N/A'})`).join('\n');

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: `Parse the following user prompt and extract or generate a complete, structured professional invoice object.
User Prompt: "${prompt}"
Default Currency: ${defaultCurrency}
Existing Clients:
${clientListStr || 'None'}

Rules:
1. Extract or intelligently deduce item descriptions, quantities, unit prices, tax rates, and discounts.
2. If client name is mentioned and matches existing client, use that. Otherwise create/use provided client name.
3. Calculate line item amounts properly (quantity * unitPrice).
4. Issue date should be today (${new Date().toISOString().split('T')[0]}), due date 14 days later unless specified.
`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            clientEmail: { type: Type.STRING },
            clientCompany: { type: Type.STRING },
            currency: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                },
                required: ['description', 'quantity', 'unitPrice', 'amount'],
              },
            },
            taxRate: { type: Type.NUMBER },
            discount: { type: Type.NUMBER },
            notes: { type: Type.STRING },
            terms: { type: Type.STRING },
          },
          required: ['clientName', 'currency', 'issueDate', 'dueDate', 'items', 'taxRate', 'discount'],
        },
      },
    });

    const invoiceData = JSON.parse(response.text || '{}');
    return res.json({ success: true, invoice: invoiceData });
  } catch (error: any) {
    console.error('AI Generate Invoice Error:', error);
    const classified = parseGeminiError(error);
    return res.status(classified.statusCode).json({
      success: false,
      error: classified.message,
      errorType: classified.errorType,
      title: classified.title,
      message: classified.message,
      suggestion: classified.suggestion,
      retryable: classified.retryable,
    });
  }
});

/**
 * AI Endpoint 2: AI Business & Invoicing Assistant Chat
 */
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, businessContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        success: false,
        error: 'Missing Gemini API key. Please configure GEMINI_API_KEY in the Settings > Secrets panel.',
        errorType: 'missing_api_key',
        title: 'Gemini API Key Required',
        message: 'No Gemini API key was detected on the server.',
        suggestion: 'Please configure GEMINI_API_KEY in the Settings > Secrets panel to enable AI Assistant chat.',
        retryable: false,
      });
    }

    const systemInstruction = `You are InvoiceFlow AI, an expert corporate invoicing, tax, and financial assistant for US, UK, EU, and global SMBs.
Context about current user's business:
Name: ${businessContext?.name || 'My Business'}
Currency: ${businessContext?.currency || 'USD'}
Unpaid Invoices Count: ${businessContext?.unpaidCount ?? 0}
Overdue Amount: ${businessContext?.overdueTotal ?? 0}
Monthly Revenue: ${businessContext?.monthlyRevenue ?? 0}

Help the user draft invoices, analyze revenue trends, write polite payment reminder emails, explain tax requirements (like VAT or Sales Tax), or resolve billing queries cleanly, accurately, and professionally.`;

    const formattedMessages = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: formattedMessages,
      config: {
        systemInstruction,
      },
    });

    return res.json({ success: true, reply: response.text || '' });
  } catch (error: any) {
    console.error('AI Assistant Error:', error);
    const classified = parseGeminiError(error);
    return res.status(classified.statusCode).json({
      success: false,
      error: classified.message,
      errorType: classified.errorType,
      title: classified.title,
      message: classified.message,
      suggestion: classified.suggestion,
      retryable: classified.retryable,
    });
  }
});

/**
 * Flutterwave Pricing Constants
 */
const FLW_PRO_PRICE = 9.99;
const FLW_ENTERPRISE_PRICE = 15.99;

/**
 * Flutterwave Endpoint: Checkout Session Initialization
 * Creates a standard hosted payment link on Flutterwave V3.
 * Enforces server-side price integrity and handles 7-day free trial card authorization.
 */
app.post('/api/flutterwave/initialize', async (req, res) => {
  try {
    // Security check: Verify that user is authenticated before creating a subscription transaction
    const authCheck = await verifyServerAuth(req);
    if (!authCheck.authenticated) {
      console.warn(`🚨 [Flutterwave Init Server] Blocked unauthenticated checkout request: ${authCheck.error}`);
      return res.status(401).json({
        success: false,
        message: authCheck.error || 'Authentication required. Please sign in or create an account to upgrade.',
      });
    }

    const userId = authCheck.user?.id || req.body?.metadata?.userId || 'usr_session';
    const rawPlan = (req.body.plan || 'pro').toLowerCase();
    const plan: 'pro' | 'enterprise' = rawPlan === 'enterprise' ? 'enterprise' : 'pro';
    const mode = req.body.mode === 'trial' ? 'trial' : 'subscription';
    const isTrial = mode === 'trial';

    // Server-enforced pricing: NEVER trust frontend amount
    const fullPlanPrice = plan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;
    const planTitle = plan === 'enterprise' ? 'Enterprise' : 'Pro';

    // For 7-day trial authorization: nominal $1.00 card verification authorization to tokenize card
    // For direct subscription: full plan price ($9.99 or $15.99)
    const price = isTrial ? 1.0 : fullPlanPrice;

    const { email, name, callbackUrl, metadata = {} } = req.body;
    const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    // Strict validation: Require Flutterwave secret key
    if (!flwSecretKey || !flwSecretKey.trim()) {
      console.error('❌ [Flutterwave Init Server] FLUTTERWAVE_SECRET_KEY is missing in server environment.');
      return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Flutterwave secret key is not configured on the server. Please set FLUTTERWAVE_SECRET_KEY in environment variables.',
      });
    }

    // Check if user already used a trial
    if (isTrial && serverSupabase && userId) {
      try {
        const { data: existingSub } = await serverSupabase
          .from('subscriptions')
          .select('trial_started_at, trial_used')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingSub && (existingSub.trial_started_at || existingSub.trial_used)) {
          return res.status(400).json({
            success: false,
            message: 'A 7-day free trial has already been used on this account. Please select a plan to subscribe directly.',
          });
        }
      } catch (checkErr) {
        console.warn('⚠️ Supabase check trial error:', checkErr);
      }
    }

    // Sanitize Email
    const sanitizeEmail = (e: string) => {
      const trimmed = (e || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(trimmed) ? trimmed : (authCheck.user?.email || 'billing@business.com');
    };
    const validEmail = sanitizeEmail(email);
    const customerName = (name || authCheck.user?.user_metadata?.full_name || 'InvoiceFlow Subscriber').trim();

    // Generate unique transaction reference
    const prefix = isTrial ? 'FLW-INVF-TRL' : 'FLW-INVF-SUB';
    const uniqueTxRef = `${prefix}-${userId.slice(0, 8)}-${plan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    console.log(`💳 [Flutterwave Init Server] User: ${userId}, Plan: ${planTitle}, Mode: ${mode}, Amount: $${price} USD, Ref: ${uniqueTxRef}`);

    // If real Flutterwave secret key is configured, initialize with Flutterwave v3 API
    if (flwSecretKey && flwSecretKey.trim()) {
      const baseUrl = process.env.APP_URL || (req.headers.origin as string) || 'https://www.invoiceflowai.cloud';
      const redirectUrl = callbackUrl && typeof callbackUrl === 'string' && callbackUrl.startsWith('http')
        ? callbackUrl
        : `${baseUrl}/billing?flw_callback=1&plan=${plan}&mode=${mode}`;

      const title = isTrial
        ? `InvoiceFlow ${planTitle} 7-Day Free Trial Authorization`
        : `InvoiceFlow ${planTitle} Plan`;

      const description = isTrial
        ? `Authorize card for 7-day free trial. Then $${fullPlanPrice}/month automatically. Cancel anytime before trial ends.`
        : `InvoiceFlow ${planTitle} Monthly Subscription ($${fullPlanPrice}/month)`;

      const payload = {
        tx_ref: uniqueTxRef,
        amount: price,
        currency: 'USD',
        redirect_url: redirectUrl,
        customer: {
          email: validEmail,
          name: customerName,
        },
        customizations: {
          title,
          description,
          logo: `${baseUrl}/favicon.ico`,
        },
        meta: {
          user_id: userId,
          plan,
          mode,
          is_trial: isTrial,
          full_plan_price: fullPlanPrice,
          price,
          ...metadata,
        },
      };

      const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await flwRes.json().catch(() => ({}));
      const hostedCheckoutUrl = responseData.data?.link || responseData.link;

      if (flwRes.ok && hostedCheckoutUrl) {
        return res.json({
          success: true,
          status: 'success',
          link: hostedCheckoutUrl,
          data: {
            link: hostedCheckoutUrl,
            tx_ref: uniqueTxRef,
            plan,
            mode,
            amount: price,
            currency: 'USD',
          },
          tx_ref: uniqueTxRef,
          plan,
          mode,
          amount: price,
          currency: 'USD',
          flutterwaveResponse: responseData,
        });
      } else {
        const errorMsg = responseData?.message || responseData?.error || 'Flutterwave checkout initialization failed.';

        return res.status(flwRes.ok ? 400 : flwRes.status).json({
          success: false,
          status: 'error',
          message: errorMsg,
          error: errorMsg,
          data: responseData?.data || null,
        });
      }
    }

    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Flutterwave secret key is not configured on the server. Please set FLUTTERWAVE_SECRET_KEY.',
    });
  } catch (error: any) {
    console.error('❌ Flutterwave Init Server Exception:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server exception during Flutterwave initialization',
    });
  }
});

/**
 * Flutterwave Endpoint: Transaction Verification
 * Verifies transaction with Flutterwave API V3, extracts card token,
 * sets up 7-day trial or active subscription in Supabase.
 */
app.post('/api/flutterwave/verify', async (req, res) => {
  try {
    const authCheck = await verifyServerAuth(req);
    const { transaction_id, tx_ref, plan = 'pro', mode, simulated } = req.body;
    const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const userId = authCheck.user?.id || req.body?.userId;

    console.log(`🔍 [Flutterwave Verify Server] Verifying Transaction. ID: ${transaction_id}, Ref: ${tx_ref}, Plan: ${plan}, Mode: ${mode}`);

    // If real Flutterwave secret key is configured and not explicitly simulated
    if (flwSecretKey && flwSecretKey.trim() && !simulated) {
      let verifyUrl = '';
      if (transaction_id) {
        verifyUrl = `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`;
      } else if (tx_ref) {
        verifyUrl = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(tx_ref)}`;
      } else {
        return res.status(400).json({
          status: 'failed',
          message: 'Either transaction_id or tx_ref is required for payment verification.',
        });
      }

      const flwRes = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${flwSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await flwRes.json();
      console.log(`🔍 [Flutterwave Verify Response - Status ${flwRes.status}]:`, JSON.stringify(responseData, null, 2));

      if (flwRes.ok && responseData.status === 'success' && responseData.data?.status === 'successful') {
        const txData = responseData.data;
        const verifiedPlan = (txData.meta?.plan || plan || 'pro').toLowerCase() as 'pro' | 'enterprise';
        const isTrial = txData.meta?.mode === 'trial' || txData.meta?.is_trial === true || mode === 'trial' || (tx_ref && tx_ref.includes('-TRL-'));

        // Extract card token and details from Flutterwave verification
        const cardToken = txData.card?.token || txData.authorization?.token || txData.payment_options?.token;
        const cardLast4 = txData.card?.last_4digits || txData.card?.last4 || null;
        const cardBrand = txData.card?.issuer || txData.card?.type || null;
        const cardExp = txData.card?.expiry || null;

        // Update database if Supabase is connected
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
                user_id: userId,
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
                user_id: userId,
                plan: verifiedPlan,
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
                user_id: userId,
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
            console.warn('⚠️ Error updating database records on verification:', dbErr);
          }
        }

        return res.json({
          status: 'success',
          message: isTrial
            ? 'Payment card authorized successfully. 7-day free trial is now active.'
            : 'Payment verified successfully via Flutterwave API',
          data: txData,
        });
      } else {
        const errorMsg = responseData?.message || 'Flutterwave payment verification failed or payment was unsuccessful.';
        const isKeyIssue = flwRes.status === 401 || flwRes.status === 403 || errorMsg.includes('Invalid public key') || errorMsg.includes('expired') || errorMsg.includes('Unauthorized');
        const isDevOrPreview = process.env.NODE_ENV !== 'production' || !process.env.NETLIFY;

        if (isKeyIssue && isDevOrPreview) {
          // Key rejected on live gateway, proceed with Dev Simulation verification in preview
        } else {
          return res.status(400).json({
            status: 'failed',
            message: errorMsg,
            data: responseData.data,
          });
        }
      }
    }

    // Dev Simulation Verified Response
    const verifiedPlan = plan === 'enterprise' ? 'enterprise' : 'pro';
    const isTrial = mode === 'trial' || (tx_ref && tx_ref.includes('-TRL-'));
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
        console.warn('⚠️ Dev mode database record notice:', dbErr);
      }
    }

    return res.json({
      status: 'success',
      message: isTrial
        ? 'Payment card authorized successfully. 7-day free trial active (Dev Simulation).'
        : 'Payment verified successfully (Development Simulation)',
      data: {
        id: `FLW_TX_${Date.now()}`,
        tx_ref: mockRef,
        flw_ref: `FLW-REF-${Date.now()}`,
        status: 'successful',
        amount: price,
        currency: 'USD',
        payment_type: 'card',
        created_at: new Date().toISOString(),
        meta: { plan: verifiedPlan, user_id: userId, mode: isTrial ? 'trial' : 'subscription' },
      },
    });
  } catch (error: any) {
    console.error('❌ Flutterwave Verify Server Error:', error);
    return res.status(500).json({ status: 'failed', message: error.message || 'Server error during verification' });
  }
});

/**
 * Flutterwave Webhook Endpoint
 * 
 * Secure LIVE Webhook endpoint for Flutterwave:
 * 1. Reads 'verif-hash' from headers.
 * 2. Validates against FLUTTERWAVE_SECRET_HASH (rejects with 401 if invalid).
 * 3. Safely logs webhook event without sensitive data.
 * 4. Identifies user and plan from transaction metadata or customer profile.
 * 5. Idempotently checks if payment reference / ID was already processed to prevent duplicate upgrades.
 * 6. Updates user subscription and records verified payment in Supabase.
 * 7. Returns 200 OK immediately for valid webhooks.
 */
app.post('/api/flutterwave/webhook', async (req, res) => {
  try {
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = (req.headers['verif-hash'] || req.headers['verif_hash'] || req.headers['x-flutterwave-signature']) as string | undefined;

    // 1. Verify webhook signature
    if (secretHash) {
      if (!signature || signature !== secretHash) {
        console.warn('🚨 [Flutterwave Webhook] 401 Unauthorized: Signature mismatch or missing verif-hash header.');
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or missing Flutterwave webhook signature',
        });
      }
    } else {
      console.warn('⚠️ [Flutterwave Webhook] Notice: FLUTTERWAVE_SECRET_HASH is not configured in server environment.');
    }

    const payload = req.body || {};
    const txData = payload.data || payload;

    // 2. Safe Logging (masking sensitive data)
    const safeLogSummary = {
      event: payload.event || payload['event.type'] || 'unknown',
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
    console.log('🔔 [Flutterwave Webhook Received]:', JSON.stringify(safeLogSummary));

    // 3. Detect successful payment event
    const isSuccessful =
      (payload.event === 'charge.completed' || payload.status === 'successful') &&
      (txData?.status === 'successful' || payload.status === 'successful');

    if (!isSuccessful) {
      console.log(`ℹ️ [Flutterwave Webhook] Ignored non-payment event: ${payload.event || txData?.status}`);
      return res.status(200).json({ status: 'ignored', message: 'Event does not require subscription activation' });
    }

    const txRef = txData.tx_ref;
    const flwTransactionId = String(txData.id || txData.flw_ref || '');
    const amount = Number(txData.amount || 0);
    const currency = (txData.currency || 'USD').toUpperCase();
    const customerEmail = txData.customer?.email?.toLowerCase().trim();

    // Extract card token and details
    const cardToken = txData.card?.token || txData.authorization?.token || txData.payment_options?.token;
    const cardLast4 = txData.card?.last_4digits || txData.card?.last4 || null;
    const cardBrand = txData.card?.issuer || txData.card?.type || null;
    const cardExp = txData.card?.expiry || null;

    // 4. Resolve Plan & User ID
    let rawPlan = (txData.meta?.plan || '').toLowerCase();
    if (!rawPlan) {
      rawPlan = amount >= 15 ? 'enterprise' : 'pro';
    }
    const targetPlan: 'pro' | 'enterprise' = rawPlan === 'enterprise' ? 'enterprise' : 'pro';
    let targetUserId = txData.meta?.user_id || txData.meta?.userId;
    const isTrial = txData.meta?.mode === 'trial' || txData.meta?.is_trial === true || (txRef && txRef.includes('-TRL-'));

    if (serverSupabase) {
      // If user_id wasn't in metadata, look up user by email in profiles / subscriptions
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
          console.warn('⚠️ [Flutterwave Webhook] Error resolving user by email:', lookupErr);
        }
      }

      // 5. Idempotency Check: Prevent duplicate webhook events from processing twice
      if (txRef || flwTransactionId) {
        try {
          const query = serverSupabase.from('payments').select('id, status, flutterwave_ref, flutterwave_transaction_id');
          const conditions: string[] = [];
          if (txRef) conditions.push(`flutterwave_ref.eq.${txRef}`);
          if (flwTransactionId) conditions.push(`flutterwave_transaction_id.eq.${flwTransactionId}`);

          const { data: existingPayments } = await query.or(conditions.join(',')).limit(1);

          if (existingPayments && existingPayments.length > 0 && existingPayments[0].status === 'success') {
            console.log(`ℹ️ [Flutterwave Webhook] Idempotent delivery: Transaction ${txRef || flwTransactionId} has already been processed.`);
            return res.status(200).json({
              status: 'success',
              message: 'Transaction already processed (idempotent)',
            });
          }
        } catch (idempErr) {
          console.warn('⚠️ [Flutterwave Webhook] Idempotency lookup notice:', idempErr);
        }
      }

      // 6. Update User's InvoiceFlow Subscription in Supabase
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
              channel: txData.payment_type || 'card',
              notes: 'Card authorization for 7-day free trial',
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTransactionId,
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
              channel: txData.payment_type || 'card',
              notes: 'Monthly subscription payment',
              flutterwave_ref: txRef,
              flutterwave_transaction_id: flwTransactionId,
              payment_provider: 'flutterwave',
              paid_at: txData.created_at || new Date().toISOString(),
            }]);
          }

          // Record activity log
          try {
            await serverSupabase.from('activities').insert([{
              user_id: targetUserId,
              type: 'subscription_upgraded',
              description: isTrial
                ? `7-Day Free Trial activated for ${targetPlan.toUpperCase()} plan via Flutterwave card authorization`
                : `Active subscription to ${targetPlan.toUpperCase()} plan activated via Flutterwave ($${amount.toFixed(2)} ${currency})`,
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

          console.log(`✅ [Flutterwave Webhook] Successfully processed subscription for user ${targetUserId}`);
        } catch (dbErr: any) {
          console.error('❌ [Flutterwave Webhook] Database update error:', dbErr?.message || dbErr);
        }
      } else {
        console.warn(`⚠️ [Flutterwave Webhook] Received payment for ref ${txRef} but could not resolve user ID.`);
      }
    }

    // 7. Acknowledge receipt with HTTP 200
    return res.status(200).json({
      status: 'success',
      message: 'Flutterwave webhook received and processed successfully',
    });
  } catch (err: any) {
    console.error('❌ [Flutterwave Webhook] Internal handler error:', err);
    return res.status(200).json({
      status: 'error',
      message: err.message || 'Webhook processing error',
    });
  }
});

/**
 * Subscription Cancellation Endpoint
 * Cancels active subscription or trial before automatic billing.
 */
app.post('/api/billing/cancel', async (req, res) => {
  try {
    const authCheck = await verifyServerAuth(req);
    if (!authCheck.authenticated || !authCheck.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to cancel subscription.',
      });
    }

    const userId = authCheck.user.id;
    if (!serverSupabase) {
      return res.json({
        success: true,
        message: 'Subscription cancelled successfully (Dev Mode).',
        subscription: {
          user_id: userId,
          plan: 'free',
          status: 'canceled',
          cancelled_at: new Date().toISOString(),
        },
      });
    }

    const { data: existingSub } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingSub) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found.',
      });
    }

    const cancelledAt = new Date().toISOString();
    const updatedStatus = 'canceled';

    const { data: updatedSub, error: updateErr } = await serverSupabase
      .from('subscriptions')
      .update({
        status: updatedStatus,
        cancelled_at: cancelledAt,
        next_billing_date: null,
        updated_at: cancelledAt,
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error('❌ Error updating cancelled subscription:', updateErr);
      return res.status(500).json({
        success: false,
        message: updateErr.message || 'Failed to cancel subscription in database',
      });
    }

    // Log activity
    try {
      await serverSupabase.from('activities').insert([{
        user_id: userId,
        type: 'subscription_canceled',
        description: `Subscription to ${existingSub.plan?.toUpperCase() || 'Pro'} cancelled by user. Automatic billing stopped.`,
        metadata: {
          previous_plan: existingSub.plan,
          previous_status: existingSub.status,
          cancelled_at: cancelledAt,
        },
      }]);
    } catch {
      // Non-blocking
    }

    return res.json({
      success: true,
      message: 'Your subscription / trial has been cancelled. No further automatic charges will occur.',
      subscription: updatedSub || {
        ...existingSub,
        status: updatedStatus,
        cancelled_at: cancelledAt,
        next_billing_date: null,
      },
    });
  } catch (error: any) {
    console.error('❌ Cancel Subscription Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while cancelling subscription',
    });
  }
});

/**
 * Cron Authentication Validator
 * Strictly validates Authorization: Bearer <CRON_SECRET>
 * No query parameters or secondary headers are allowed.
 */
function validateCronAuthorization(req: express.Request): { authorized: boolean; reason?: string } {
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

/**
 * Helper function: Process due recurring subscriptions and trial conversions
 * - Uses Database-Level Atomic Claim Locks (billing_lock_until)
 * - Deterministic Cycle Key & Unique Database Constraints (public.billing_cycles & public.payments)
 * - Uses Flutterwave V3 Tokenized Charges endpoint (POST /v3/tokenized-charges)
 */
async function processDueSubscriptions(): Promise<{ processed: number; succeeded: number; failed: number; skipped: number }> {
  if (!serverSupabase) return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };

  const flwSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  const now = new Date();
  const nowIso = now.toISOString();
  const lockUntilIso = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // 1. Query candidate subscriptions
    // - status in ('trialing', 'active', 'past_due')
    // - cancelled_at IS NULL (cancelled trials/subscriptions are NEVER charged)
    // - card_token IS NOT NULL
    const { data: candidateSubs, error: fetchErr } = await serverSupabase
      .from('subscriptions')
      .select('*')
      .is('cancelled_at', null)
      .not('card_token', 'is', null)
      .in('status', ['trialing', 'active', 'past_due']);

    if (fetchErr || !candidateSubs) {
      console.warn('⚠️ [Recurring Billing] Error fetching candidate subscriptions:', fetchErr?.message);
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    // Filter due subscriptions:
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
      // Calculate deterministic cycle key for this period
      const isTrial = sub.status === 'trialing';
      const targetDate = isTrial ? (sub.trial_ends_at || nowIso) : (sub.next_billing_date || sub.current_period_end || nowIso);
      const dateKey = targetDate.split('T')[0];
      const cycleKey = `${sub.user_id}_${isTrial ? 'trial' : 'renew'}_${dateKey}`;

      // 2. Database-level check: Has this cycle already been successfully completed?
      try {
        const { data: existingCycle } = await serverSupabase
          .from('billing_cycles')
          .select('*')
          .eq('user_id', sub.user_id)
          .eq('cycle_key', cycleKey)
          .maybeSingle();

        if (existingCycle && existingCycle.status === 'completed') {
          console.log(`ℹ️ [Recurring Billing] Cycle ${cycleKey} was already completed. Advancing subscription date.`);
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
          console.log(`ℹ️ [Recurring Billing] Cycle ${cycleKey} is currently being processed by another worker instance. Skipping.`);
          skipped++;
          continue;
        }
      } catch (checkErr) {
        console.warn('⚠️ [Billing Cycle Check Exception]:', checkErr);
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
        console.log(`ℹ️ [Recurring Billing] Could not acquire atomic lock for user ${sub.user_id} (claimed by parallel worker).`);
        skipped++;
        continue;
      }

      // 4. Record/claim cycle attempt in billing_cycles table
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

      // Lookup customer profile for receipts
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

      console.log(`⚡ [Recurring Billing Worker] Executing charge for user ${sub.user_id} ($${price} USD, Plan: ${plan}, Ref: ${txRef})...`);

      if (flwSecretKey && flwSecretKey.trim()) {
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
          console.log(`⚡ [Recurring Billing Response]:`, JSON.stringify(chargeData));

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

            // Record successful payment (idempotent upsert)
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
            console.warn(`🚨 [Recurring Billing] Charge declined for user ${sub.user_id}:`, errMsg);

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
          console.error(`❌ [Recurring Billing Network Exception]:`, callErr);
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
  } catch (err: any) {
    console.error('❌ Error processing due recurring subscriptions:', err);
  }

  return { processed, succeeded, failed, skipped };
}

/**
 * Automated Billing Cron Endpoint
 * Can be triggered via Vercel Cron, external monitoring, or admin worker
 */
app.all(['/api/billing/cron', '/api/billing/process-due-subscriptions'], async (req, res) => {
  try {
    const authResult = validateCronAuthorization(req);
    if (!authResult.authorized) {
      return res.status(401).json({
        status: 'error',
        message: authResult.reason || 'Unauthorized cron invocation',
      });
    }

    console.log('⏰ [Cron] Running automated recurring billing & trial expiration worker...');
    const result = await processDueSubscriptions();
    return res.json({
      status: 'success',
      message: 'Automated recurring billing cycle processed successfully',
      result,
    });
  } catch (err: any) {
    console.error('❌ [Cron Error]:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// Periodic background worker to check due subscriptions (runs every 30 minutes in server runtime)
setInterval(() => {
  processDueSubscriptions().catch((e) => console.warn('Background billing worker notice:', e));
}, 30 * 60 * 1000);

/**
 * Email Service API Endpoint
 */
app.post('/api/email/send-invoice', async (req, res) => {
  try {
    const { to, invoiceNumber, amount, currency, businessName, clientName, dueDate, issueDate, status, paymentLink, customNote } = req.body;
    
    // 1. Validate recipient email
    if (!to || typeof to !== 'string' || !to.trim() || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'This client does not have an email address. Add an email address before sending the invoice.',
      });
    }

    const cleanEmail = to.trim();
    console.log(`📧 Express Backend: Triggering email for Invoice #${invoiceNumber} to ${cleanEmail}`);

    const resendApiKey = process.env.RESEND_API_KEY;

    // 2. If Resend API Key is present, send real email via Resend
    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'InvoiceFlow <no-reply@invoiceflowai.cloud>',
          to: [cleanEmail],
          subject: `Invoice ${invoiceNumber} from ${businessName || 'InvoiceFlow AI'}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Invoice ${invoiceNumber}</h2>
              <p style="color: #475569; font-size: 14px;">Dear ${clientName || 'Valued Client'},</p>
              <p style="color: #475569; font-size: 14px;">Please find the details below for invoice <strong>${invoiceNumber}</strong> issued by <strong>${businessName || 'Business'}</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
                <p style="margin: 6px 0; color: #334155;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p style="margin: 6px 0; color: #334155;"><strong>Total Amount Due:</strong> ${currency || '$'} ${Number(amount || 0).toFixed(2)}</p>
                <p style="margin: 6px 0; color: #334155;"><strong>Issue Date:</strong> ${issueDate || 'N/A'}</p>
                <p style="margin: 6px 0; color: #334155;"><strong>Due Date:</strong> ${dueDate || 'N/A'}</p>
                <p style="margin: 6px 0; color: #334155;"><strong>Status:</strong> ${(status || 'SENT').toUpperCase()}</p>
              </div>

              ${customNote ? `<div style="padding: 12px 16px; background-color: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0; color: #334155; font-style: italic; font-size: 13px;">${customNote}</p></div>` : ''}

              ${paymentLink ? `<div style="text-align: center; margin: 28px 0;"><a href="${paymentLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">View & Pay Invoice</a></div>` : ''}
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Sent securely via InvoiceFlow AI</p>
            </div>
          `,
        }),
      });

      const resendData = await resendRes.json();
      if (resendRes.ok && resendData.id) {
        return res.json({
          success: true,
          messageId: resendData.id,
          provider: 'Resend',
          message: 'Invoice sent successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: resendData.message || 'Failed to send invoice email via Resend',
        });
      }
    }

    // 3. If no email provider is configured, do NOT fake email delivery
    return res.status(400).json({
      success: false,
      configured: false,
      message: 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.',
    });
  } catch (err: any) {
    console.error('❌ Send Email Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server email delivery exception' });
  }
});

/**
 * Receipt Email Service API Endpoint
 */
app.post('/api/email/send-receipt', async (req, res) => {
  try {
    const {
      to,
      receiptNumber,
      invoiceNumber,
      amount,
      currency,
      businessName,
      clientName,
      paymentDate,
      paymentMethod,
      notes,
    } = req.body;

    if (!to || typeof to !== 'string' || !to.trim() || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid client email address is required to send receipt.',
      });
    }

    const cleanEmail = to.trim();
    console.log(`📧 Express Backend: Triggering Receipt Email #${receiptNumber} to ${cleanEmail}`);

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US');
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'InvoiceFlow <no-reply@invoiceflowai.cloud>',
          to: [cleanEmail],
          subject: `Payment Receipt ${receiptNumber} for Invoice ${invoiceNumber}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; padding: 6px 14px; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                  ✓ Payment Received & Settled
                </span>
                <h2 style="color: #0f172a; margin: 12px 0 4px; font-size: 24px; font-weight: 800;">Official Payment Receipt</h2>
                <p style="color: #64748b; font-size: 13px; margin: 0;">Receipt #: <strong>${receiptNumber}</strong></p>
              </div>

              <p style="color: #475569; font-size: 14px;">Dear ${clientName || 'Valued Customer'},</p>
              <p style="color: #475569; font-size: 14px;">Thank you for your prompt payment! This email serves as your official payment receipt for invoice <strong>${invoiceNumber}</strong> issued by <strong>${businessName || 'Our Business'}</strong>.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Receipt Number:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${receiptNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Invoice Reference:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Payment Date:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Payment Method:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right;">${paymentMethod || 'Paystack'}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0 4px; font-weight: bold; color: #0f172a; font-size: 15px;">Amount Paid:</td>
                    <td style="padding: 10px 0 4px; font-weight: 800; color: #059669; font-size: 16px; text-align: right;">${currency || '$'} ${Number(amount || 0).toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              ${notes ? `<div style="padding: 12px 16px; background-color: #f1f5f9; border-left: 4px solid #10b981; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0; color: #334155; font-size: 13px;"><strong>Note:</strong> ${notes}</p></div>` : ''}

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Issued securely via InvoiceFlow AI</p>
            </div>
          `,
        }),
      });

      const resendData = await resendRes.json();
      if (resendRes.ok && resendData.id) {
        return res.json({
          success: true,
          messageId: resendData.id,
          provider: 'Resend',
          message: 'Receipt sent successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: resendData.message || 'Failed to send receipt email via Resend',
        });
      }
    }

    return res.status(400).json({
      success: false,
      configured: false,
      message: 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.',
    });
  } catch (err: any) {
    console.error('❌ Send Receipt Email Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server receipt email delivery exception' });
  }
});

// Idempotency tracking cache for welcome emails (in-memory deduplication)
const sentWelcomeEmailsCache = new Map<string, number>();

/**
 * Welcome Email Service API Endpoint (Resend)
 */
app.post('/api/email/welcome', async (req, res) => {
  try {
    const { email, name, userId, businessName } = req.body;
    
    // 1. Syntax validation & bounce protection
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or malformed recipient email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'there';
    const cacheKey = userId ? `uid_${userId}` : `em_${cleanEmail}`;

    // 2. Idempotency check: prevent duplicate welcome emails
    const existingTimestamp = sentWelcomeEmailsCache.get(cacheKey) || sentWelcomeEmailsCache.get(`em_${cleanEmail}`);
    if (existingTimestamp && Date.now() - existingTimestamp < 30 * 24 * 60 * 60 * 1000) {
      console.log(`ℹ️ Welcome email duplicate suppressed for ${cleanEmail} (sent recently)`);
      return res.json({
        success: true,
        duplicate: true,
        message: 'Welcome email already delivered for this user account.',
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY environment variable is not configured. Welcome email delivery skipped.');
      return res.json({
        success: false,
        configured: false,
        message: 'RESEND_API_KEY is not configured on the server.',
      });
    }

    // Determine production / application URL
    const appOrigin = process.env.APP_URL || (req.headers.origin ? String(req.headers.origin) : 'https://invoiceflow.app');
    const senderFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'InvoiceFlow <no-reply@invoiceflowai.cloud>';

    console.log(`📧 Express Backend: Dispatching Welcome Email to ${cleanEmail} via Resend...`);

    const textContent = `Hi ${cleanName},

Welcome to InvoiceFlow! 🎉

Your account has been successfully created.

InvoiceFlow helps you create professional invoices, manage your business billing, track expenses, send payment reminders, and stay organized.

You can now log in and start using InvoiceFlow:
${appOrigin}

Thanks for choosing InvoiceFlow.
The InvoiceFlow Team
`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to InvoiceFlow</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header / Brand -->
                <tr>
                  <td style="padding: 32px 32px 24px; text-align: left; border-bottom: 1px solid #f1f5f9;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width: 38px; height: 38px; background-color: #2563eb; border-radius: 10px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: 800; font-size: 18px;">
                          IF
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">InvoiceFlow</span>
                          <span style="display: block; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Smart Billing Platform</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.65;">
                    <p style="margin: 0 0 16px; font-size: 15px; color: #334155;">Hi ${cleanName},</p>
                    
                    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                      Welcome to InvoiceFlow! 🎉
                    </h1>

                    <p style="margin: 0 0 16px; color: #334155;">
                      Your account has been successfully created.
                    </p>

                    <p style="margin: 0 0 20px; color: #334155;">
                      InvoiceFlow helps you create professional invoices, manage your business billing, track expenses, send payment reminders, and stay organized.
                    </p>

                    <p style="margin: 0 0 28px; color: #334155;">
                      You can now log in and start using InvoiceFlow.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                      <tr>
                        <td align="center">
                          <a href="${appOrigin}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);">
                            Open InvoiceFlow
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 28px 0 0; color: #475569; font-size: 14px; line-height: 1.6;">
                      Thanks for choosing InvoiceFlow.<br />
                      <strong style="color: #0f172a;">The InvoiceFlow Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                      This email was sent to <span style="font-weight: 600; color: #334155;">${cleanEmail}</span>.
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      © ${new Date().getFullYear()} InvoiceFlow AI. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderFrom,
        to: [cleanEmail],
        subject: 'Welcome to InvoiceFlow 🎉',
        text: textContent,
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json().catch(() => ({}));

    if (resendRes.ok && resendData.id) {
      // Record in cache to prevent duplicates
      sentWelcomeEmailsCache.set(cacheKey, Date.now());
      sentWelcomeEmailsCache.set(`em_${cleanEmail}`, Date.now());
      console.log(`✅ Welcome email dispatched successfully to ${cleanEmail}. Message ID: ${resendData.id}`);

      return res.json({
        success: true,
        messageId: resendData.id,
        provider: 'Resend',
        message: 'Welcome email delivered successfully',
      });
    } else {
      console.warn(`⚠️ Resend API responded with status ${resendRes.status}:`, resendData.message || 'Unknown issue');
      return res.status(200).json({
        success: false,
        configured: true,
        message: resendData.message || 'Failed to dispatch email via Resend',
      });
    }
  } catch (err: any) {
    console.error('Welcome email server exception:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: err?.message || 'Internal welcome email dispatch exception',
    });
  }
});

/**
 * Overdue Invoice Reminder - Manual Trigger Endpoint
 */
app.post('/api/reminders/send-manual', async (req, res) => {
  try {
    const {
      to,
      clientName,
      invoiceNumber,
      invoiceId,
      amount,
      currency,
      dueDate,
      daysOverdue,
      businessName,
      paymentLink,
      customMessage,
    } = req.body;

    if (!to || typeof to !== 'string' || !to.trim() || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'This client does not have an email address. Add an email address before sending reminder.',
      });
    }

    const cleanEmail = to.trim();
    console.log(`⏰ Express Backend: Sending Overdue Reminder for Invoice #${invoiceNumber} to ${cleanEmail}`);

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'InvoiceFlow <no-reply@invoiceflowai.cloud>',
          to: [cleanEmail],
          subject: `Payment Reminder: Invoice ${invoiceNumber} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'due soon'}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;">
                <span style="color: #dc2626; font-weight: bold; font-size: 13px;">⚠️ Overdue Payment Notice</span>
              </div>

              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Payment Reminder for Invoice ${invoiceNumber}</h2>
              <p style="color: #475569; font-size: 14px;">Dear ${clientName || 'Valued Client'},</p>
              <p style="color: #475569; font-size: 14px;">This is a friendly reminder that payment for invoice <strong>${invoiceNumber}</strong> issued by <strong>${businessName || 'Our Business'}</strong> was due on <strong>${dueDate || 'N/A'}</strong> (${daysOverdue} days ago).</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
                <p style="margin: 6px 0; color: #334155;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p style="margin: 6px 0; color: #334155;"><strong>Outstanding Balance:</strong> ${currency || '$'} ${Number(amount || 0).toFixed(2)}</p>
                <p style="margin: 6px 0; color: #dc2626;"><strong>Days Overdue:</strong> ${daysOverdue} days</p>
                <p style="margin: 6px 0; color: #334155;"><strong>Original Due Date:</strong> ${dueDate || 'N/A'}</p>
              </div>

              ${customMessage ? `<div style="padding: 12px 16px; background-color: #f1f5f9; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0; color: #334155; font-size: 13px;">${customMessage}</p></div>` : ''}

              ${paymentLink ? `<div style="text-align: center; margin: 28px 0;"><a href="${paymentLink}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Pay Outstanding Balance</a></div>` : ''}
              
              <p style="color: #64748b; font-size: 13px;">If payment has already been sent, please disregard this notice.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 20px;" />
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Sent securely via InvoiceFlow AI</p>
            </div>
          `,
        }),
      });

      const resendData = await resendRes.json();
      if (resendRes.ok && resendData.id) {
        return res.json({
          success: true,
          messageId: resendData.id,
          message: 'Overdue reminder email sent successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: resendData.message || 'Failed to send reminder email via Resend',
        });
      }
    }

    return res.status(400).json({
      success: false,
      configured: false,
      message: 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.',
    });
  } catch (err: any) {
    console.error('❌ Overdue Reminder Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error sending reminder' });
  }
});

/**
 * Automated Overdue Reminders Background Scheduler Processor
 * Can be called by persistent cron, Cloud Scheduler, or on-demand
 */
app.post('/api/reminders/process', async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers['x-cron-secret'];

    // If a cron secret is configured, ensure it matches or user is authenticated
    if (cronSecret && providedSecret !== cronSecret) {
      const auth = await verifyServerAuth(req);
      if (!auth.authenticated) {
        return res.status(401).json({ success: false, error: 'Unauthorized scheduler execution' });
      }
    }

    if (!serverSupabase) {
      return res.json({
        success: true,
        message: 'Supabase not configured on server. In dev mode, reminders are triggered on-demand via UI.',
        processed: 0,
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Find all overdue invoices with client email and active reminder settings
    const { data: overdueInvoices, error: invErr } = await serverSupabase
      .from('invoices')
      .select('*, client:clients(*), business:businesses(*)')
      .in('status', ['sent', 'overdue'])
      .lt('due_date', todayStr);

    if (invErr) {
      return res.status(500).json({ success: false, error: invErr.message });
    }

    let sentCount = 0;
    const logs = [];

    for (const inv of overdueInvoices || []) {
      if (!inv.client?.email) continue;

      const dueDate = new Date(inv.due_date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Determine stage
      let stage: 'first' | 'second' | 'final' | null = null;
      if (daysOverdue >= 14) stage = 'final';
      else if (daysOverdue >= 7) stage = 'second';
      else if (daysOverdue >= 1) stage = 'first';

      if (!stage) continue;

      // Check if already sent for this invoice and stage
      const { data: existingLog } = await serverSupabase
        .from('reminder_logs')
        .select('id')
        .eq('invoice_id', inv.id)
        .eq('reminder_stage', stage)
        .maybeSingle();

      if (existingLog) continue; // prevent duplicate

      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'InvoiceFlow <no-reply@invoiceflowai.cloud>',
              to: [inv.client.email],
              subject: `Reminder: Invoice ${inv.number} is ${daysOverdue} days overdue`,
              html: `<p>Dear ${inv.client.name}, invoice ${inv.number} for ${inv.currency} ${inv.total} was due on ${inv.due_date}. Please settle at your earliest convenience.</p>`,
            }),
          });

          await serverSupabase.from('reminder_logs').insert([
            {
              user_id: inv.user_id,
              invoice_id: inv.id,
              client_id: inv.client_id,
              reminder_stage: stage,
              days_overdue: daysOverdue,
              recipient_email: inv.client.email,
              status: 'sent',
            },
          ]);

          sentCount++;
          logs.push({ invoice: inv.number, stage, email: inv.client.email });
        } catch (e: any) {
          console.error('Error sending reminder in cron:', e);
        }
      }
    }

    return res.json({
      success: true,
      processed: overdueInvoices?.length || 0,
      remindersSent: sentCount,
      logs,
    });
  } catch (err: any) {
    console.error('❌ Reminders Scheduler Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Automated Recurring Invoices Scheduler Processor
 */
app.post('/api/recurring/process', async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = req.headers['x-cron-secret'];

    if (cronSecret && providedSecret !== cronSecret) {
      const auth = await verifyServerAuth(req);
      if (!auth.authenticated) {
        return res.status(401).json({ success: false, error: 'Unauthorized scheduler execution' });
      }
    }

    if (!serverSupabase) {
      return res.json({
        success: true,
        message: 'Supabase not configured on server. Recurring invoices can be generated from the UI.',
        generated: 0,
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Find all active recurring invoices where next_invoice_date <= today
    const { data: schedules, error: schedErr } = await serverSupabase
      .from('recurring_invoices')
      .select('*, business:businesses(*)')
      .eq('status', 'active')
      .lte('next_invoice_date', todayStr);

    if (schedErr) {
      return res.status(500).json({ success: false, error: schedErr.message });
    }

    let generatedCount = 0;
    const generatedInvoices = [];

    for (const sched of schedules || []) {
      // Check if end_date has passed
      if (sched.end_date && new Date(sched.end_date) < new Date(todayStr)) {
        await serverSupabase.from('recurring_invoices').update({ status: 'completed' }).eq('id', sched.id);
        continue;
      }

      // Check for same day generation to prevent duplicate runs
      if (sched.last_generated_date === todayStr) {
        continue;
      }

      // Generate invoice number
      const bizPrefix = sched.business?.invoice_prefix || 'INV-';
      const bizNextNum = sched.business?.next_invoice_number || 1001;
      const invNumber = `${bizPrefix}${bizNextNum}`;

      // Insert new invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const { data: newInv, error: invCreateErr } = await serverSupabase
        .from('invoices')
        .insert([
          {
            user_id: sched.user_id,
            business_id: sched.business_id,
            client_id: sched.client_id,
            number: invNumber,
            status: 'sent',
            issue_date: todayStr,
            due_date: dueDate.toISOString().split('T')[0],
            currency: sched.currency || 'USD',
            subtotal: sched.subtotal || 0,
            tax_rate: sched.tax_rate || 0,
            tax_amount: sched.tax_amount || 0,
            discount: sched.discount || 0,
            total: sched.total || 0,
            notes: sched.notes,
            terms: sched.terms,
            template: sched.template || 'modern',
          },
        ])
        .select()
        .single();

      if (!invCreateErr && newInv) {
        // Insert invoice items
        const rawItems = Array.isArray(sched.items) ? sched.items : [];
        if (rawItems.length > 0) {
          const formattedItems = rawItems.map((it: any) => ({
            invoice_id: newInv.id,
            description: it.description || 'Service item',
            quantity: it.quantity || 1,
            unit_price: it.unit_price || 0,
            amount: it.amount || 0,
          }));
          await serverSupabase.from('invoice_items').insert(formattedItems);
        }

        // Increment next_invoice_number on business
        await serverSupabase
          .from('businesses')
          .update({ next_invoice_number: bizNextNum + 1 })
          .eq('id', sched.business_id);

        // Compute next invoice date based on frequency
        const nextDate = new Date(sched.next_invoice_date);
        if (sched.frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (sched.frequency === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (sched.frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          // monthly default
          nextDate.setMonth(nextDate.getMonth() + 1);
        }

        await serverSupabase
          .from('recurring_invoices')
          .update({
            last_generated_date: todayStr,
            next_invoice_date: nextDate.toISOString().split('T')[0],
          })
          .eq('id', sched.id);

        generatedCount++;
        generatedInvoices.push({ id: newInv.id, number: invNumber, total: newInv.total });
      }
    }

    return res.json({
      success: true,
      processed: schedules?.length || 0,
      generated: generatedCount,
      invoices: generatedInvoices,
    });
  } catch (err: any) {
    console.error('❌ Recurring Scheduler Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Server-side Plan Limits Enforcer
 */
app.post('/api/billing/limits', async (req, res) => {
  const { currentCount, plan = 'free', action = 'create_invoice' } = req.body;
  
  const limits: Record<string, Record<string, number>> = {
    free: {
      create_invoice: 5,
      create_product: 5,
      create_expense: 15,
      create_recurring: 1,
    },
    pro: {
      create_invoice: 1000,
      create_product: 1000,
      create_expense: 5000,
      create_recurring: 100,
    },
    enterprise: {
      create_invoice: 999999,
      create_product: 999999,
      create_expense: 999999,
      create_recurring: 999999,
    },
  };

  const planLimits = limits[plan] || limits.free;
  const maxAllowed = planLimits[action] || 100;

  if (currentCount >= maxAllowed) {
    const resourceNames: Record<string, string> = {
      create_invoice: 'invoices per month',
      create_product: 'products in your catalog',
      create_expense: 'expenses',
      create_recurring: 'recurring invoice schedules',
    };
    const name = resourceNames[action] || 'resources';

    return res.status(403).json({
      allowed: false,
      reason: `You have reached the ${plan.toUpperCase()} plan limit of ${maxAllowed} ${name}. Upgrade to Pro to unlock unlimited usage.`,
      limit: maxAllowed,
    });
  }

  return res.json({ allowed: true, limit: maxAllowed });
});

// Export Express app and core workers for Netlify and serverless adapters
export { app, processDueSubscriptions };

// Vite Middleware for development / Static serving in production (standalone mode only)
async function startServer() {
  if (process.env.NETLIFY || process.env.NETLIFY_LOCAL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.NETLIFY && !process.env.NETLIFY_LOCAL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

