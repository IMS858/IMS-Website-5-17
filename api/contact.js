import { createHash } from 'node:crypto';

// Resend acceptance, visitor acknowledgement and Coach OS recording are separate outcomes.
// No browser secrets; no automatic outbound activity from an unapproved preview.
const MAX_BODY_BYTES = 12000;
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const json = (res, code, data) => res.status(code).setHeader('Cache-Control', 'no-store').json(data);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function field(body, key, max, required = false) {
  if (body[key] == null && !required) return '';
  if (typeof body[key] !== 'string') throw new Error('Invalid field');
  const value = body[key].trim();
  if ((required && !value) || value.length > max || (key !== 'message' && /[\r\n\0]/.test(value))) throw new Error('Invalid field');
  return value;
}
function validOrigin(origin) {
  const allowed = new Set(['https://imsmethod.com', 'https://www.imsmethod.com']);
  // Exact trusted deployment host, never the incoming Host header or a *.vercel.app wildcard.
  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host && /^[a-z0-9.-]+\.vercel\.app$/i.test(host)) allowed.add('https://' + host);
  }
  return !origin || allowed.has(origin);
}
function syncUrl() {
  if (!process.env.IMS_COACH_OS_SYNC_URL || !process.env.IMS_WEBSITE_SYNC_SECRET) return null;
  try {
    const url = new URL(process.env.IMS_COACH_OS_SYNC_URL);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/integrations/website-lead') return null;
    return url.toString();
  } catch { return null; }
}
async function send(payload, key) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Provider rejected request');
  const result = await response.json();
  if (typeof result.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(result.id)) throw new Error('Provider acceptance unconfirmed');
  return result.id;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!validOrigin(req.headers.origin)) return json(res, 403, { error: 'Invalid origin' });
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) return json(res, 413, { error: 'Message too long' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'Invalid form' });
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) return json(res, 413, { error: 'Message too long' });
  if (body.botcheck) return json(res, 200, { ok: true });
  let name, email, phone, message;
  try {
    name = field(body, 'name', 120, true);
    email = field(body, 'email', 254, true).toLowerCase();
    phone = field(body, 'phone', 60);
    message = field(body, 'message', 4000, true);
    if (!validEmail(email)) throw new Error('Invalid email');
  } catch { return json(res, 400, { error: 'Please provide a valid name, email and message under 4,000 characters.' }); }
  if (process.env.VERCEL_ENV === 'preview' && process.env.IMS_CONTACT_PREVIEW_SEND_ENABLED !== 'true')
    return json(res, 503, { error: 'Sending is disabled on this preview.' });
  const owner = process.env.CONTACT_INBOX || 'admin@imsfitnesscenter.com';
  const from = process.env.RESEND_FROM_EMAIL;
  if (!process.env.RESEND_API_KEY || !from || !validEmail(owner)) return json(res, 503, { error: 'Contact form temporarily unavailable' });
  const payload = {
    from, to: [owner], reply_to: email, subject: 'IMS website enquiry — ' + name,
    html: `<h2>New website enquiry</h2><p><b>Name:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p><b>Phone:</b> ${escapeHtml(phone || 'Not provided')}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p>Reply directly to this email to reach the visitor.</p>`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
  };
  let reference;
  try { reference = await send(payload, 'ims-contact-owner/' + digest(payload)); }
  catch {
    console.error('[contact] owner_acceptance_unconfirmed');
    return json(res, 502, { error: 'Unable to confirm your message. Please try again or contact the studio directly.' });
  }
  // Await the sync: serverless work must not disappear after the HTTP response.
  const destination = syncUrl();
  if (destination) {
    try {
      const sync = await fetch(destination, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json', 'x-ims-sync-secret': process.env.IMS_WEBSITE_SYNC_SECRET },
        body: JSON.stringify({ name, email, phone, message, inquiry_id: reference }),
      });
      const result = sync.ok ? await sync.json().catch(() => null) : null;
      console.info('[contact] coach_os', reference, result?.ok === true ? 'recorded' : 'needs_reconciliation');
    } catch { console.error('[contact] coach_os_needs_reconciliation', reference); }
  } else { console.warn('[contact] coach_os_not_configured', reference); }
  // This acknowledgement is NOT a coach reply or proof the email was delivered.
  // Its failure must not turn an accepted studio message into a false form failure.
  try {
    const acknowledgement = {
      from, to: [email], reply_to: owner, subject: 'We received your message — IMS',
      html: `<p>Hi ${escapeHtml(name.split(' ')[0])},</p><p>Thanks for reaching out to Innovative Movement Solutions. Your message has been accepted and the studio will respond personally.</p><p>Jason Patterson · IMS<br><a href="https://imsmethod.com">imsmethod.com</a> · (619) 937-1434</p>`,
      text: `Hi ${name.split(' ')[0]},\n\nThanks for reaching out to IMS. Your message has been accepted and the studio will respond personally.\n\nJason Patterson · IMS\n(619) 937-1434`,
    };
    await send(acknowledgement, 'ims-contact-ack/' + digest({ reference, acknowledgement }));
  } catch { console.warn('[contact] acknowledgement_unconfirmed', reference); }
  return json(res, 200, { ok: true });
}
