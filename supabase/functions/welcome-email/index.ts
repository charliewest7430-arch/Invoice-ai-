import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, userId, businessName } = await req.json();

    // Syntax validation & bounce protection
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid or malformed recipient email address.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY is not configured in Supabase Edge Function secrets.');
      return new Response(
        JSON.stringify({ success: false, configured: false, message: 'RESEND_API_KEY not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appOrigin = Deno.env.get('APP_URL') || 'https://invoiceflow.app';
    const senderFrom = Deno.env.get('EMAIL_FROM') || Deno.env.get('RESEND_FROM_EMAIL') || 'InvoiceFlow <onboarding@resend.dev>';
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'there';

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

    const resendData = await resendRes.json();
    return new Response(
      JSON.stringify({ success: resendRes.ok, data: resendData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
