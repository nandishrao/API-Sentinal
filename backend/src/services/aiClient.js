// const API_URL = "yet to decide which ai to use depending on the free availibility"  //;
const MODEL = 'claude-sonnet-4-6';
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);

/**
 * Thin provider adapter — the only file that knows the AI vendor's wire format.
 * Swapping providers means rewriting this file and nothing else (ADR-002).
 * The API key is read from the server environment and never leaves this process.
 */
async function complete(systemPrompt, userPrompt) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY is not configured');

  // Explicit timeout: without it a hung provider connection would hold the
  // request open indefinitely and defeat the graceful-degradation path.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`AI provider returned ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`AI request timed out after ${TIMEOUT_MS}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { complete, MODEL, TIMEOUT_MS };