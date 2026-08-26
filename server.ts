import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Server-Side Supabase Client for JWT verification
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  !supabaseUrl.includes('your-supabase-project')
);

const serverSupabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;

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
 * Flutterwave Endpoint: Transaction Initialization
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

    // Server-enforced pricing: NEVER trust frontend amount
    const price = plan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;
    const planTitle = plan === 'enterprise' ? 'Enterprise' : 'Pro';

    const { email, name, callbackUrl, metadata = {} } = req.body;
    const flwSecretKey = process.env.FLW_SECRET_KEY;

    // Sanitize Email
    const sanitizeEmail = (e: string) => {
      const trimmed = (e || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(trimmed) ? trimmed : (authCheck.user?.email || 'billing@business.com');
    };
    const validEmail = sanitizeEmail(email);
    const customerName = (name || authCheck.user?.user_metadata?.full_name || 'InvoiceFlow Subscriber').trim();

    // Generate unique transaction reference
    const uniqueTxRef = `FLW-INVF-${userId.slice(0, 8)}-${plan.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    console.log(`💳 [Flutterwave Init Server] User: ${userId}, Plan: ${planTitle}, Amount: $${price} USD, Ref: ${uniqueTxRef}`);

    // If real Flutterwave secret key is configured, initialize with Flutterwave v3 API
    if (flwSecretKey && flwSecretKey !== 'FLWSECK_TEST-xxx' && !flwSecretKey.includes('xxx')) {
      const baseUrl = process.env.APP_URL || (req.headers.origin as string) || 'https://www.invoiceflowai.cloud';
      const redirectUrl = callbackUrl && typeof callbackUrl === 'string' && callbackUrl.startsWith('http')
        ? callbackUrl
        : `${baseUrl}/billing?flw_callback=1&plan=${plan}`;

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
          title: `InvoiceFlow ${planTitle} Plan`,
          description: `InvoiceFlow ${planTitle} Monthly Subscription ($${price}/month)`,
          logo: `${baseUrl}/favicon.ico`,
        },
        meta: {
          user_id: userId,
          plan,
          price,
          ...metadata,
        },
      };

      console.log(`💳 [Flutterwave API Payments Request]:`, JSON.stringify(payload, null, 2));

      const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${flwSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await flwRes.json();
      console.log(`💳 [Flutterwave API Payments Response - Status ${flwRes.status}]:`, JSON.stringify(responseData, null, 2));

      if (flwRes.ok && (responseData.status === 'success' || responseData.data?.link)) {
        return res.json({
          success: true,
          link: responseData.data?.link,
          tx_ref: uniqueTxRef,
          plan,
          amount: price,
          currency: 'USD',
          flutterwaveResponse: responseData,
        });
      } else {
        const errorMsg = responseData?.message || 'Flutterwave checkout initialization failed.';
        console.warn('⚠️ Flutterwave Initialization Error:', errorMsg);
        return res.status(400).json({
          success: false,
          message: errorMsg,
          flutterwaveResponse: responseData,
        });
      }
    }

    // Development Simulation Mode (when FLW_SECRET_KEY is not configured)
    console.log('ℹ️ Flutterwave running in Dev Simulation Mode (No live FLW_SECRET_KEY configured)');
    return res.json({
      success: true,
      devMode: true,
      link: null,
      tx_ref: uniqueTxRef,
      plan,
      amount: price,
      currency: 'USD',
      message: 'Dev Mode simulation initialized successfully',
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
 */
app.post('/api/flutterwave/verify', async (req, res) => {
  try {
    const authCheck = await verifyServerAuth(req);
    const { transaction_id, tx_ref, plan = 'pro', simulated } = req.body;
    const flwSecretKey = process.env.FLW_SECRET_KEY;
    const userId = authCheck.user?.id || req.body?.userId;

    console.log(`🔍 [Flutterwave Verify Server] Verifying Transaction. ID: ${transaction_id}, Ref: ${tx_ref}, Plan: ${plan}`);

    // If real FLW_SECRET_KEY is configured and not explicitly simulated
    if (flwSecretKey && flwSecretKey !== 'FLWSECK_TEST-xxx' && !flwSecretKey.includes('xxx') && !simulated) {
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
        const verifiedPlan = (txData.meta?.plan || plan || 'pro').toLowerCase();
        const expectedPrice = verifiedPlan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;

        // Verify currency and amount
        if (txData.currency === 'USD' && Number(txData.amount) < expectedPrice) {
          console.warn(`🚨 [Flutterwave Verify] Amount mismatch. Expected $${expectedPrice}, got $${txData.amount}`);
          return res.status(400).json({
            status: 'failed',
            message: `Payment amount ($${txData.amount}) does not match required plan price ($${expectedPrice}).`,
          });
        }

        // Update database if Supabase is connected
        if (serverSupabase && userId) {
          try {
            await serverSupabase.from('subscriptions').upsert({
              user_id: userId,
              plan: verifiedPlan,
              status: 'active',
              flutterwave_ref: txData.tx_ref,
              flutterwave_transaction_id: String(txData.id),
              payment_provider: 'flutterwave',
              current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
              updated_at: new Date().toISOString(),
            });

            await serverSupabase.from('payments').insert([{
              user_id: userId,
              amount: txData.amount,
              currency: txData.currency || 'USD',
              status: 'success',
              channel: txData.payment_type || 'card',
              flutterwave_ref: txData.tx_ref,
              flutterwave_transaction_id: String(txData.id),
              payment_provider: 'flutterwave',
              paid_at: txData.created_at || new Date().toISOString(),
            }]);
          } catch (dbErr) {
            console.warn('⚠️ Error updating database records on verification:', dbErr);
          }
        }

        return res.json({
          status: 'success',
          message: 'Payment verified successfully via Flutterwave API',
          data: txData,
        });
      } else {
        return res.status(400).json({
          status: 'failed',
          message: responseData.message || 'Flutterwave payment verification failed or payment was unsuccessful.',
          data: responseData.data,
        });
      }
    }

    // Dev Simulation Verified Response
    const verifiedPlan = plan === 'enterprise' ? 'enterprise' : 'pro';
    const price = verifiedPlan === 'enterprise' ? FLW_ENTERPRISE_PRICE : FLW_PRO_PRICE;
    const mockRef = tx_ref || `FLW-DEV-${Date.now()}`;

    if (serverSupabase && userId) {
      try {
        await serverSupabase.from('subscriptions').upsert({
          user_id: userId,
          plan: verifiedPlan,
          status: 'active',
          flutterwave_ref: mockRef,
          payment_provider: 'flutterwave',
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        });

        await serverSupabase.from('payments').insert([{
          user_id: userId,
          amount: price,
          currency: 'USD',
          status: 'success',
          channel: 'card',
          flutterwave_ref: mockRef,
          payment_provider: 'flutterwave',
          paid_at: new Date().toISOString(),
        }]);
      } catch (dbErr) {
        console.warn('⚠️ Dev mode database record notice:', dbErr);
      }
    }

    return res.json({
      status: 'success',
      message: 'Payment verified successfully (Development Simulation)',
      data: {
        id: `FLW_TX_${Date.now()}`,
        tx_ref: mockRef,
        flw_ref: `FLW-REF-${Date.now()}`,
        status: 'successful',
        amount: price,
        currency: 'USD',
        payment_type: 'card',
        created_at: new Date().toISOString(),
        meta: { plan: verifiedPlan, user_id: userId },
      },
    });
  } catch (error: any) {
    console.error('❌ Flutterwave Verify Server Error:', error);
    return res.status(500).json({ status: 'failed', message: error.message || 'Server error during verification' });
  }
});

/**
 * Flutterwave Webhook Endpoint
 */
app.post('/api/flutterwave/webhook', async (req, res) => {
  try {
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers['verif-hash'];

    // Verify secret hash if configured
    if (secretHash && signature !== secretHash) {
      console.warn('🚨 [Flutterwave Webhook] Invalid secret hash signature received');
      return res.status(401).send('Invalid signature');
    }

    const payload = req.body;
    console.log('🔔 [Flutterwave Webhook Event]:', payload?.event, payload?.data?.tx_ref);

    // Process charge.completed event
    if (payload?.event === 'charge.completed' && payload?.data?.status === 'successful') {
      const txData = payload.data;
      const userId = txData.meta?.user_id;
      const plan = txData.meta?.plan || 'pro';

      if (serverSupabase && userId) {
        try {
          await serverSupabase.from('subscriptions').upsert({
            user_id: userId,
            plan: plan === 'enterprise' ? 'enterprise' : 'pro',
            status: 'active',
            flutterwave_ref: txData.tx_ref,
            flutterwave_transaction_id: String(txData.id),
            payment_provider: 'flutterwave',
            current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
            updated_at: new Date().toISOString(),
          });

          await serverSupabase.from('payments').insert([{
            user_id: userId,
            amount: txData.amount,
            currency: txData.currency || 'USD',
            status: 'success',
            channel: txData.payment_type || 'card',
            flutterwave_ref: txData.tx_ref,
            flutterwave_transaction_id: String(txData.id),
            payment_provider: 'flutterwave',
            paid_at: txData.created_at || new Date().toISOString(),
          }]);
        } catch (dbErr) {
          console.warn('⚠️ Webhook database sync notice:', dbErr);
        }
      }
    }

    // Always return 200 OK immediately to acknowledge webhook receipt
    return res.status(200).send('Webhook received');
  } catch (err: any) {
    console.error('❌ Flutterwave Webhook Error:', err);
    return res.status(200).send('Webhook processed with error');
  }
});

/**
 * 7-Day Free Trial Endpoint
 * Allows users to start a 7-day free trial on Pro or Enterprise without repeating trials
 */
app.post('/api/subscription/start-trial', async (req, res) => {
  try {
    const authCheck = await verifyServerAuth(req);
    if (!authCheck.authenticated) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in or create an account to start your 7-day free trial.',
      });
    }

    const userId = authCheck.user?.id;
    const rawPlan = (req.body.plan || 'pro').toLowerCase();
    const targetPlan: 'pro' | 'enterprise' = rawPlan === 'enterprise' ? 'enterprise' : 'pro';

    if (serverSupabase && userId) {
      // Check existing subscription to prevent repeated trials
      const { data: existingSub } = await serverSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingSub) {
        if (existingSub.trial_started_at || existingSub.trial_used) {
          return res.status(400).json({
            success: false,
            message: 'A 7-day free trial has already been used on this account. Please select a plan to continue.',
          });
        }
      }

      const trialStart = new Date().toISOString();
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: updatedSub, error: updateErr } = await serverSupabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: targetPlan,
          status: 'trialing',
          trial_started_at: trialStart,
          trial_ends_at: trialEnd,
          trial_used: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (updateErr) {
        console.warn('Trial update database error:', updateErr);
      }

      return res.json({
        success: true,
        message: `Your 7-day ${targetPlan.toUpperCase()} trial has been activated!`,
        subscription: updatedSub || {
          user_id: userId,
          plan: targetPlan,
          status: 'trialing',
          trial_started_at: trialStart,
          trial_ends_at: trialEnd,
          trial_used: true,
        },
      });
    }

    // Dev fallback
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return res.json({
      success: true,
      message: `Your 7-day ${targetPlan.toUpperCase()} trial has been activated!`,
      subscription: {
        user_id: userId || 'usr_dev',
        plan: targetPlan,
        status: 'trialing',
        trial_started_at: trialStart,
        trial_ends_at: trialEnd,
        trial_used: true,
      },
    });
  } catch (error: any) {
    console.error('❌ Start Trial Server Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error starting trial' });
  }
});

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

// Vite Middleware for development / Static serving in production
async function startServer() {
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

startServer();
