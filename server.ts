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

// Retry helper for temporary network or 503 errors
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1200): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errStr = `${err?.message || ''} ${JSON.stringify(err)}`;
      const isTransient = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand') || errStr.includes('fetch failed') || errStr.includes('ECONNRESET');
      if (attempt < maxRetries && isTransient) {
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
        continue;
      }
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

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.7-flash',
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
      })
    );

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

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: formattedMessages,
        config: {
          systemInstruction,
        },
      })
    );

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
 * Paystack Endpoint: Transaction Initialization
 */
app.post('/api/paystack/initialize', async (req, res) => {
  try {
    // Security check: Verify that user is authenticated before creating a subscription/payment transaction
    const authCheck = await verifyServerAuth(req);
    if (!authCheck.authenticated) {
      console.warn(`🚨 [Paystack Init Server] Blocked unauthenticated checkout request: ${authCheck.error}`);
      return res.status(401).json({
        success: false,
        message: authCheck.error || 'Authentication required. Please sign in or create an account to upgrade.',
      });
    }

    const { email, amount, currency = 'USD', reference, metadata, callbackUrl } = req.body;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Sanitize Email
    const sanitizeEmail = (e: string) => {
      const trimmed = (e || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(trimmed) ? trimmed : 'billing@business.com';
    };
    const validEmail = sanitizeEmail(email);

    // Sanitize Reference (alphanumeric, hyphens, underscores, max 100 chars)
    const rawRef = reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const uniqueReference = rawRef.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);

    // Ensure amount is positive number in major units (USD $) and convert to minor unit (cents: USD x 100)
    // $29 = 2900 cents, $99 = 9900 cents
    const rawAmountNum = Math.max(1, Number(amount) || 29);
    const amountInMinor = Math.round(rawAmountNum * 100);
    const requestedCurrency = (currency || 'USD').toUpperCase();

    console.log(`💳 [Paystack Init Server] Email: ${validEmail}, USD Amount: $${rawAmountNum}, Cents: ${amountInMinor}, Currency: ${requestedCurrency}, Ref: ${uniqueReference}`);

    // If real secret key exists (e.g., sk_test_... or sk_live_...), initialize with Paystack API
    if (paystackSecret && paystackSecret !== 'sk_test_xxx' && paystackSecret.startsWith('sk_')) {
      const cleanPayload: Record<string, any> = {
        email: validEmail,
        amount: amountInMinor,
        currency: requestedCurrency,
        reference: uniqueReference,
        metadata: metadata && typeof metadata === 'object' ? metadata : {},
      };

      if (callbackUrl && typeof callbackUrl === 'string' && callbackUrl.startsWith('http')) {
        cleanPayload.callback_url = callbackUrl;
      }

      console.log(`💳 [Paystack API Init Request]:`, JSON.stringify(cleanPayload, null, 2));

      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanPayload),
      });

      const responseData = await paystackRes.json();
      console.log(`💳 [Paystack API Init Response - Status ${paystackRes.status}]:`, JSON.stringify(responseData, null, 2));

      if (paystackRes.ok && responseData.status === true) {
        return res.json({
          success: true,
          reference: responseData.data?.reference || uniqueReference,
          access_code: responseData.data?.access_code,
          authorization_url: responseData.data?.authorization_url,
          currency: requestedCurrency,
          paystackResponse: responseData,
        });
      } else {
        // Check if error is unsupported currency or merchant USD validation error
        const rawMsg = (responseData?.message || '').toLowerCase();
        const isUnsupportedCurrency =
          requestedCurrency === 'USD' ||
          responseData?.code === 'unsupported_currency' ||
          responseData?.type === 'validation_error' ||
          rawMsg.includes('currency') ||
          rawMsg.includes('usd') ||
          rawMsg.includes('merchant');

        if (isUnsupportedCurrency) {
          console.warn('⚠️ Paystack USD not enabled on this merchant key. Attempting automatic fallback to NGN (Paystack default supported currency)...');
          try {
            // Convert USD amount to approximate NGN amount (e.g., $29 ~ 45,000 NGN in kobo)
            const usdToNgnRate = 1600;
            const ngnAmountInKobo = Math.round(rawAmountNum * usdToNgnRate * 100);
            const ngnPayload = {
              ...cleanPayload,
              amount: ngnAmountInKobo,
              currency: 'NGN',
            };

            const ngnRes = await fetch('https://api.paystack.co/transaction/initialize', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${paystackSecret}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ngnPayload),
            });

            const ngnData = await ngnRes.json();
            if (ngnRes.ok && ngnData.status === true) {
              console.log('✅ Paystack NGN fallback initialization successful');
              return res.json({
                success: true,
                reference: ngnData.data?.reference || uniqueReference,
                access_code: ngnData.data?.access_code,
                authorization_url: ngnData.data?.authorization_url,
                currency: 'NGN',
                convertedFromUSD: true,
                paystackResponse: ngnData,
              });
            }
          } catch (fallbackErr) {
            console.error('NGN fallback error:', fallbackErr);
          }
        }

        const errorMessage = isUnsupportedCurrency
          ? 'USD payments are currently not enabled for this Paystack account. Please enable international currency in your Paystack dashboard.'
          : (responseData?.message || 'Paystack transaction initialization failed.');

        console.warn('⚠️ Paystack Initialization API Response:', responseData?.message || 'Initialization declined by Paystack');
        return res.status(400).json({
          success: false,
          code: isUnsupportedCurrency ? 'unsupported_currency' : (responseData?.code || 'init_failed'),
          message: errorMessage,
          paystackResponse: {
            status: false,
            message: errorMessage,
          },
        });
      }
    }

    // Development fallback simulation mode
    console.log('ℹ️ Paystack running in Dev Simulation Mode (No real secret key configured)');
    return res.json({
      success: true,
      devMode: true,
      reference: uniqueReference,
      access_code: `DEV_ACCESS_${Date.now()}`,
      authorization_url: '#',
      message: 'Dev Mode simulation initialized successfully',
      paystackResponse: {
        status: true,
        message: 'Dev Simulation Initialized',
        data: {
          authorization_url: '#',
          access_code: `DEV_ACCESS_${Date.now()}`,
          reference: uniqueReference,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Paystack Init Server Exception:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server exception during Paystack initialization',
      paystackResponse: { status: false, error: error.message },
    });
  }
});

