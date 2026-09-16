const mongoose = require('mongoose');
const { diff } = require('../diffEngine/diffEngine');
const { generateExplanations, fallbackExplanation } = require('./explanationService');
const Run = require('../models/Run');
const logger = require('../config/logger');

function summarize(changes) {
  return {
    totalChanges: changes.length,
    breakingCount: changes.filter((c) => c.classification === 'breaking').length,
    nonBreakingCount: changes.filter((c) => c.classification === 'non-breaking').length,
    ambiguousCount: changes.filter((c) => c.classification === 'ambiguous').length,
  };
}

function isPersistenceAvailable() {
  return mongoose.connection.readyState === 1; // 1 === connected
}

async function executeRun(beforeRows, afterRows) {
  const startedAt = Date.now();

  // Throws on malformed input (#17, #18); the caller maps it to a 422.
  const changes = diff(beforeRows, afterRows);

  const explanations = await generateExplanations(changes);
  const aiDegraded = changes.length > 0 && explanations.size === 0;

  const changesWithExplanations = changes.map((c) => ({
    ...c,
    explanation: explanations.get(c.key) || fallbackExplanation(c),
    explanationSource: explanations.has(c.key) ? 'ai' : 'fallback',
  }));

  const summary = summarize(changes);

  // Persistence is best-effort and off the critical path (ADR-001). A dead
  // database costs run history, never the result the user asked for.
  let runId = null;
  if (isPersistenceAvailable()) {
    try {
      const run = await Run.create({ beforeRows, afterRows, changes: changesWithExplanations, summary });
      runId = run._id;
    } catch (err) {
      logger.error('run.persist.failed', { reason: err.message });
    }
  } else {
    logger.warn('run.persist.skipped', { reason: 'database not connected' });
  }

  logger.info('run.completed', {
    runId, beforeRowCount: beforeRows.length, afterRowCount: afterRows.length,
    ...summary, aiDegraded, persisted: runId !== null, latencyMs: Date.now() - startedAt,
  });

  return { runId, changes: changesWithExplanations, summary, aiDegraded, persisted: runId !== null };
}

module.exports = { executeRun, summarize, isPersistenceAvailable };