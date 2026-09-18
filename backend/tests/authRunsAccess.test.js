// Sets REQUIRE_AUTH before requiring the app. Jest gives each test FILE its
// own module registry, so this file's copy of routes/runs.js reads
// REQUIRE_AUTH=true while every other test file's copy reads the default
// (false) — the two modes are tested in isolation without interfering.
process.env.REQUIRE_AUTH = 'true';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const { issueToken } = require('../src/services/authService');
const before = require('./fixtures/before.json');
const after = require('./fixtures/after.json');

const validToken = issueToken({ _id: '507f1f77bcf86cd799439011', username: 'nandish' }).token;

describe('REQUIRE_AUTH=true — access control on /api/run', () => {
  test('POST /api/run is rejected with 401 when no token is sent', async () => {
    const res = await request(app).post('/api/run').send({ beforeRows: before, afterRows: after });
    expect(res.status).toBe(401);
  });

  test('POST /api/run succeeds with a valid token (diff still works with no DB connected)', async () => {
    const res = await request(app)
      .post('/api/run')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ beforeRows: before, afterRows: after });

    expect(res.status).toBe(200);
    expect(res.body.summary.totalChanges).toBe(14);
    // No live DB in this test environment — proves auth and the diff/explain
    // flow are independent of persistence, exactly as ADR-001 intends.
    expect(res.body.persisted).toBe(false);
  });

  test('POST /api/run is rejected with 401 on a garbage token', async () => {
    const res = await request(app)
      .post('/api/run')
      .set('Authorization', 'Bearer garbage')
      .send({ beforeRows: before, afterRows: after });
    expect(res.status).toBe(401);
  });

  test('GET /api/run is rejected with 401 before the persistence check ever runs', async () => {
    // With no token, auth must fail first — an unauthenticated caller should
    // never learn whether the database happens to be up or down.
    const res = await request(app).get('/api/run');
    expect(res.status).toBe(401);
  });

  test('GET /api/run with a valid token passes auth, then reports 503 (no DB in this environment)', async () => {
    const res = await request(app).get('/api/run').set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(503);
  });

  test('GET /api/run/:id is rejected with 401 when no token is sent', async () => {
    const res = await request(app).get('/api/run/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
  });
});