/**
 * Paystack Endpoint: Payment Verification
 */
app.post('/api/paystack/verify', async (req, res) => {
  try {
    const { reference, simulated, amount, email } = req.body;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!reference) {
      return res.status(400).json({ status: 'failed', message: 'Reference is required for verification' });
    }

    console.log(`🔍 [Paystack Verify Server] Verifying Ref: ${reference}`);

    // Real Paystack Verification if secret key exists and not explicitly simulated
    if (paystackSecret && paystackSecret !== 'sk_test_xxx' && paystackSecret.startsWith('sk_') && !simulated) {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await paystackRes.json();
      console.log(`🔍 [Paystack API Verify Response - Status ${paystackRes.status}]:`, JSON.stringify(data, null, 2));

      if (data.status && data.data?.status === 'success') {
        return res.json({
          status: 'success',
          message: 'Payment verified successfully via Paystack API',
          data: data.data,
        });
      } else {
        return res.status(400).json({
          status: 'failed',
          message: data.message || 'Paystack payment verification failed',
          data: data.data,
        });
      }
    }

    // Graceful verified fallback response for test/development mode
    return res.json({
      status: 'success',
      message: 'Payment verified successfully (Development Simulation)',
      data: {
        reference: reference || `REF-${Date.now()}`,
        status: 'success',
        amount: Math.round((amount || 29) * 100),
        currency: 'NGN',
        customer: { email: email || 'user@example.com' },
        paid_at: new Date().toISOString(),
        channel: 'card',
      },
    });
  } catch (error: any) {
    console.error('❌ Paystack Verify Error:', error);
    return res.status(500).json({ status: 'failed', message: error.message });
  }
});

/**
 * Paystack Webhook endpoint
 */
app.post('/api/paystack/webhook', (req, res) => {
  const event = req.body;
  console.log('🔔 [Paystack Webhook Received]:', event.event);
  
  // Respond 200 OK immediately to Paystack
  res.status(200).send('Webhook received');
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
          from: process.env.EMAIL_FROM || `${businessName || 'InvoiceFlow AI'} <invoices@resend.dev>`,
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
          from: process.env.EMAIL_FROM || `${businessName || 'InvoiceFlow AI'} <receipts@resend.dev>`,
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
          from: process.env.EMAIL_FROM || `${businessName || 'InvoiceFlow AI'} <billing@resend.dev>`,
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
              from: process.env.EMAIL_FROM || `${inv.business?.name || 'InvoiceFlow AI'} <billing@resend.dev>`,
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
