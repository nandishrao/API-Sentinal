const { CLASSIFICATION, statusClass, shareAWord, classifyModifiedField, renameConfidence, confidenceLabel } = require('./rules');

function compositeKey(row) {
  return row.kind === 'status'
    ? `${row.endpoint}::status::${row.statusCode}`
    : `${row.endpoint}::field::${row.field}`;
}

function validateRows(rows, label) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`${label} must be a non-empty array (edge case #18)`);
  }
  const seen = new Set();
  for (const row of rows) {
    const key = compositeKey(row);
    if (seen.has(key)) {
      throw new Error(`Duplicate composite key "${key}" in ${label} (edge case #17)`);
    }
    seen.add(key);
  }
}

function groupByEndpoint(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.endpoint)) map.set(row.endpoint, []);
    map.get(row.endpoint).push(row);
  }
  return map;
}

/** Field-level diff for one endpoint. Mutates `changes` in place. */
function diffFields(endpoint, beforeFields, afterFields, changes) {
  const beforeByName = new Map(beforeFields.map((r) => [r.field, r]));
  const afterByName = new Map(afterFields.map((r) => [r.field, r]));

  // 1) Case-only rename (#19): same name ignoring case, different exact name.
  //    Deliberately ambiguous, not auto-resolved — see docs/adr.
  for (const [bName, bRow] of [...beforeByName]) {
    for (const [aName, aRow] of [...afterByName]) {
      if (bName !== aName && bName.toLowerCase() === aName.toLowerCase()) {
        changes.push({
          endpoint, scope: 'field', key: `${endpoint}::field::${bName}`,
          classification: CLASSIFICATION.AMBIGUOUS, ruleName: 'field-casing-changed',
          before: bRow, after: aRow,
        });
        beforeByName.delete(bName);
        afterByName.delete(aName);
      }
    }
  }

  // 2) Fields present under the same exact name in both -> modified or unchanged.
  //    Indexing by name (not array position) is what makes reordering (#14) a no-op.
  for (const [name, bRow] of [...beforeByName]) {
    if (afterByName.has(name)) {
      const aRow = afterByName.get(name);
      const result = classifyModifiedField(bRow, aRow);
      if (result) {
        changes.push({
          endpoint, scope: 'field', key: `${endpoint}::field::${name}`,
          classification: result.classification, ruleName: result.ruleName,
          before: bRow, after: aRow,
        });
      }
      beforeByName.delete(name);
      afterByName.delete(name);
    }
  }

  // 3) What's left is a pure removal or addition. Try to pair them as a likely
  //    rename (#11) before falling back to independent removed/added.
  const remainingRemoved = [...beforeByName.values()];
  const remainingAdded = [...afterByName.values()];
  const pairedAdded = new Set();

  for (const removedRow of remainingRemoved) {
    const match = remainingAdded.find(
      (addedRow) =>
        !pairedAdded.has(addedRow.field) &&
        addedRow.type === removedRow.type &&
        shareAWord(removedRow.field, addedRow.field)
    );
    if (match) {
      pairedAdded.add(match.field);
      const confidence = renameConfidence(removedRow, match);
      changes.push({
        endpoint, scope: 'field', key: `${endpoint}::field::${removedRow.field}->${match.field}`,
        classification: CLASSIFICATION.AMBIGUOUS, ruleName: 'possible-rename',
        before: removedRow, after: match,
        confidence, confidenceLabel: confidenceLabel(confidence),
      });
    } else {
      changes.push({
        endpoint, scope: 'field', key: `${endpoint}::field::${removedRow.field}`,
        classification: CLASSIFICATION.BREAKING, ruleName: 'field-removed',
        before: removedRow, after: null,
      });
    }
  }

  for (const addedRow of remainingAdded) {
    if (pairedAdded.has(addedRow.field)) continue;
    changes.push({
      endpoint, scope: 'field', key: `${endpoint}::field::${addedRow.field}`,
      classification: addedRow.required ? CLASSIFICATION.BREAKING : CLASSIFICATION.NON_BREAKING,
      ruleName: addedRow.required ? 'field-added-required' : 'field-added-optional',
      before: null, after: addedRow,
    });
  }
}

