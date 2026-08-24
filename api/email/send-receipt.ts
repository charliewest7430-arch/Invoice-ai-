// Vercel Serverless Function Handler for /api/email/send-receipt
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
      message: 'The /api/email/send-receipt endpoint only supports POST requests.',
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
      receiptNumber,
      invoiceNumber,
      amount,
      currency,
      businessName,
      clientName,
      paymentDate,
      paymentMethod,
      notes,
    } = body || {};

    if (!to || typeof to !== 'string' || !to.trim() || !to.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid client email address is required to send receipt.',
      });
    }

    const cleanEmail = to.trim();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const formattedDate = paymentDate
        ? new Date(paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : new Date().toLocaleDateString('en-US');

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
                    <td style="padding: 6px 0; color: #0f172a; text-align: right;">${paymentMethod || 'Card / Electronic'}</td>
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
        return res.status(200).json({
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
    console.error('Serverless send receipt email error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server receipt email delivery exception' });
  }
}
