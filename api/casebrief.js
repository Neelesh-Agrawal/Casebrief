export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing GROQ_API_KEY',
      detail: 'Set GROQ_API_KEY in your Vercel project environment variables.'
    });
  }

  try {
    const body = req.body ?? {};
    const system = body.system ?? '';
    const inputMessages = Array.isArray(body.messages) ? body.messages : [];

    // Frontend currently sends Anthropic-style payload; translate it to OpenAI-compatible chat.completions.
    const messages = [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...inputMessages
        .filter(m => m && typeof m === 'object')
        .map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content ?? '')
        }))
    ];

    const requestedModel =
      typeof body.model === 'string' && body.model.trim() ? body.model.trim() : 'llama-3.1-8b-instant';
    const fallbackModel = 'llama-3.1-8b-instant';

    async function callGroq(model) {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: typeof body.temperature === 'number' ? body.temperature : 0.4,
          max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 1200
        })
      });
      const data = await upstream.json().catch(() => ({}));
      return { upstream, data };
    }

    let usedModel = requestedModel;
    let { upstream, data } = await callGroq(usedModel);

    if (!upstream.ok) {
      const detail = data?.error?.message || data?.message || JSON.stringify(data);
      const looksLikeModelIssue =
        upstream.status === 400 && /model|not found|does not exist|invalid/i.test(String(detail));

      if (looksLikeModelIssue && usedModel !== fallbackModel) {
        usedModel = fallbackModel;
        ({ upstream, data } = await callGroq(usedModel));
      }
    }

    if (!upstream.ok) {
      const detail = data?.error?.message || data?.message || JSON.stringify(data);
      return res.status(upstream.status).json({
        error: 'Groq API call failed',
        detail,
        requestedModel,
        usedModel
      });
    }

    const text = data?.choices?.[0]?.message?.content ?? '';

    // Keep response compatible with existing frontend parsing (Anthropic-style `content` blocks).
    return res.status(200).json({
      usedModel,
      content: [{ type: 'text', text }]
    });
  } catch (error) {
    return res.status(500).json({ error: 'API call failed', detail: error?.message || String(error) });
  }
}

