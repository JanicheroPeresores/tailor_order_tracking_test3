import { getEmailConfigError, sendEmail } from './_lib/email.js';

function sendJson(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const configError = getEmailConfigError();
    if (configError) {
      return sendJson(res, 500, { error: configError });
    }

    const to = String(req.body?.email || '').trim();
    if (!to) {
      return sendJson(res, 400, { error: 'Email is required.' });
    }

    await sendEmail({
      to,
      subject: 'Tailor Order Tracking test email',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a;">
          <h2>Email integration test</h2>
          <p>This confirms your Vercel email configuration is working.</p>
        </div>
      `,
    });

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
}
