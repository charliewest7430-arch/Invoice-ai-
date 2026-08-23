/**
 * Email Service Interface and Provider
 * Integrates with server-side /api/email/send-invoice endpoint.
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendInvoiceEmailParams {
  to: EmailRecipient;
  from?: EmailRecipient;
  invoiceNumber: string;
  invoiceId: string;
  businessName: string;
  clientName: string;
  currency: string;
  amount: number;
  dueDate: string;
  issueDate?: string;
  status?: string;
  pdfUrl?: string;
  paymentLink?: string;
  customNote?: string;
}

export interface SendReceiptEmailParams {
  to: EmailRecipient;
  receiptNumber: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  businessName: string;
  clientName: string;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface SendReminderEmailParams {
  to: EmailRecipient;
  clientName: string;
  invoiceNumber: string;
  invoiceId: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysOverdue: number;
  businessName: string;
  paymentLink?: string;
  customMessage?: string;
}

export interface SendWelcomeEmailParams {
  to: EmailRecipient;
  userId?: string;
  businessName?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  message?: string;
  configured?: boolean;
  duplicate?: boolean;
}

export class ServerEmailProvider {
  name = 'Server Email Provider (Resend API)';

  async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<EmailSendResult> {
    const emailTo = (params.to.email || '').trim();
    if (!emailTo || !emailTo.includes('@')) {
      return {
        success: false,
        message: 'This client does not have an email address. Add an email address before sending the invoice.',
      };
    }

    try {
      const response = await fetch('/api/email/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          clientName: params.clientName,
          invoiceNumber: params.invoiceNumber,
          invoiceId: params.invoiceId,
          amount: params.amount,
          currency: params.currency,
          businessName: params.businessName,
          dueDate: params.dueDate,
          issueDate: params.issueDate,
          status: params.status,
          paymentLink: params.paymentLink,
          customNote: params.customNote,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          provider: data.provider || 'Resend',
          message: 'Invoice sent successfully',
        };
      } else {
        return {
          success: false,
          configured: data.configured ?? false,
          message: data.message || 'Failed to send invoice email.',
        };
      }
    } catch (err: any) {
      console.warn('Email sending request exception:', err);
      const isFetchError = err?.name === 'TypeError' || err?.message === 'Failed to fetch';
      return {
        success: false,
        message: isFetchError
          ? 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.'
          : (err.message || 'Network error while attempting to send email.'),
      };
    }
  }

  async sendReceiptEmail(params: SendReceiptEmailParams): Promise<EmailSendResult> {
    const emailTo = (params.to.email || '').trim();
    if (!emailTo || !emailTo.includes('@')) {
      return {
        success: false,
        message: 'This client does not have an email address. Add an email address before sending the receipt.',
      };
    }

    try {
      const response = await fetch('/api/email/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          receiptNumber: params.receiptNumber,
          invoiceNumber: params.invoiceNumber,
          amount: params.amount,
          currency: params.currency,
          businessName: params.businessName,
          clientName: params.clientName,
          paymentDate: params.paymentDate,
          paymentMethod: params.paymentMethod,
          notes: params.notes,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          provider: data.provider || 'Resend',
          message: 'Receipt email sent successfully',
        };
      } else {
        return {
          success: false,
          configured: data.configured ?? false,
          message: data.message || 'Failed to send receipt email.',
        };
      }
    } catch (err: any) {
      console.warn('Receipt email request exception:', err);
      const isFetchError = err?.name === 'TypeError' || err?.message === 'Failed to fetch';
      return {
        success: false,
        message: isFetchError
          ? 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.'
          : (err.message || 'Network error while attempting to send receipt email.'),
      };
    }
  }

  async sendReminderEmail(params: SendReminderEmailParams): Promise<EmailSendResult> {
    const emailTo = (params.to.email || '').trim();
    if (!emailTo || !emailTo.includes('@')) {
      return {
        success: false,
        message: 'This client does not have an email address. Add an email address before sending reminder.',
      };
    }

    try {
      const response = await fetch('/api/reminders/send-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          clientName: params.clientName,
          invoiceNumber: params.invoiceNumber,
          invoiceId: params.invoiceId,
          amount: params.amount,
          currency: params.currency,
          dueDate: params.dueDate,
          daysOverdue: params.daysOverdue,
          businessName: params.businessName,
          paymentLink: params.paymentLink,
          customMessage: params.customMessage,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          message: 'Reminder email sent successfully',
        };
      } else {
        return {
          success: false,
          configured: data.configured ?? false,
          message: data.message || 'Failed to send reminder email.',
        };
      }
    } catch (err: any) {
      console.warn('Reminder email request exception:', err);
      const isFetchError = err?.name === 'TypeError' || err?.message === 'Failed to fetch';
      return {
        success: false,
        message: isFetchError
          ? 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.'
          : (err.message || 'Network error while attempting to send reminder email.'),
      };
    }
  }

  async sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<EmailSendResult> {
    const emailTo = (params.to.email || '').trim();
    // Validate email syntax
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTo || !emailRegex.test(emailTo)) {
      return {
        success: false,
        message: 'Invalid email address provided for welcome email.',
      };
    }

    try {
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTo,
          name: params.to.name,
          userId: params.userId,
          businessName: params.businessName,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.data?.id || data.messageId,
          duplicate: data.duplicate ?? false,
          provider: 'Resend',
          message: data.message || 'Welcome email sent successfully',
        };
      } else {
        return {
          success: false,
          configured: data.configured ?? false,
          message: data.message || 'Failed to send welcome email.',
        };
      }
    } catch (err: any) {
      console.warn('Welcome email request caught error:', err);
      return {
        success: false,
        message: err.message || 'Network error during welcome email delivery.',
      };
    }
  }
}

export const defaultEmailService = new ServerEmailProvider();
