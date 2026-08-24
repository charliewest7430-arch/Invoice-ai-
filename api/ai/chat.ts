import { GoogleGenAI } from '@google/genai';

// Helper to classify Gemini API errors
const parseGeminiError = (error: any) => {
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
      suggestion: 'Please verify or generate a new key and update GEMINI_API_KEY in the environment variables.',
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
      throw err;
    }
  }
  throw lastError;
};

// Vercel Serverless Function Handler for /api/ai/chat
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'The /api/ai/chat endpoint only supports POST requests.',
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
    const { messages, businessContext } = body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        success: false,
        error: 'Missing Gemini API key. Please configure GEMINI_API_KEY in environment variables.',
        errorType: 'missing_api_key',
        title: 'Gemini API Key Required',
        message: 'No Gemini API key was detected on the server.',
        suggestion: 'Please configure GEMINI_API_KEY in the Vercel project environment settings.',
        retryable: false,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
      parts: [{ text: m.text || '' }],
    }));

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: formattedMessages,
      config: {
        systemInstruction,
      },
    });

    return res.status(200).json({ success: true, reply: response.text || '' });
  } catch (error: any) {
    console.error('Vercel Serverless AI Assistant Error:', error);
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
}
