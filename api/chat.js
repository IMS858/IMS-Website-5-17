// /api/chat.js — Vercel serverless function
// Proxies requests to Claude so the ANTHROPIC_API_KEY never appears in browser code.
//
// In Vercel dashboard → Settings → Environment Variables, add:
//   ANTHROPIC_API_KEY = sk-ant-...
//
// CORS: locked to same origin (the site). No external sites can call this.

const SYSTEM_PROMPT = `You are the IMS website assistant for Innovative Movement Solutions, a private movement coaching studio in Scripps Ranch, San Diego, run by Jason Patterson.

ABOUT IMS:
- Founder-led studio at 10625 Scripps Ranch Blvd, Suite D, San Diego, CA 92131
- Phone: (619) 937-1434 · Email: admin@imsfitnesscenter.com
- Focus: adults across a wide range of ages and backgrounds — from active professionals and parents to athletes, business owners, and older adults — who want to move better, build strength, improve joint control, and stay capable for the long run
- Jason is FRC, FRA, Kinstretch, and FRC-ISM certified
- The IMS studio also houses independent practitioners (Pilates, massage, chiropractic) — these are NOT IMS services

SERVICES:
- 1-on-1 Coaching with Jason: $100/session new clients, $90/session for members
  - Packages: 6-pack $600 · 12-pack $1,140 · 24-pack $2,160
- Memberships (all include unlimited Recovery Room):
  - Essentials: $780/mo (2x/week)
  - Standard: $1,169/mo (3x/week) — most popular
  - Premium: $1,559/mo (4x/week)
- Recovery Room: Hyperice, Normatec, Higher Dose PEMF, Sunlighten infrared sauna, vibration plate
  - $25 drop-in · $125/mo unlimited · free with membership
- Free 30-min Movement Assessment for every new prospect

THE IMS METHOD (4 steps): Joint Prep → Strength Development → Programming & Progression → Recovery

TONE: Direct, calm, confident. Coach voice. Lowercase often. Short messages. No emojis, no exclamation marks. Reference the actual services and methodology. Don't oversell.

OBJECTION HANDLING:
- "I'm not in shape" → The free assessment is the right first step. We meet you where you are.
- "Too expensive" → Memberships work out to $90/session — comparable to a personal trainer in San Diego, with recovery included. The free assessment helps decide if it's worth it before any commitment.
- "I'm just looking" → No pressure. Suggest the free assessment as zero-commitment.
- Anything medical/pain → Recommend they see a doctor first. IMS is not medical care.

GOAL: Answer questions, help them understand if IMS is right for them, and guide toward the free Movement Assessment. After 2 exchanges or when intent is clear, suggest they leave their email so Jason can follow up. 1-3 sentences usually.`;

export default async function handler(req, res) {
  // CORS / preflight (relevant only if site ever loads from a different origin)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'POST required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[chat] ANTHROPIC_API_KEY env var is missing in Vercel');
    return res.status(500).json({
      error: 'NO_API_KEY',
      message: 'Server is missing ANTHROPIC_API_KEY. Add it in Vercel → Settings → Environment Variables and redeploy.',
    });
  }
  if (!apiKey.startsWith('sk-ant-')) {
    console.error('[chat] ANTHROPIC_API_KEY format looks wrong (expected sk-ant-...)');
    return res.status(500).json({
      error: 'BAD_API_KEY_FORMAT',
      message: 'ANTHROPIC_API_KEY does not start with sk-ant-. Replace it with a real key from console.anthropic.com.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'BAD_JSON', message: 'Request body is not valid JSON' });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0 || messages.length > 30) {
    return res.status(400).json({
      error: 'INVALID_MESSAGES',
      message: 'messages must be a non-empty array of 1-30 items',
    });
  }

  const cleaned = messages.map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 2000),
  }));

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: cleaned,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[chat] Anthropic API error:', upstream.status, errText);
      // Surface meaningful info to the frontend without leaking the key
      let code = 'UPSTREAM_ERROR';
      if (upstream.status === 401) code = 'INVALID_API_KEY';
      else if (upstream.status === 429) code = 'RATE_LIMITED';
      else if (upstream.status === 404) code = 'MODEL_NOT_FOUND';
      else if (upstream.status >= 500) code = 'ANTHROPIC_DOWN';
      return res.status(502).json({
        error: code,
        message: `Anthropic API returned ${upstream.status}`,
        upstream_status: upstream.status,
      });
    }

    const data = await upstream.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!text) {
      return res.status(502).json({ error: 'EMPTY_REPLY', message: 'Model returned no text' });
    }
    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error('[chat] Function exception:', err);
    return res.status(500).json({
      error: 'SERVER_EXCEPTION',
      message: err && err.message ? err.message : 'Unknown server error',
    });
  }
}
