import { GoogleGenAI, Type } from '@google/genai';

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
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

const generateContentWithFallback = async (
  ai: GoogleGenAI,
  requestParams: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'> & { model?: string }
) => {
  const primary = requestParams.model || 'gemini-2.5-flash';
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

// Vercel Serverless Function Handler for /api/ai/generate-invoice
export default async function handler(req: any, res: any) {
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
      message: 'The /api/ai/generate-invoice endpoint only supports POST requests.',
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
    const { prompt, defaultCurrency = 'USD', clients = [] } = body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(400).json({
        success: false,
        error: 'Missing Gemini API key. Please configure GEMINI_API_KEY in environment variables.',
        errorType: 'missing_api_key',
        title: 'Gemini API Key Required',
        message: 'No Gemini API key was detected on the server.',
        suggestion: 'Please configure GEMINI_API_KEY in the Vercel project settings.',
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

    const clientListStr = (clients || [])
      .map((c: any) => `- ${c.name} (${c.email || 'no email'}, ${c.company || 'N/A'})`)
      .join('\n');

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-2.5-flash',
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
    return res.status(200).json({ success: true, invoice: invoiceData });
  } catch (error: any) {
    console.error('Vercel Serverless Generate Invoice Error:', error);
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
