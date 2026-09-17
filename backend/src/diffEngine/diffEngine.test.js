const { diff } = require('./diffEngine');
const before = require('../../tests/fixtures/before.json');
const after = require('../../tests/fixtures/after.json');
const malformedDuplicate = require('../../tests/fixtures/malformed-duplicate.json');
const malformedEmpty = require('../../tests/fixtures/malformed-empty.json');

// Every test name maps 1:1 to a row in the Phase 0 edge case matrix.
// Run against the fixtures in tests/fixtures — the same data used in the demo.

describe('diffEngine — classification rules', () => {
  const changes = diff(before, after);
  const byKey = (key) => changes.find((c) => c.key === key);

  test('#1 field removed -> breaking (POST /users.password)', () => {
    const c = byKey('POST /users::field::password');
    expect(c).toMatchObject({ classification: 'breaking', ruleName: 'field-removed' });
  });

  test('#2 field added, optional -> non-breaking (PATCH /users/{id}.notes)', () => {
    const c = byKey('PATCH /users/{id}::field::notes');
    expect(c).toMatchObject({ classification: 'non-breaking', ruleName: 'field-added-optional' });
  });

  test('#3 field added, required -> breaking (POST /users.referralCode)', () => {
    const c = byKey('POST /users::field::referralCode');
    expect(c).toMatchObject({ classification: 'breaking', ruleName: 'field-added-required' });
  });

  test('#4 type changed -> breaking (non-widening case)', () => {
    // Construct directly: role stays 'enum' in the fixture, so exercise a
    // plain incompatible type change with synthetic rows.
    const result = diff(
      [{ endpoint: 'GET /widgets', kind: 'field', field: 'price', type: 'string', required: true, enumValues: null, statusCode: null }],
      [{ endpoint: 'GET /widgets', kind: 'field', field: 'price', type: 'integer', required: true, enumValues: null, statusCode: null }]
    );
    expect(result[0]).toMatchObject({ classification: 'breaking', ruleName: 'type-changed' });
  });

  test('#5 type widened (int32 -> int64) -> ambiguous (POST /users.age)', () => {
    const c = byKey('POST /users::field::age');
    expect(c).toMatchObject({ classification: 'ambiguous', ruleName: 'type-widened' });
  });

  test('#6 required -> optional -> non-breaking (POST /users.isActive)', () => {
    const c = byKey('POST /users::field::isActive');
    expect(c).toMatchObject({ classification: 'non-breaking', ruleName: 'required-to-optional' });
  });

  test('#7 optional -> required -> breaking (POST /users.username)', () => {
    const c = byKey('POST /users::field::username');
    expect(c).toMatchObject({ classification: 'breaking', ruleName: 'optional-to-required' });
  });

  test('#8 status code removed -> breaking (POST /users status 400)', () => {
    const c = byKey('POST /users::status::400');
    expect(c).toMatchObject({ classification: 'breaking', ruleName: 'status-code-removed' });
  });

  test('#9 status code added -> non-breaking (PATCH /users/{id} status 429)', () => {
    const c = byKey('PATCH /users/{id}::status::429');
    expect(c).toMatchObject({ classification: 'non-breaking', ruleName: 'status-code-added' });
  });

  test('#10 status code changed, same operation -> breaking (PATCH /users/{id} 200 -> 204)', () => {
    const c = byKey('PATCH /users/{id}::status::200->204');
    expect(c).toMatchObject({ classification: 'breaking', ruleName: 'status-code-changed' });
  });

  test('#11 field removed + field added, same endpoint/type -> ambiguous possible-rename (fullName -> displayName)', () => {
    const c = byKey('GET /users/{id}::field::fullName->displayName');
    expect(c).toMatchObject({ classification: 'ambiguous', ruleName: 'possible-rename' });
    // Phase 6: rename pairing now carries a confidence score, not just a verdict.
    // fullName/displayName share one word ("name") out of three across both
    // names, both optional, similar length -> a real but not certain signal.
    expect(c.confidence).toBeCloseTo(0.56, 2);
    expect(c.confidenceLabel).toBe('medium');
  });

  test('#11b rename confidence scales with name similarity (high-confidence case)', () => {
    const result = diff(
      [{ endpoint: 'GET /profile', kind: 'field', field: 'userEmail', type: 'string', required: false, enumValues: null, statusCode: null }],
      [{ endpoint: 'GET /profile', kind: 'field', field: 'userEmailAddress', type: 'string', required: false, enumValues: null, statusCode: null }]
    );
    expect(result[0]).toMatchObject({ ruleName: 'possible-rename', confidenceLabel: 'high' });
    expect(result[0].confidence).toBeGreaterThanOrEqual(0.7);
  });

  test('#11c no shared word between a removal and an addition -> reported independently, not paired', () => {
    // password/referralCode fixture pair: both string+required, zero word
    // overlap. Confirms the confidence scorer never overrides the shareAWord
    // gate — same type and same required flag alone must not trigger a rename.
    expect(byKey('POST /users::field::password')).toMatchObject({ ruleName: 'field-removed' });
    expect(byKey('POST /users::field::referralCode')).toMatchObject({ ruleName: 'field-added-required' });
  });

  test('#12 enum value removed -> breaking (POST /users.role: guest removed)', () => {
    const c = byKey('POST /users::field::role');
    expect(c).toMatchObject({ classification: 'breaking', ruleName: 'enum-value-removed' });
  });

  test('#13 enum value added -> non-breaking', () => {
    const result = diff(
      [{ endpoint: 'GET /widgets', kind: 'field', field: 'status', type: 'enum', required: true, enumValues: ['a', 'b'], statusCode: null }],
      [{ endpoint: 'GET /widgets', kind: 'field', field: 'status', type: 'enum', required: true, enumValues: ['a', 'b', 'c'], statusCode: null }]
    );
    expect(result[0]).toMatchObject({ classification: 'non-breaking', ruleName: 'enum-value-added' });
  });

  test('#14 field reordering only -> no change reported (GET /users/{id}.id / createdAt)', () => {
    expect(byKey('GET /users/{id}::field::id')).toBeUndefined();
    expect(byKey('GET /users/{id}::field::createdAt')).toBeUndefined();
  });

  test('#15 endpoint removed entirely -> breaking, reported at endpoint scope (DELETE /users/{id})', () => {
    const c = byKey('DELETE /users/{id}::endpoint');
    expect(c).toMatchObject({ scope: 'endpoint', classification: 'breaking', ruleName: 'endpoint-removed' });
  });

  test('#16 endpoint added entirely -> non-breaking (POST /users/{id}/verify)', () => {
    const c = byKey('POST /users/{id}/verify::endpoint');
    expect(c).toMatchObject({ scope: 'endpoint', classification: 'non-breaking', ruleName: 'endpoint-added' });
  });

  test('#17 duplicate composite key -> validation error, not a diff result', () => {
    expect(() => diff(malformedDuplicate, after)).toThrow(/Duplicate composite key/);
  });

  test('#18 empty table -> validation error, not a diff result', () => {
    expect(() => diff(malformedEmpty, after)).toThrow(/non-empty array/);
  });

  test('#19 field name casing changed -> ambiguous (GET /users.userId -> userid)', () => {
    const c = byKey('GET /users::field::userId');
    expect(c).toMatchObject({ classification: 'ambiguous', ruleName: 'field-casing-changed' });
  });

  test('#20 nested field path (dot notation) -> treated like any other field key', () => {
    const result = diff(
      [{ endpoint: 'GET /profile', kind: 'field', field: 'address.zip', type: 'string', required: true, enumValues: null, statusCode: null }],
      [{ endpoint: 'GET /profile', kind: 'field', field: 'address.zip', type: 'string', required: false, enumValues: null, statusCode: null }]
    );
    expect(result[0]).toMatchObject({
      key: 'GET /profile::field::address.zip',
      classification: 'non-breaking',
      ruleName: 'required-to-optional',
    });
  });

  test('end-to-end: fixture pair produces the expected totals', () => {
    const breaking = changes.filter((c) => c.classification === 'breaking').length;
    const nonBreaking = changes.filter((c) => c.classification === 'non-breaking').length;
    const ambiguous = changes.filter((c) => c.classification === 'ambiguous').length;

    expect(changes).toHaveLength(14);
    expect(breaking).toBe(7);
    expect(nonBreaking).toBe(4);
    expect(ambiguous).toBe(3);
  });
});