// Vercel Serverless Function Handler for /api/email/send-invoice
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
      message: 'The /api/email/send-invoice endpoint only supports POST requests.',
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
    const { to, invoiceNumber, amount, currency, businessName, clientName, dueDate, issueDate, status, paymentLink, customNote } = body || {};

    if (!to || typeof to !== 'string' || !to.trim() || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'This client does not have an email address. Add an email address before sending the invoice.',
      });
    }

    const cleanEmail = to.trim();
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
        return res.status(200).json({
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

    return res.status(400).json({
      success: false,
      configured: false,
      message: 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.',
    });
  } catch (err: any) {
    console.error('Serverless send invoice email error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server email delivery exception' });
  }
}
