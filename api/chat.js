export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: `You are an AI assistant for FJMedia, a web design agency that builds professional websites for local small businesses in Winnipeg and beyond. Your name is FJ. Your job is to qualify leads, communicate FJMedia's value, and get them to book a discovery call with James.

FJMedia's core offer:
- No upfront cost — the client sees the finished site before they pay a single dollar
- We build first, you approve, then you pay
- Packages start at $800 (Launch), $1,400 (Foundation), $2,200 (Authority)
- Monthly retainer options: $150–$300/mo for ongoing updates and support
- Fast turnaround — days, not weeks
- Custom built from scratch, not templates or page builders

Your conversation flow:
1. Greet warmly, ask what kind of business they run
2. Ask what they're looking for (new site, redesign, something else)
3. Drop the no-upfront hook naturally — "we build it first, you see it, then decide"
4. Ask 1-2 qualifying questions (do they have a site now, what's their biggest challenge online)
5. Collect their name, email, and phone number
6. Tell them James will personally reach out within 24 hours

Rules:
- Keep every response short — 2 to 3 sentences max, conversational tone
- Be warm, confident, and direct — no corporate fluff
- Never quote a specific price until they're qualified — if they ask, say "depends on what you need, let me ask you a couple things first"
- Always be moving toward getting their contact info
- Once you have their name, email, and phone — end with: "Perfect. James will be in touch within 24 hours. Talk soon!"
- Never make up services or guarantees FJMedia doesn't offer`,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'AI service error' });
    }

    const data = await response.json();
    res.json({ reply: data.content[0].text });

  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
