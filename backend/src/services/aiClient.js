const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Read lazily (not at module load) so tests — and a running process, via a
// restart — can change provider/model without any code change.
function getProvider() {
  return (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
}
function getAnthropicModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
}
function getGeminiModel() {
  // gemini-3.1-flash-lite: stable (since May 2026), no announced shutdown,
  // cheapest current tier — the safe default. Override with GEMINI_MODEL if
  // your AI Studio project has a different model enabled.
  return process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
}

/**
 * Thin provider adapter — the only file that knows any AI vendor's wire
 * format (ADR-002). Dispatches on AI_PROVIDER so swapping providers is an
 * .env change, not a code change.
 */
async function complete(systemPrompt, userPrompt) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY is not configured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const provider = getProvider();
    if (provider === 'gemini') return await callGemini(apiKey, systemPrompt, userPrompt, controller.signal);
    if (provider === 'anthropic') return await callAnthropic(apiKey, systemPrompt, userPrompt, controller.signal);
    throw new Error(`Unknown AI_PROVIDER "${provider}" — expected "anthropic" or "gemini"`);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`AI request timed out after ${TIMEOUT_MS}ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropic(apiKey, systemPrompt, userPrompt, signal) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: getAnthropicModel(),
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic returned ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

async function callGemini(apiKey, systemPrompt, userPrompt, signal) {
  const url = `${GEMINI_URL_BASE}/${getGeminiModel()}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      // Header auth (not ?key=... in the URL) so the key never lands in
      // server access logs or an intermediate proxy's logs.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Gemini's most common failure mode isn't a bad key, it's a model name
    // your project doesn't have access to — surface the body so that's
    // visible in logs instead of looking identical to an auth failure.
    throw new Error(`Gemini returned ${res.status} for model "${getGeminiModel()}": ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('\n');
}

module.exports = { complete, getProvider, getAnthropicModel, getGeminiModel, TIMEOUT_MS };