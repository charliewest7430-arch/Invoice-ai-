/**
 * AI Service for Gemini integration via server-side API routes with robust error handling
 */

export type AiErrorType =
  | 'missing_api_key'
  | 'invalid_api_key'
  | 'rate_limit_exceeded'
  | 'service_unavailable'
  | 'network_error'
  | 'safety_blocked'
  | 'model_not_found'
  | 'generic_error';

export interface AiErrorInfo {
  errorType: AiErrorType;
  title: string;
  message: string;
  suggestion: string;
  statusCode?: number;
  retryable: boolean;
}

export class AiServiceError extends Error implements AiErrorInfo {
  errorType: AiErrorType;
  title: string;
  suggestion: string;
  statusCode?: number;
  retryable: boolean;

  constructor(info: AiErrorInfo) {
    super(info.message);
    this.name = 'AiServiceError';
    this.errorType = info.errorType;
    this.title = info.title;
    this.suggestion = info.suggestion;
    this.statusCode = info.statusCode;
    this.retryable = info.retryable;
    Object.setPrototypeOf(this, AiServiceError.prototype);
  }
}

/**
 * Normalizes any error (network failure, server error, timeout, offline) into a structured AiServiceError
 */
export function normalizeAiError(err: any): AiServiceError {
  if (err instanceof AiServiceError) {
    return err;
  }

  // Check browser online status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new AiServiceError({
      errorType: 'network_error',
      title: 'No Internet Connection',
      message: 'Your device appears to be offline. Please reconnect to the internet and retry.',
      suggestion: 'Check your Wi-Fi, Ethernet, or mobile network connection.',
      retryable: true,
    });
  }

  const errMsg = err?.message || (typeof err === 'string' ? err : 'Unknown error');
  const errStr = `${errMsg} ${JSON.stringify(err || {})}`.toLowerCase();

  // Client-side fetch network connection failures
  if (
    errStr.includes('failed to fetch') ||
    errStr.includes('networkerror') ||
    errStr.includes('load failed') ||
    errStr.includes('econnrefused') ||
    errStr.includes('etimedout') ||
    errStr.includes('aborterror') ||
    errStr.includes('timeout')
  ) {
    return new AiServiceError({
      errorType: 'network_error',
      title: 'Network Connection Error',
      message: 'Unable to reach the AI Assistant backend. Please check your network connection and try again.',
      suggestion: 'Verify your internet connection and ensure the server is running.',
      retryable: true,
    });
  }

  return new AiServiceError({
    errorType: 'generic_error',
    title: 'AI Assistant Error',
    message: errMsg || 'An unexpected issue occurred while requesting Gemini AI assistance.',
    suggestion: 'Please try again in a moment or rephrase your query.',
    retryable: true,
  });
}

export interface AiInvoicePromptParams {
  prompt: string;
  defaultCurrency?: string;
  clients?: Array<{ id: string; name: string; company?: string }>;
}

export interface GeneratedAiInvoice {
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  taxRate: number;
  discount: number;
  notes?: string;
  terms?: string;
}

