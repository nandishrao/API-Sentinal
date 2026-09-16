const VALID_KINDS = ['field', 'status'];

/**
 * Shape validation for incoming rows. Distinct from diffEngine.validateRows(),
 * which enforces *semantic* rules (non-empty, no duplicate keys) and stays part
 * of the engine so the engine is correct standalone. This middleware enforces
 * *transport* concerns — is this even a well-formed row object off the wire.
 */
function validateRow(row, index, label) {
  const where = `${label}[${index}]`;
  if (typeof row !== 'object' || row === null || Array.isArray(row)) return `${where} must be an object`;
  if (typeof row.endpoint !== 'string' || row.endpoint.trim() === '') return `${where}.endpoint must be a non-empty string`;
  if (!VALID_KINDS.includes(row.kind)) return `${where}.kind must be one of: ${VALID_KINDS.join(', ')}`;

  if (row.kind === 'field') {
    if (typeof row.field !== 'string' || row.field.trim() === '') return `${where}.field must be a non-empty string when kind is "field"`;
    if (typeof row.type !== 'string' || row.type.trim() === '') return `${where}.type must be a non-empty string when kind is "field"`;
    if (typeof row.required !== 'boolean') return `${where}.required must be a boolean when kind is "field"`;
    if (row.enumValues != null && !Array.isArray(row.enumValues)) return `${where}.enumValues must be an array or null`;
  }
  if (row.kind === 'status') {
    if (!Number.isInteger(row.statusCode) || row.statusCode < 100 || row.statusCode > 599) {
      return `${where}.statusCode must be an integer between 100 and 599`;
    }
  }
  return null;
}

function validateRunInput(req, res, next) {
  const { beforeRows, afterRows } = req.body || {};
  if (!Array.isArray(beforeRows) || !Array.isArray(afterRows)) {
    return res.status(400).json({ error: 'beforeRows and afterRows must both be arrays' });
  }

  const errors = [];
  beforeRows.forEach((row, i) => { const e = validateRow(row, i, 'beforeRows'); if (e) errors.push(e); });
  afterRows.forEach((row, i) => { const e = validateRow(row, i, 'afterRows'); if (e) errors.push(e); });

  // Report every malformed row at once rather than failing on the first —
  // a user pasting a 20-row table should not fix errors one per request.
  if (errors.length > 0) return res.status(400).json({ error: 'Invalid row format', details: errors });
  next();
}

module.exports = { validateRunInput, validateRow };