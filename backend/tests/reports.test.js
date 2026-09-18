const request = require('supertest');
const app = require('../src/app');
const before = require('./fixtures/before.json');
const after = require('./fixtures/after.json');
const { diff } = require('../src/diffEngine/diffEngine');

function sampleRun() {
  const changes = diff(before, after).map((c) => ({ ...c, explanation: 'test explanation', explanationSource: 'fallback' }));
  const summary = {
    totalChanges: changes.length,
    breakingCount: changes.filter((c) => c.classification === 'breaking').length,
    nonBreakingCount: changes.filter((c) => c.classification === 'non-breaking').length,
    ambiguousCount: changes.filter((c) => c.classification === 'ambiguous').length,
  };
  return { changes, summary };
}

describe('POST /api/reports/pdf', () => {
  test('returns a PDF stream for a valid run', async () => {
    const res = await request(app).post('/api/reports/pdf').send(sampleRun());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="breaking-change-report-\d+\.pdf"/);
    // First 4 bytes of any valid PDF are the literal signature "%PDF"
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
    expect(res.body.length).toBeGreaterThan(500);
  });

  test('produces a larger file for more changes (sanity check on content, not just headers)', async () => {
    const full = await request(app).post('/api/reports/pdf').send(sampleRun());
    const empty = await request(app).post('/api/reports/pdf').send({ changes: [], summary: { totalChanges: 0, breakingCount: 0, nonBreakingCount: 0, ambiguousCount: 0 } });

    expect(full.body.length).toBeGreaterThan(empty.body.length);
  });

  test('400 when changes is missing', async () => {
    const res = await request(app).post('/api/reports/pdf').send({ summary: {} });
    expect(res.status).toBe(400);
  });

  test('400 when summary is missing', async () => {
    const res = await request(app).post('/api/reports/pdf').send({ changes: [] });
    expect(res.status).toBe(400);
  });

  test('works with zero changes (empty-diff report, not an error)', async () => {
    const res = await request(app).post('/api/reports/pdf').send({
      changes: [],
      summary: { totalChanges: 0, breakingCount: 0, nonBreakingCount: 0, ambiguousCount: 0 },
    });
    expect(res.status).toBe(200);
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });
});