/** Status-code diff for one endpoint. Mutates `changes` in place. */
function diffStatuses(endpoint, beforeStatuses, afterStatuses, changes) {
  const beforeCodes = beforeStatuses.map((r) => r.statusCode);
  const afterCodes = afterStatuses.map((r) => r.statusCode);
  const beforeSet = new Set(beforeCodes);
  const afterSet = new Set(afterCodes);

  const removed = beforeCodes.filter((c) => !afterSet.has(c));
  const added = afterCodes.filter((c) => !beforeSet.has(c));

  // Pair a removed+added status within the same class (2xx/4xx/5xx) as a
  // single "status code changed" event (#10), rather than as two unrelated
  // add/remove events. Anything left over is an independent add (#9) or
  // remove (#8). This mirrors the field-rename heuristic above.
  const classes = new Set([...removed, ...added].map(statusClass));
  for (const cls of classes) {
    const removedInClass = removed.filter((c) => statusClass(c) === cls);
    const addedInClass = added.filter((c) => statusClass(c) === cls);

    if (removedInClass.length === 1 && addedInClass.length === 1) {
      const [oldCode] = removedInClass;
      const [newCode] = addedInClass;
      changes.push({
        endpoint, scope: 'status', key: `${endpoint}::status::${oldCode}->${newCode}`,
        classification: CLASSIFICATION.BREAKING, ruleName: 'status-code-changed',
        before: beforeStatuses.find((r) => r.statusCode === oldCode),
        after: afterStatuses.find((r) => r.statusCode === newCode),
      });
    } else {
      for (const code of removedInClass) {
        changes.push({
          endpoint, scope: 'status', key: `${endpoint}::status::${code}`,
          classification: CLASSIFICATION.BREAKING, ruleName: 'status-code-removed',
          before: beforeStatuses.find((r) => r.statusCode === code), after: null,
        });
      }
      for (const code of addedInClass) {
        changes.push({
          endpoint, scope: 'status', key: `${endpoint}::status::${code}`,
          classification: CLASSIFICATION.NON_BREAKING, ruleName: 'status-code-added',
          before: null, after: afterStatuses.find((r) => r.statusCode === code),
        });
      }
    }
  }
}

/**
 * @param {Array} beforeRows
 * @param {Array} afterRows
 * @returns {Array} Change[]
 */
function diff(beforeRows, afterRows) {
  validateRows(beforeRows, 'beforeRows');
  validateRows(afterRows, 'afterRows');

  const changes = [];
  const beforeByEndpoint = groupByEndpoint(beforeRows);
  const afterByEndpoint = groupByEndpoint(afterRows);
  const allEndpoints = new Set([...beforeByEndpoint.keys(), ...afterByEndpoint.keys()]);

  for (const endpoint of allEndpoints) {
    const inBefore = beforeByEndpoint.has(endpoint);
    const inAfter = afterByEndpoint.has(endpoint);

    // Whole-endpoint removal/addition (#15, #16) reported once at endpoint
    // scope — deliberately skips field/status diffing for that endpoint to
    // avoid redundant noise on top of the single endpoint-level change.
    if (inBefore && !inAfter) {
      changes.push({
        endpoint, scope: 'endpoint', key: `${endpoint}::endpoint`,
        classification: CLASSIFICATION.BREAKING, ruleName: 'endpoint-removed',
        before: beforeByEndpoint.get(endpoint), after: null,
      });
      continue;
    }
    if (!inBefore && inAfter) {
      changes.push({
        endpoint, scope: 'endpoint', key: `${endpoint}::endpoint`,
        classification: CLASSIFICATION.NON_BREAKING, ruleName: 'endpoint-added',
        before: null, after: afterByEndpoint.get(endpoint),
      });
      continue;
    }

    const beforeRowsForEndpoint = beforeByEndpoint.get(endpoint);
    const afterRowsForEndpoint = afterByEndpoint.get(endpoint);

    diffFields(
      endpoint,
      beforeRowsForEndpoint.filter((r) => r.kind === 'field'),
      afterRowsForEndpoint.filter((r) => r.kind === 'field'),
      changes
    );
    diffStatuses(
      endpoint,
      beforeRowsForEndpoint.filter((r) => r.kind === 'status'),
      afterRowsForEndpoint.filter((r) => r.kind === 'status'),
      changes
    );
  }

  return changes;
}

module.exports = { diff, compositeKey, validateRows };