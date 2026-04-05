export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;

  if (!type || !data) return res.status(400).json({ error: 'Missing type or data' });

  let prompt = '';

  if (type === 'quote') {
    prompt = `You are James from FJMedia, a web design agency in Winnipeg that builds custom websites for local small businesses. Write a short, professional quote message to send to a prospect.

Client Info:
- Name: ${data.clientName}
- Business: ${data.businessName}
- Industry: ${data.industry}
- Package Interest: ${data.package}
- Notes: ${data.notes || 'None'}

FJMedia Packages:
- Get Found: $600 — custom site, mobile-optimized, contact form, SEO setup, 1 month free changes
- Get Customers: $1,000 — everything in Get Found + booking form, Google Sheets CRM, email alerts, GA4 analytics, 3 months free changes
- Own the Market: $1,600 — everything in Get Customers + 2-3 design versions, auto-reply emails, custom domain setup, schema markup, 6 months maintenance
- Event Site: $300 — single-page event site, prize gallery, delivered in 4 days
- Custom Linktree: $300 — custom link-in-bio, delivered in 2 days
- Monthly Maintenance: from $150/mo

Key differentiator: No upfront cost — we build the site first, they see it, then they decide to pay.

Write a quote message that:
1. Addresses them by first name, warm and direct
2. References their business and what they need
3. Clearly states the package and price
4. Reminds them of the no-upfront-cost model
5. Ends with a clear next step (book a quick call or reply to confirm)

Keep it under 150 words. Conversational, confident, no corporate fluff. Sign off as James — FJMedia.`;

  } else if (type === 'proposal') {
    prompt = `You are James from FJMedia, a web design agency in Winnipeg. Write a short, clean proposal for a potential client.

Client Info:
- Name: ${data.clientName}
- Business: ${data.businessName}
- Industry: ${data.industry}
- Package: ${data.package}
- Notes: ${data.notes || 'None'}

FJMedia core offer: No upfront cost. We build first, they see it, then they pay. Custom built from scratch, not templates.

Write a proposal with these sections:
1. **What We'll Build** — brief description tailored to their industry and package
2. **What's Included** — bullet list of deliverables for their package
3. **Investment** — package name + price, with the no-upfront-cost guarantee called out clearly
4. **Timeline** — realistic delivery estimate based on their package
5. **Next Step** — one clear action (book a call, reply to confirm, etc.)

Keep it tight — under 300 words total. Professional but human. No filler. Sign off as James — FJMedia.`;

  } else if (type === 'followup') {
    prompt = `You are James from FJMedia, a web design agency in Winnipeg. Write a follow-up message sequence for a prospect who hasn't replied.

Client Info:
- Name: ${data.clientName}
- Business: ${data.businessName}
- Last Contact: ${data.lastContact || 'a few days ago'}
- Context: ${data.notes || 'Had initial interest, no reply yet'}

Write 3 short follow-up messages:

**Follow-up 1 (Day 3):** Gentle check-in. Reference their business specifically. Keep it 2-3 sentences.

**Follow-up 2 (Day 7):** Add value — mention something relevant to their industry (a tip, a stat, or a reminder of the no-upfront offer). 3-4 sentences.

**Follow-up 3 (Day 14):** Last touch. Low pressure, leave the door open. 2-3 sentences.

Each message should feel personal, not copy-paste. Reference their business name. Confident but not pushy. Sign off as James — FJMedia.`;

  } else {
    return res.status(400).json({ error: 'Invalid type. Use: quote, proposal, followup' });
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
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'AI error' });
    }

    const result = await response.json();
    res.json({ output: result.content[0].text });

  } catch (err) {
    console.error('Ops error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
