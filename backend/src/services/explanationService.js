const aiClient = require('./aiClient');
const logger = require('../config/logger');

/**
 * The ONLY place in the system that talks to an AI provider (ADR-002).
 * Receives changes the diff engine has ALREADY classified and asks for
 * plain-English phrasing. It never asks the model to classify, and it
 * discards any attempt by the model to disagree with the classification.
 */

const SYSTEM_PROMPT = `You are an API contract reviewer writing short explanations for API testers.

You will receive a JSON array of API contract changes that have ALREADY been analysed and classified by a deterministic rules engine. Your ONLY job is to explain each one in plain English.

Rules:
- Do NOT re-classify. The "classification" field is authoritative and final.
- Explain WHY the change has the impact it has, in terms of what happens to an existing client that has not been updated.
- 1-2 sentences per change. Plain English, no markdown, no jargon beyond standard API terms.
- For "ambiguous" changes, say what a human needs to check to decide.

Respond with ONLY a JSON array, no preamble and no code fences:
[{"key": "<the exact key given to you>", "explanation": "<your explanation>"}]`;

/** Strip only what the model needs — never send full rows or internal state. */
function toPromptPayload(changes) {
  return changes.map((c) => ({
    key: c.key,
    endpoint: c.endpoint,
    scope: c.scope,
    classification: c.classification,
    ruleName: c.ruleName,
    // Only present on possible-rename changes (Phase 6) — lets the model
    // mention confidence in its phrasing without being able to set it.
    confidenceLabel: c.confidenceLabel ?? undefined,
    before: c.before && !Array.isArray(c.before)
      ? { field: c.before.field, type: c.before.type, required: c.before.required, enumValues: c.before.enumValues, statusCode: c.before.statusCode }
      : null,
    after: c.after && !Array.isArray(c.after)
      ? { field: c.after.field, type: c.after.type, required: c.after.required, enumValues: c.after.enumValues, statusCode: c.after.statusCode }
      : null,
  }));
}

/**
 * Parse and validate the model's response against the expected schema.
 * Anything that doesn't match exactly is discarded rather than trusted —
 * a malformed AI response must degrade to the fallback, never corrupt output.
 */
function parseResponse(raw, validKeys) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI response was not valid JSON');
  }
  if (!Array.isArray(parsed)) throw new Error('AI response was not a JSON array');

  const map = new Map();
  for (const item of parsed) {
    if (!item || typeof item.key !== 'string' || typeof item.explanation !== 'string') continue;
    if (!validKeys.has(item.key)) continue; // model invented a key — drop it
    if (item.explanation.trim() === '') continue;
    map.set(item.key, item.explanation.trim());
  }
  return map;
}

/**
 * @param {Array} changes
 * @returns {Promise<Map<string,string>>} key -> explanation. Empty Map on any
 *          failure — callers MUST have a fallback and must never treat a
 *          failure here as fatal (ADR-002).
 */
async function generateExplanations(changes) {
  if (!Array.isArray(changes) || changes.length === 0) return new Map();

  const startedAt = Date.now();
  try {
    const payload = toPromptPayload(changes);
    const raw = await aiClient.complete(SYSTEM_PROMPT, JSON.stringify(payload, null, 2));
    const validKeys = new Set(changes.map((c) => c.key));
    const map = parseResponse(raw, validKeys);

    logger.info('ai.explanations.ok', {
      changeCount: changes.length,
      explainedCount: map.size,
      latencyMs: Date.now() - startedAt,
    });
    return map;
  } catch (err) {
    // Deliberate: log and degrade, never throw. The categorized diff and
    // summary remain fully usable with zero AI availability.
    logger.error('ai.explanations.failed', {
      changeCount: changes.length,
      latencyMs: Date.now() - startedAt,
      reason: err.message,
    });
    return new Map();
  }
}

/**
 * Rules-authored fallback, used when the AI call fails entirely or when a
 * specific change is missing from an otherwise-valid response. Every rule
 * name has deterministic prose, so the product is never blank.
 */
const FALLBACK_BY_RULE = {
  'field-removed': (c) => `Field "${c.before.field}" was removed from ${c.endpoint}. Any client still reading this field will break.`,
  'field-added-required': (c) => `A new required field "${c.after.field}" was added to ${c.endpoint}. Existing clients do not send it, so their requests will now fail validation.`,
  'field-added-optional': (c) => `A new optional field "${c.after.field}" was added to ${c.endpoint}. Existing clients are unaffected.`,
  'type-changed': (c) => `Field "${c.before.field}" on ${c.endpoint} changed type from ${c.before.type} to ${c.after.type}. Clients parsing the old type will break.`,
  'type-widened': (c) => `Field "${c.before.field}" on ${c.endpoint} widened from ${c.before.type} to ${c.after.type}. Usually safe, but confirm clients can handle the larger range.`,
  'optional-to-required': (c) => `Field "${c.before.field}" on ${c.endpoint} became required. Clients that omit it will now fail validation.`,
  'required-to-optional': (c) => `Field "${c.before.field}" on ${c.endpoint} became optional. Existing clients that always send it are unaffected.`,
  'enum-value-removed': (c) => `One or more allowed values were removed from "${c.before.field}" on ${c.endpoint}. Clients sending a removed value will be rejected.`,
  'enum-value-added': (c) => `A new allowed value was added to "${c.before.field}" on ${c.endpoint}. Existing values still work.`,
  'possible-rename': (c) => `Field "${c.before.field}" disappeared and "${c.after.field}" appeared on ${c.endpoint} with the same type (${c.confidenceLabel ?? 'unscored'} confidence rename, score ${c.confidence ?? 'n/a'}). This may be a rename — confirm before treating it as a removal.`,
  'field-casing-changed': (c) => `Field "${c.before.field}" on ${c.endpoint} changed casing to "${c.after.field}". Impact depends on whether the API is case-sensitive.`,
  'status-code-removed': (c) => `${c.endpoint} no longer returns status ${c.before.statusCode}. Clients with handling for that code have untested behaviour now.`,
  'status-code-added': (c) => `${c.endpoint} can now return status ${c.after.statusCode}. Existing handling is unaffected, but the new path may be unhandled.`,
  'status-code-changed': (c) => `${c.endpoint} now returns ${c.after.statusCode} instead of ${c.before.statusCode}. Clients checking for the old code will not match.`,
  'endpoint-removed': (c) => `The endpoint ${c.endpoint} was removed entirely. All clients calling it will break.`,
  'endpoint-added': (c) => `A new endpoint ${c.endpoint} was added. No existing client is affected.`,
};

function fallbackExplanation(change) {
  const fn = FALLBACK_BY_RULE[change.ruleName];
  if (fn) {
    try {
      return fn(change);
    } catch {
      /* fall through to the generic form below */
    }
  }
  return `${change.endpoint}: ${change.ruleName} — classified as ${change.classification}.`;
}

module.exports = { generateExplanations, fallbackExplanation, parseResponse, SYSTEM_PROMPT };