jest.mock('../src/services/aiClient');
const request = require('supertest');
const aiClient = require('../src/services/aiClient');
const app = require('../src/app');
const before = require('./fixtures/before.json');
const after = require('./fixtures/after.json');
const malformedDuplicate = require('./fixtures/malformed-duplicate.json');

// No Mongo connection in the test environment — this is deliberate. Every
// assertion below runs with persistence unavailable, which proves the core
// flow does not depend on the database (ADR-001).

afterEach(() => jest.resetAllMocks());

describe('POST /api/runs — happy path', () => {
  test('returns changes, summary and explanations', async () => {
    aiClient.complete.mockResolvedValue('[]'); // valid response, no explanations -> fallbacks used

    const res = await request(app).post('/api/runs').send({ beforeRows: before, afterRows: after });

    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual({ totalChanges: 14, breakingCount: 7, nonBreakingCount: 4, ambiguousCount: 3 });
    expect(res.body.changes).toHaveLength(14);
    res.body.changes.forEach((c) => {
      expect(typeof c.explanation).toBe('string');
      expect(c.explanation.length).toBeGreaterThan(0);
    });
  });

  test('marks explanationSource so the UI can show which text came from AI', async () => {
    aiClient.complete.mockResolvedValue(JSON.stringify([
      { key: 'POST /users::field::password', explanation: 'AI-written text.' },
    ]));

    const res = await request(app).post('/api/runs').send({ beforeRows: before, afterRows: after });
    const aiOne = res.body.changes.find((c) => c.key === 'POST /users::field::password');
    const fallbackOne = res.body.changes.find((c) => c.key !== 'POST /users::field::password');

    expect(aiOne.explanationSource).toBe('ai');
    expect(fallbackOne.explanationSource).toBe('fallback');
  });
});

describe('POST /api/runs — AI failure degrades gracefully (ADR-002)', () => {
  test('still returns the full categorized diff when the AI provider is down', async () => {
    aiClient.complete.mockRejectedValue(new Error('provider unreachable'));

    const res = await request(app).post('/api/runs').send({ beforeRows: before, afterRows: after });

    expect(res.status).toBe(200);
    expect(res.body.summary.totalChanges).toBe(14);
    expect(res.body.aiDegraded).toBe(true);
    res.body.changes.forEach((c) => {
      expect(c.explanationSource).toBe('fallback');
      expect(c.explanation.length).toBeGreaterThan(0);
    });
  });
});

describe('POST /api/runs — validation', () => {
  test('400 when beforeRows is not an array', async () => {
    const res = await request(app).post('/api/runs').send({ beforeRows: 'nope', afterRows: after });
    expect(res.status).toBe(400);
  });

  test('400 with per-row details when rows are malformed', async () => {
    const res = await request(app).post('/api/runs').send({
      beforeRows: [{ endpoint: 'POST /users', kind: 'field' }],
      afterRows: after,
    });
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('400 reports every malformed row at once, not just the first', async () => {
    const res = await request(app).post('/api/runs').send({
      beforeRows: [
        { endpoint: '', kind: 'field', field: 'a', type: 'string', required: true },
        { endpoint: 'POST /x', kind: 'nonsense', field: 'b', type: 'string', required: true },
      ],
      afterRows: after,
    });
    expect(res.body.details).toHaveLength(2);
  });

  test('422 on duplicate composite keys (well-formed rows, semantic violation)', async () => {
    const res = await request(app).post('/api/runs').send({ beforeRows: malformedDuplicate, afterRows: after });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Duplicate composite key/);
  });

  test('422 on an empty table', async () => {
    const res = await request(app).post('/api/runs').send({ beforeRows: [], afterRows: after });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/non-empty array/);
  });
});

describe('run history when the database is unavailable', () => {
  test('GET /api/runs returns 503 rather than hanging or crashing', async () => {
    const res = await request(app).get('/api/runs');
    expect(res.status).toBe(503);
  });

  test('POST /api/runs still succeeds with persisted: false', async () => {
    aiClient.complete.mockResolvedValue('[]');
    const res = await request(app).post('/api/runs').send({ beforeRows: before, afterRows: after });
    expect(res.status).toBe(200);
    expect(res.body.persisted).toBe(false);
    expect(res.body.runId).toBeNull();
  });
});

describe('GET /health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});                 