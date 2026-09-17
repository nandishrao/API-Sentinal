const CLASSIFICATION = {
  BREAKING: 'breaking',
  NON_BREAKING: 'non-breaking',
  AMBIGUOUS: 'ambiguous',
};

// before-type -> after-types considered a safe widening rather than a breaking type change
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

/** camelCase/snake_case -> lowercase word set, used for rename similarity (#11, not #19). */
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

function jaccardSimilarity(nameA, nameB) {
  const a = wordsOf(nameA);
  const b = wordsOf(nameB);
  const intersection = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function lengthSimilarity(nameA, nameB) {
  const maxLen = Math.max(nameA.length, nameB.length);
  return maxLen === 0 ? 1 : 1 - Math.abs(nameA.length - nameB.length) / maxLen;
}

/**
 * Confidence score (0-1) for a possible-rename pairing (Phase 6). Weighted:
 * word overlap counts most (60%), matching required-flag next (25%, a rename
 * rarely also flips required/optional), name-length similarity least (15%,
 * a weak but real signal). Only called on pairs that already passed the
 * shareAWord gate in diffEngine — this scores confidence, it doesn't decide
 * candidacy.
 */
function renameConfidence(removedRow, addedRow) {
  const wordScore = jaccardSimilarity(removedRow.field, addedRow.field);
  const requiredScore = removedRow.required === addedRow.required ? 1 : 0;
  const lengthScore = lengthSimilarity(removedRow.field, addedRow.field);
  const confidence = 0.6 * wordScore + 0.25 * requiredScore + 0.15 * lengthScore;
  return Math.round(confidence * 100) / 100;
}

function confidenceLabel(confidence) {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.4) return 'medium';
  return 'low';
}

/**
 * Classify a field present under the same exact name in both before/after.
 * Returns null for "no change" (also covers row reordering — #14 — since
 * callers index by name, never by position).
 */
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
  CLASSIFICATION,
  TYPE_WIDENING,
  isWideningTypeChange,
  statusClass,
  wordsOf,
  shareAWord,
  classifyModifiedField,
  jaccardSimilarity,
  lengthSimilarity,
  renameConfidence,
  confidenceLabel,
};