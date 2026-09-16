/**
 * Declarative classification rules.
 *
 * Each rule receives the before/after row for one composite key (one or both
 * may be undefined) and returns a classification, or `null` if it doesn't apply.
 * Rules are evaluated in order; the first non-null result wins.
 *
 * This table is the entire "policy" of the system. Extending detection to a
 * new change type means adding a rule here, not touching diffEngine.js.
 *
 * Classification values: 'breaking' | 'non-breaking' | 'ambiguous'
 */

const CLASSIFICATION = {
  BREAKING: 'breaking',
  NON_BREAKING: 'non-breaking',
  AMBIGUOUS: 'ambiguous',
};

// TODO (Phase 2, TDD): 
const TYPE_WIDENING = {
  int32: ['int64', 'long'],
  integer: ['long', 'int64'],
  short: ['int', 'int32', 'int64', 'integer', 'long'],
  float: ['double'],
};
function isWideningTypeChange(beforeType, afterType) {
  return (TYPE_WIDENING[beforeType] || []).includes(afterType);
}
function statusClass(statusCode) {
  return Math.floor(statusCode / 100); // 200 -> 2, 404 -> 4, etc.
}
function wordsOf(name) {
  return new Set(
    name
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_\-.]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  );
}

function shareAWord(nameA, nameB) {
  const a = wordsOf(nameA);
  for (const w of wordsOf(nameB)) if (a.has(w)) return true;
  return false;
}

function classifyModifiedField(before, after) {
  if (before.type !== after.type) {
    return isWideningTypeChange(before.type, after.type)
      ? { classification: CLASSIFICATION.AMBIGUOUS, ruleName: 'type-widened' }
      : { classification: CLASSIFICATION.BREAKING, ruleName: 'type-changed' };
  }

  if (before.required !== after.required) {
    return after.required
      ? { classification: CLASSIFICATION.BREAKING, ruleName: 'optional-to-required' }
      : { classification: CLASSIFICATION.NON_BREAKING, ruleName: 'required-to-optional' };
  }

  if (before.type === 'enum') {
    const beforeSet = new Set(before.enumValues || []);
    const afterSet = new Set(after.enumValues || []);
    const removed = [...beforeSet].filter((v) => !afterSet.has(v));
    const added = [...afterSet].filter((v) => !beforeSet.has(v));
    if (removed.length > 0) return { classification: CLASSIFICATION.BREAKING, ruleName: 'enum-value-removed' };
    if (added.length > 0) return { classification: CLASSIFICATION.NON_BREAKING, ruleName: 'enum-value-added' };
  }

  return null;
}

module.exports = {
  CLASSIFICATION, TYPE_WIDENING, isWideningTypeChange,
  statusClass, wordsOf, shareAWord, classifyModifiedField,
};


