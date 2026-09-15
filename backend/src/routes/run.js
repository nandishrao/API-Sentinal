const express = require('express');
const router = express.Router();
const { diff } = require('../diffEngine/diffEngine');
const { generateExplanations, fallbackExplanation } = require('../services/explanationService');
const Run = require('../models/Run');

/**
 * POST /api/runs
 * body: { beforeRows: Row[], afterRows: Row[] }
 *
 * Deliberately thin: validate -> diff -> explain -> persist(best-effort) -> respond.
 * See ADR-001 (diff engine isolation) and ADR-002 (AI degrades gracefully).
 */
router.post('/', async (req, res) => {
  const { beforeRows, afterRows } = req.body;

  if (!Array.isArray(beforeRows) || !Array.isArray(afterRows)) {
    return res.status(400).json({ error: 'beforeRows and afterRows must both be arrays' });
  }

  let changes;
  try {
    changes = diff(beforeRows, afterRows);
  } catch (err) {
    // diffEngine throws on malformed input (empty tables, duplicate keys — #17/#18)
    return res.status(422).json({ error: err.message });
  }

  const explanations = await generateExplanations(changes);
  const changesWithExplanations = changes.map((c) => ({
    ...c,
    explanation: explanations.get(c.key) || fallbackExplanation(c),
  }));

  const summary = {
    totalChanges: changes.length,
    breakingCount: changes.filter((c) => c.classification === 'breaking').length,
    nonBreakingCount: changes.filter((c) => c.classification === 'non-breaking').length,
    ambiguousCount: changes.filter((c) => c.classification === 'ambiguous').length,
  };

  let runId = null;
  try {
    const run = await Run.create({ beforeRows, afterRows, changes: changesWithExplanations, summary });
    runId = run._id;
  } catch (err) {
    // Persistence is best-effort — see ADR-001/model comment. The result is
    // still returned to the client even if the save failed.
    console.error('[runs] failed to persist run:', err.message);
  }

  res.status(200).json({ runId, changes: changesWithExplanations, summary });
});

// GET /api/runs — history list
router.get('/', async (req, res) => {
  const runs = await Run.find().sort({ createdAt: -1 }).select('summary createdAt').limit(50);
  res.status(200).json(runs);
});

// GET /api/runs/:id — full run detail
router.get('/:id', async (req, res) => {
  const run = await Run.findById(req.params.id);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.status(200).json(run);
});

module.exports = router;
