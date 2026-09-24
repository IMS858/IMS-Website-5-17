/**
 * First-party IMS contact form. Sends directly through Resend instead of
 * forwarding a Web3Forms notification, preserving the visitor's Reply-To.
 * Requires RESEND_API_KEY and a verified RESEND_FROM_EMAIL in this project.
 */
const OWNER = process.env.CONTACT_INBOX || 'admin@imsfitnesscenter.com';
const FROM = process.env.RESEND_FROM_EMAIL || 'IMS Website <hello@imsmethod.com>';
const SITE = 'https://imsmethod.com';
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validEmail = value => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
const json = (res, code, data) => res.status(code).setHeader('Cache-Control','no-store').json(data);
async function send(key, payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  if (!response.ok) {
    console.error('[contact] Resend rejected send:', response.status);
    return false;
  }
  return true;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res,405,{error:'Method not allowed'});
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    return json(res,503,{error:'Contact form temporarily unavailable'});
  const length = Number(req.headers['content-length'] || 0);
  if (length > 12000) return json(res,413,{error:'Message too long'});
  const origin = req.headers.origin;
  if (origin && !['https://imsmethod.com','https://www.imsmethod.com'].includes(origin))
    return json(res,403,{error:'Invalid origin'});
  const body = req.body || {};
  if (typeof body !== 'object' || Array.isArray(body)) return json(res,400,{error:'Invalid form'});
  // Honeypot: behave like success without notifying the studio.
  if (body.botcheck) return json(res,200,{ok:true});
  const name = String(body.name || '').trim().slice(0,120);
  const email = String(body.email || '').trim().toLowerCase().slice(0,254);
  const phone = String(body.phone || '').trim().slice(0,60);
  const message = String(body.message || '').trim();
  if (!name || !validEmail(email) || !message || message.length > 4000)
    return json(res,400,{error:'Please provide your name, email and a message under 4,000 characters.'});
  const subject = 'IMS website enquiry — ' + name.replace(/[\\r\\n]/g,' ');
  const html = `<h2>New website enquiry</h2><p><b>Name:</b> ${escapeHtml(name)}</p><p><b>Email:</b> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p><p><b>Phone:</b> ${escapeHtml(phone || 'Not provided')}</p><p><b>Message:</b></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p>Reply directly to this email to reach the visitor.</p>`;
  try {
    const ok = await send(process.env.RESEND_API_KEY,{
      from:FROM,to:[OWNER],reply_to:email,subject,html,
      text:`Name: ${name}\\nEmail: ${email}\\nPhone: ${phone}\\n\\n${message}`
    });
    if (!ok) return json(res,502,{error:'Unable to deliver your message'});
    // Best effort acknowledgement. A failed acknowledgement never masks delivery.
    await send(process.env.RESEND_API_KEY,{
      from:FROM,to:[email],reply_to:OWNER,
      subject:'We received your message — IMS',
      html:`<p>Hi ${escapeHtml(name.split(' ')[0])},</p><p>Thanks for reaching out to Innovative Movement Solutions. We received your message and will respond personally.</p><p>Jason Patterson · IMS<br><a href="${SITE}">imsmethod.com</a> · (619) 937-1434</p>`,
      text:`Hi ${name.split(' ')[0]},\\n\\nThanks for reaching out to IMS. We received your message and will respond personally.\\n\\nJason Patterson · IMS\\n(619) 937-1434`
    });
    return json(res,200,{ok:true});
  } catch (error) {
    console.error('[contact] delivery error', error instanceof Error ? error.name : 'unknown');
    return json(res,502,{error:'Unable to deliver your message'});
  }
}
