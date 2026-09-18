const { complete } = require('./aiClient');

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

beforeEach(() => {
  global.fetch = jest.fn();
  process.env.AI_API_KEY = 'test-key';
});
afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
});

describe('aiClient — missing key', () => {
  test('throws before making any network call when AI_API_KEY is unset', async () => {
    delete process.env.AI_API_KEY;
    await expect(complete('sys', 'user')).rejects.toThrow('AI_API_KEY is not configured');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('aiClient — Anthropic (default provider)', () => {
  beforeEach(() => { delete process.env.AI_PROVIDER; });

  test('calls the Anthropic Messages endpoint with the right shape', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'anthropic says hi' }] }),
    });

    const result = await complete('system prompt', 'user prompt');

    expect(result).toBe('anthropic says hi');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(options.headers['x-api-key']).toBe('test-key');
    const body = JSON.parse(options.body);
    expect(body.system).toBe('system prompt');
    expect(body.messages[0].content).toBe('user prompt');
  });

  test('throws with the response body on a non-ok status', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'invalid x-api-key' });
    await expect(complete('sys', 'user')).rejects.toThrow(/Anthropic returned 401/);
  });
});

describe('aiClient — Gemini', () => {
  beforeEach(() => { process.env.AI_PROVIDER = 'gemini'; });

  test('calls the Gemini generateContent endpoint with the right shape', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'gemini says hi' }] } }] }),
    });

    const result = await complete('system prompt', 'user prompt');

    expect(result).toBe('gemini says hi');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent');
    expect(options.headers['x-goog-api-key']).toBe('test-key');
    const body = JSON.parse(options.body);
    expect(body.systemInstruction.parts[0].text).toBe('system prompt');
    expect(body.contents[0].parts[0].text).toBe('user prompt');
  });

  test('respects GEMINI_MODEL override', async () => {
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });

    await complete('sys', 'user');

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('gemini-2.5-flash:generateContent');
  });

  test('throws a Gemini-specific error including the model name on a non-ok status', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, text: async () => 'model not found' });
    await expect(complete('sys', 'user')).rejects.toThrow(/Gemini returned 404 for model "gemini-3.1-flash-lite"/);
  });

  test('returns an empty string (not a crash) when candidates is empty — e.g. a safety-filtered response', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });
    const result = await complete('sys', 'user');
    expect(result).toBe('');
  });
});

describe('aiClient — unknown provider', () => {
  test('throws a clear error rather than silently falling back to a default', async () => {
    process.env.AI_PROVIDER = 'openai'; // not supported
    await expect(complete('sys', 'user')).rejects.toThrow(/Unknown AI_PROVIDER "openai"/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});