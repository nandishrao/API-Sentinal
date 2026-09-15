/**
  The ONLY place in the system that talks to an AI provider — see ADR-002.
  Takes already-classified changes and returns plain-English explanations.
  Never decides classification; only narrates a decision already made by
  the diff engine.
 
  @param {import('../diffEngine/diffEngine').Change[]} changes
  @returns {Promise<Map<string, string>>} composite key -> explanation.
           Returns an empty Map on any failure — callers must have a
           rules-authored fallback and must never treat this as fatal.
 */
async function generateExplanations(changes) {
  if (changes.length === 0) return new Map();

  try {
    // TODO (Phase 3): one structured-output call to the AI provider, asking
    // for { key, explanation } pairs for the full `changes` array. Keep the
    // prompt narrow: it receives the classification and rule name already
    // decided by the diff engine, and is only asked to phrase it in plain
    // English — never asked to (re)classify.
    throw new Error('generateExplanations() not yet implemented — Phase 3');
  } catch (err) {
    // Deliberate: log and degrade, don't throw. See ADR-002 "Consequences".
    console.error('[explanationService] AI call failed, falling back:', err.message);
    return new Map();
  }
}

/**
 * Rules-authored fallback explanation, used when the AI call fails or a
 * specific change is missing from its response. Keeps the categorized
 * diff + summary usable even with zero AI availability.
 */
function fallbackExplanation(change) {
  return `${change.scope === 'endpoint' ? 'Endpoint' : 'Field'} change (${change.ruleName}) classified as ${change.classification}.`;
}

module.exports = { generateExplanations, fallbackExplanation };
