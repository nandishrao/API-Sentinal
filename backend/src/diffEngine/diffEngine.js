/**
 * Pure diff engine. No I/O, no Express, no AI client, no MongoDB — see ADR-001.
 *
 * @typedef {Object} Row
 * @property {string} endpoint
 * @property {'field'|'status'} kind
 * @property {string|null} field
 * @property {string|null} type
 * @property {boolean|null} required
 * @property {string[]|null} enumValues
 * @property {number|null} statusCode
 *
 * @typedef {Object} Change
 * @property {string} endpoint
 * @property {string} key            composite key, e.g. "POST /users::field::password"
 * @property {'field'|'status'|'endpoint'} scope
 * @property {'breaking'|'non-breaking'|'ambiguous'} classification
 * @property {string} ruleName       matches an entry in rules.js — used for testing and for the AI prompt
 * @property {Row|null} before
 * @property {Row|null} after
 *
 * @param {Row[]} beforeRows
 * @param {Row[]} afterRows
 * @returns {Change[]}
 */
function diff(beforeRows, afterRows) {
  // TODO (Phase 2):
  // 1. validateRows(beforeRows) / validateRows(afterRows) — throw on duplicate
  //    composite keys or empty input (edge cases #17, #18). Validation happens
  //    here, not in the Express layer, so the engine stays usable standalone.
  // 2. Index both arrays by composite key (see docs/data-model.md).
  // 3. Walk the union of keys; for each, look up the applicable rule(s) from
  //    rules.js and produce a Change (or nothing, for no-op changes like
  //    reordering).
  // 4. Roll up endpoint-level removal/addition separately from field-level
  //    changes (edge cases #15, #16).
  throw new Error('diffEngine.diff() not yet implemented — Phase 2');
}

function compositeKey(row) {
  return row.kind === 'status'
    ? `${row.endpoint}::status::${row.statusCode}`
    : `${row.endpoint}::field::${row.field}`;
}

module.exports = { diff, compositeKey };
