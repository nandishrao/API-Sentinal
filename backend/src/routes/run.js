const express = require('express');
const router = express.Router();
const { validateRunInput } = require('../middleware/validateRunInput');
const { executeRun, isPersistenceAvailable } = require('../services/runService');
const Run = require('../models/Run');

/**
 * POST /api/runs — submit a before/after table pair.
 * Thin by design (ADR-001): validate -> delegate -> map errors to status codes.
 * 400 = malformed row shape; 422 = well-formed rows violating a semantic rule.
 */
router.post('/', validateRunInput, async (req, res, next) => {
  const { beforeRows, afterRows } = req.body;
  try {
    res.status(200).json(await executeRun(beforeRows, afterRows));
  } catch (err) {
    if (/non-empty array|Duplicate composite key/.test(err.message)) {
      return res.status(422).json({ error: err.message });
    }
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  if (!isPersistenceAvailable()) return res.status(503).json({ error: 'Run history is unavailable (database not connected)' });
  try {
    res.status(200).json(await Run.find().sort({ createdAt: -1 }).select('summary createdAt').limit(50));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  if (!isPersistenceAvailable()) return res.status(503).json({ error: 'Run history is unavailable (database not connected)' });
  try {
    const run = await Run.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.status(200).json(run);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid run id' });
    next(err);
  }
});

module.exports = router;