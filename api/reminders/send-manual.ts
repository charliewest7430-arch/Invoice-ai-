// Vercel Serverless Function Handler for /api/reminders/send-manual
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
      message: 'The /api/reminders/send-manual endpoint only supports POST requests.',
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
    const {
      to,
      clientName,
      invoiceNumber,
      amount,
      currency,
      dueDate,
      daysOverdue,
      businessName,
      paymentLink,
      customMessage,
    } = body || {};

    if (!to || typeof to !== 'string' || !to.trim() || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid recipient email address is required to send reminder.',
      });
    }

    const cleanEmail = to.trim();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const formattedDueDate = dueDate
        ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Due Date';

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'InvoiceFlow <no-reply@invoiceflowai.cloud>',
          to: [cleanEmail],
          subject: `Payment Reminder: Invoice ${invoiceNumber} (${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Payment Due'})`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; padding: 6px 14px; background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
                  ${daysOverdue > 0 ? `⚠️ Overdue by ${daysOverdue} Days` : 'Payment Due Reminder'}
                </span>
                <h2 style="color: #0f172a; margin: 12px 0 4px; font-size: 24px; font-weight: 800;">Friendly Payment Reminder</h2>
                <p style="color: #64748b; font-size: 13px; margin: 0;">Invoice <strong>${invoiceNumber}</strong></p>
              </div>

              <p style="color: #475569; font-size: 14px;">Dear ${clientName || 'Valued Customer'},</p>
              <p style="color: #475569; font-size: 14px;">This is a friendly reminder that payment for invoice <strong>${invoiceNumber}</strong> from <strong>${businessName || 'Our Business'}</strong> is currently outstanding.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin: 20px 0; font-size: 14px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Invoice Number:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right;">${invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Due Date:</td>
                    <td style="padding: 6px 0; color: #0f172a; text-align: right;">${formattedDueDate}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0 4px; font-weight: bold; color: #0f172a; font-size: 15px;">Balance Outstanding:</td>
                    <td style="padding: 10px 0 4px; font-weight: 800; color: #dc2626; font-size: 16px; text-align: right;">${currency || '$'} ${Number(amount || 0).toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              ${customMessage ? `<div style="padding: 12px 16px; background-color: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0; color: #334155; font-style: italic; font-size: 13px;">${customMessage}</p></div>` : ''}

              ${paymentLink ? `<div style="text-align: center; margin: 28px 0;"><a href="${paymentLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">View & Pay Invoice Now</a></div>` : ''}

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
          message: 'Payment reminder sent successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          message: resendData.message || 'Failed to send payment reminder email via Resend',
        });
      }
    }

    return res.status(400).json({
      success: false,
      configured: false,
      message: 'Email provider is not configured. Please set RESEND_API_KEY in environment variables to send emails.',
    });
  } catch (err: any) {
    console.error('Serverless send reminder email error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server reminder email delivery exception' });
  }
}
