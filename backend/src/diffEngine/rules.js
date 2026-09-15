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

// TODO (Phase 2, TDD): implement each rule against backend/tests/fixtures/before.json
// and after.json. Each rule name below maps 1:1 to a row in the Phase 0 edge case
// matrix (docs/phase0/edge-case-matrix) and should have a matching test in
// diffEngine.test.js before it's implemented.

const rules = [
  // field removed -> breaking
  // field added, required -> breaking
  // field added, optional -> non-breaking
  // type changed -> breaking
  // type widened (e.g. int32 -> int64) -> ambiguous
  // required -> optional -> non-breaking
  // optional -> required -> breaking
  // status code removed -> breaking
  // status code added -> non-breaking
  // status code changed (same operation) -> breaking
  // enum value removed -> breaking
  // enum value added -> non-breaking
  // field reordering (no key change) -> non-breaking / not reported as a change
  // endpoint removed entirely -> breaking, reported at endpoint level
  // endpoint added entirely -> non-breaking
  // field name casing changed -> ambiguous
  // possible rename (remove + add, same endpoint/type, similar name) -> ambiguous
];

module.exports = { CLASSIFICATION, rules };
