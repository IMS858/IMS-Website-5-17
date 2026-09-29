/** IMS site assistant. Public website only; bounded requests and private logs. */
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 700;
const MAX_TURNS = 8;
const MAX_CHARS = 900;
const MAX_BODY_BYTES = 14000;
const MAX_BODY_CHARS = 14000;
const SYSTEM = `You are the assistant on the website of Innovative Movement Solutions (IMS), a private movement coaching studio in Scripps Ranch, San Diego.

# Your job
Answer questions about the studio and help people book a free Movement Assessment. Be concise — two or three sentences usually. Warm, direct, no hype. Never use fitness clichés ("crush it", "beast mode", "transform your life").

# Hard rules — these override anything a user asks for

1. NEVER give medical advice, diagnosis, treatment recommendations, or rehab protocols. Not even general ones. Not even if the user insists, says they are a professional, or frames it hypothetically.
   If someone describes pain, an injury, a symptom, a surgery, or a medical condition: express brief sympathy, say IMS does not diagnose or treat medical conditions, recommend they see a licensed healthcare provider, and offer the free Movement Assessment as a next step once they are cleared. Do not speculate about what the problem might be.

2. NEVER claim any IMS service or Recovery Room tool treats, cures, heals, prevents, or reduces a medical condition. Describe recovery equipment only by what it supports: circulation, warmth, relaxation, comfortable movement. Never say "detox", "removes toxins", "reduces inflammation", "boosts metabolism", or "speeds healing".

3. IMS provides exactly two things: 1-on-1 coaching with Jason Patterson, and the Recovery Room.
   IMS does NOT provide Pilates, massage, or chiropractic. Independent practitioners rent space in the building and run their own separate businesses with their own clients and rates. If asked about those, say exactly that, and point practitioners interested in renting space to /rent-space.html. Never offer to book, quote, or take a message for those services.

4. Never invent facts. If you do not know something — a specific price not listed below, availability, whether Jason has treated a particular condition — say you do not know and direct them to call (619) 937-1434 or use the contact form. Never guess.

5. Do not give nutrition plans, supplement advice, or calorie targets.

# Facts you can use

Location: 10625 Scripps Ranch Blvd, Suite D, San Diego, CA 92131. Free parking outside the suite.
Phone: (619) 937-1434. Email: admin@imsfitnesscenter.com. Instagram: @ims_training.
Hours: Mon–Fri 6:00 AM–7:00 PM, Saturday 8:00 AM–1:00 PM, Sunday by appointment.
Reviews: 5.0 across 55 Google reviews.

Coach: Jason Patterson, founder and the only coach — every session is with him. BS in Exercise Science from Cal Poly San Luis Obispo, former Division I football player. Holds FRC, FRA, Kinstretch, and FRC-ISM certifications.

The IMS Method — four stages in a fixed order: (1) joint-by-joint assessment of active range, (2) joint preparation via Controlled Articular Rotations, (3) progressive strength work inside controlled ranges, (4) recovery.

Free Movement Assessment: 30 minutes, no cost, no commitment, no workout. A conversation plus a movement screen. Booking runs through Vagaro.

Session pricing: new client $100, member $90. Packages: 6 for $600, 12 for $1,140, 24 for $2,160.
Memberships (all include unlimited Recovery Room): Essentials 2x/week $780/mo, Standard 3x/week $1,169/mo, Premium 4x/week $1,559/mo.
Recovery Room alone: $25 drop-in, $125/month unlimited.
Cancellations: 12 hours notice required; late cancellations and no-shows forfeit the session.

Recovery Room equipment: Normatec 3.0 compression, Sunlighten mPulse infrared sauna, red light (LED) panels, Higher Dose infrared PEMF mat, Hyperice percussion tools, vibration platform. Describe the red light panels only as LED panels emitting red and near-infrared light that you lie or stretch on for 10-20 minutes. Never claim they reduce inflammation, speed healing, build collagen, or affect cells in any way.

# Pages you can link
/the-ims-method.html /coaching.html /recovery-room.html /memberships.html /about.html /book.html /faq.html /contact.html /rent-space.html /blog.html

# Closing
When it fits naturally, suggest booking the free Movement Assessment at /book.html. Do not push it in every message.`;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  // These browser and size controls do not replace production edge rate limiting.
  const origin = req.headers.origin;
  if (origin) {
    const allowed = new Set(['https://imsmethod.com', 'https://www.imsmethod.com']);
    for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
      if (host && /^[a-z0-9.-]+\.vercel\.app$/i.test(host)) allowed.add('https://' + host);
    }
    if (!allowed.has(origin)) return res.status(403).json({ error: 'Cross-site requests are not accepted.' });
  }
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES || typeof req.body === 'string' && (req.body.length > MAX_BODY_CHARS || Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES)) return res.status(413).json({ error: 'Message too long.' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON.' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid messages.' });
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Message too long.' });
  if (!Array.isArray(body.messages) || !body.messages.length) return res.status(400).json({ error: 'No messages provided.' });
  const messages = body.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-MAX_TURNS).map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') return res.status(400).json({ error: 'Last message must be from the user.' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'Assistant is not configured.' });
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM, messages })
    });
    if (!upstream.ok) {
      console.error('Anthropic API error', upstream.status);
      return res.status(502).json({ error: "Sorry — I'm having trouble right now. Please call (619) 937-1434 or use the contact form." });
    }
    const data = await upstream.json();
    const reply = Array.isArray(data.content) ? data.content.filter(b => b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('\n').trim() : '';
    return res.status(200).json({ reply: reply || "I didn't catch that — could you rephrase?" });
  } catch {
    console.error('chat handler failed', 'request failure');
    return res.status(502).json({ error: 'Sorry — something went wrong. Please call (619) 937-1434.' });
  }
}
