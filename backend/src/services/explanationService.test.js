jest.mock('./aiClient');
const aiClient = require('./aiClient');
const { generateExplanations, fallbackExplanation, parseResponse } = require('./explanationService');

const sampleChanges = [
  { key: 'POST /users::field::password', endpoint: 'POST /users', scope: 'field', classification: 'breaking', ruleName: 'field-removed', before: { field: 'password', type: 'string', required: true }, after: null },
  { key: 'POST /users::field::age', endpoint: 'POST /users', scope: 'field', classification: 'ambiguous', ruleName: 'type-widened', before: { field: 'age', type: 'int32', required: false }, after: { field: 'age', type: 'int64', required: false } },
];

afterEach(() => jest.resetAllMocks());

describe('explanationService — happy path', () => {
  test('returns a key -> explanation map from a well-formed AI response', async () => {
    aiClient.complete.mockResolvedValue(JSON.stringify([
      { key: 'POST /users::field::password', explanation: 'The password field is gone.' },
      { key: 'POST /users::field::age', explanation: 'The age field widened.' },
    ]));

    const map = await generateExplanations(sampleChanges);
    expect(map.size).toBe(2);
    expect(map.get('POST /users::field::password')).toBe('The password field is gone.');
  });

  test('tolerates markdown code fences around the JSON', async () => {
    aiClient.complete.mockResolvedValue('```json\n[{"key":"POST /users::field::age","explanation":"Widened."}]\n```');
    const map = await generateExplanations(sampleChanges);
    expect(map.get('POST /users::field::age')).toBe('Widened.');
  });

  test('makes exactly one provider call regardless of change count (ADR-002)', async () => {
    aiClient.complete.mockResolvedValue('[]');
    await generateExplanations(sampleChanges);
    expect(aiClient.complete).toHaveBeenCalledTimes(1);
  });

  test('makes no provider call when there are no changes', async () => {
    const map = await generateExplanations([]);
    expect(aiClient.complete).not.toHaveBeenCalled();
    expect(map.size).toBe(0);
  });
});

describe('explanationService — degradation (ADR-002)', () => {
  test('returns an empty map instead of throwing when the provider errors', async () => {
    aiClient.complete.mockRejectedValue(new Error('503 Service Unavailable'));
    await expect(generateExplanations(sampleChanges)).resolves.toEqual(new Map());
  });

  test('returns an empty map when the provider times out', async () => {
    aiClient.complete.mockRejectedValue(new Error('AI request timed out after 20000ms'));
    await expect(generateExplanations(sampleChanges)).resolves.toEqual(new Map());
  });

  test('returns an empty map when the response is not valid JSON', async () => {
    aiClient.complete.mockResolvedValue('Sure! Here are your explanations:');
    await expect(generateExplanations(sampleChanges)).resolves.toEqual(new Map());
  });

  test('returns an empty map when the response is JSON but not an array', async () => {
    aiClient.complete.mockResolvedValue('{"key":"x","explanation":"y"}');
    await expect(generateExplanations(sampleChanges)).resolves.toEqual(new Map());
  });
});

describe('explanationService — response schema validation', () => {
  const validKeys = new Set(['a', 'b']);

  test('drops items with keys the diff engine never produced', () => {
    const map = parseResponse('[{"key":"a","explanation":"ok"},{"key":"hallucinated","explanation":"nope"}]', validKeys);
    expect(map.size).toBe(1);
    expect(map.has('hallucinated')).toBe(false);
  });

  test('drops structurally invalid items but keeps valid siblings', () => {
    const map = parseResponse('[{"key":"a","explanation":"ok"},{"key":"b"},{"explanation":"orphan"},null]', validKeys);
    expect(map.size).toBe(1);
    expect(map.get('a')).toBe('ok');
  });

  test('drops empty-string explanations', () => {
    const map = parseResponse('[{"key":"a","explanation":"   "}]', validKeys);
    expect(map.size).toBe(0);
  });
});

describe('fallbackExplanation', () => {
  test('produces deterministic prose for a known rule', () => {
    const text = fallbackExplanation(sampleChanges[0]);
    expect(text).toContain('password');
    expect(text).toContain('POST /users');
  });

  test('falls back to a generic form for an unknown rule name', () => {
    const text = fallbackExplanation({ endpoint: 'GET /x', ruleName: 'some-future-rule', classification: 'breaking' });
    expect(text).toContain('some-future-rule');
  });

  test('never throws even when the change is missing expected fields', () => {
    expect(() => fallbackExplanation({ endpoint: 'GET /x', ruleName: 'field-removed', classification: 'breaking', before: null })).not.toThrow();
  });
});