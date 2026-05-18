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
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: no API key' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Bad JSON' });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : null;
  if (!messages || messages.length === 0 || messages.length > 30) {
    return res.status(400).json({ error: 'Invalid messages array' });
  }

  // Basic sanitization: ensure each message has role + content as strings
  const cleaned = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 2000),
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error('Chat function error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