export async function generateInvoiceWithAi(params: AiInvoicePromptParams): Promise<GeneratedAiInvoice> {
  try {
    const response = await fetch('/api/ai/generate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let bodyData: any = null;
      try {
        bodyData = await response.json();
      } catch {
        bodyData = null;
      }

      if (bodyData && (bodyData.errorType || bodyData.title || bodyData.message)) {
        throw new AiServiceError({
          errorType: bodyData.errorType || (response.status === 429 ? 'rate_limit_exceeded' : 'generic_error'),
          title: bodyData.title || (response.status === 429 ? 'Rate Limit Exceeded' : 'AI Invoice Generation Failed'),
          message: bodyData.message || bodyData.error || 'Failed to generate invoice with AI.',
          suggestion: bodyData.suggestion || 'Please review your input and try again.',
          statusCode: response.status,
          retryable: bodyData.retryable ?? (response.status === 429 || response.status >= 500),
        });
      }

      // Map standard HTTP status codes if non-JSON error response
      if (response.status === 401 || response.status === 403) {
        throw new AiServiceError({
          errorType: 'invalid_api_key',
          title: 'Invalid Gemini API Key',
          message: 'The Gemini API key is missing, unauthorized, or invalid.',
          suggestion: 'Please configure GEMINI_API_KEY in the Settings > Secrets panel.',
          statusCode: response.status,
          retryable: false,
        });
      }

      if (response.status === 429) {
        throw new AiServiceError({
          errorType: 'rate_limit_exceeded',
          title: 'Rate Limit / Quota Exceeded',
          message: 'Gemini AI rate limit or quota exceeded. Please wait a few moments before trying again.',
          suggestion: 'Wait 10–30 seconds before submitting another prompt.',
          statusCode: 429,
          retryable: true,
        });
      }

      if (response.status >= 500) {
        throw new AiServiceError({
          errorType: 'service_unavailable',
          title: 'AI Service Temporarily Unavailable',
          message: 'Google Gemini servers are temporarily overloaded or undergoing maintenance.',
          suggestion: 'Please try again in a few moments.',
          statusCode: response.status,
          retryable: true,
        });
      }

      throw new AiServiceError({
        errorType: 'generic_error',
        title: 'AI Invoice Error',
        message: bodyData?.error || `Request failed with HTTP status ${response.status}`,
        suggestion: 'Please try again or contact support if the issue persists.',
        statusCode: response.status,
        retryable: true,
      });
    }

    const data = await response.json();
    return data.invoice;
  } catch (err: any) {
    throw normalizeAiError(err);
  }
}

export interface AiChatMessage {
  id?: string;
  role: 'user' | 'model';
  text: string;
  errorInfo?: AiErrorInfo;
}

export interface AskAiAssistantParams {
  messages: AiChatMessage[];
  businessContext?: {
    name: string;
    currency: string;
    unpaidCount: number;
    overdueTotal: number;
    monthlyRevenue: number;
  };
}

export async function askAiAssistant(params: AskAiAssistantParams): Promise<string> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let bodyData: any = null;
      try {
        bodyData = await response.json();
      } catch {
        bodyData = null;
      }

      if (bodyData && (bodyData.errorType || bodyData.title || bodyData.message)) {
        throw new AiServiceError({
          errorType: bodyData.errorType || (response.status === 429 ? 'rate_limit_exceeded' : 'generic_error'),
          title: bodyData.title || (response.status === 429 ? 'Rate Limit Exceeded' : 'AI Assistant Request Failed'),
          message: bodyData.message || bodyData.error || 'The AI Assistant could not process this request.',
          suggestion: bodyData.suggestion || 'Please review your input and try again.',
          statusCode: response.status,
          retryable: bodyData.retryable ?? (response.status === 429 || response.status >= 500),
        });
      }

      if (response.status === 401 || response.status === 403) {
        throw new AiServiceError({
          errorType: 'invalid_api_key',
          title: 'Invalid Gemini API Key',
          message: 'The Gemini API key is missing, unauthorized, or invalid.',
          suggestion: 'Please configure GEMINI_API_KEY in the Settings > Secrets panel.',
          statusCode: response.status,
          retryable: false,
        });
      }

      if (response.status === 429) {
        throw new AiServiceError({
          errorType: 'rate_limit_exceeded',
          title: 'Rate Limit / Quota Exceeded',
          message: 'Gemini AI rate limit or quota exceeded. Please wait a few moments before sending another message.',
          suggestion: 'Wait 10–30 seconds before sending another message.',
          statusCode: 429,
          retryable: true,
        });
      }

      if (response.status >= 500) {
        throw new AiServiceError({
          errorType: 'service_unavailable',
          title: 'AI Service Temporarily Unavailable',
          message: 'Google Gemini servers are temporarily overloaded or undergoing maintenance.',
          suggestion: 'Please try again in a few moments.',
          statusCode: response.status,
          retryable: true,
        });
      }

      throw new AiServiceError({
        errorType: 'generic_error',
        title: 'AI Assistant Error',
        message: bodyData?.error || `Request failed with HTTP status ${response.status}`,
        suggestion: 'Please try again or rephrase your question.',
        statusCode: response.status,
        retryable: true,
      });
    }

    const data = await response.json();
    return data.reply;
  } catch (err: any) {
    throw normalizeAiError(err);
  }
}
