const express = require('express');
const router = express.Router();
const { validateRunInput } = require('../middleware/validateRunInput');
const requireAuth = require('../middleware/requireAuth');
const { executeRun, isPersistenceAvailable } = require('../services/runService');
const Run = require('../models/Run');

// Read once at module load. Off by default — every test and every earlier
// phase's behavior assumes anonymous, global history; this flag is additive,
// never a precondition for the Must-Have features (Phase 0 charter).
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';
if (REQUIRE_AUTH) router.use(requireAuth);

/**
 * POST /api/run - submit a before/after table pair.
 * 400 = malformed row shape; 422 = well-formed rows violating a semantic rule.
 * When REQUIRE_AUTH is on, the run is tagged with the authenticated user.
 */
router.post('/', validateRunInput, async (req, res, next) => {
  const { beforeRows, afterRows } = req.body;
  try {
    res.status(200).json(await executeRun(beforeRows, afterRows, req.userId ?? null));
  } catch (err) {
    if (/non-empty array|Duplicate composite key/.test(err.message)) {
      return res.status(422).json({ error: err.message });
    }
    next(err);
  }
});

// GET /api/runs — history list. Scoped to the authenticated user when
// REQUIRE_AUTH is on; otherwise global, unchanged from Phases 1-7.
router.get('/', async (req, res, next) => {
  if (!isPersistenceAvailable()) return res.status(503).json({ error: 'Run history is unavailable (database not connected)' });
  try {
    const filter = REQUIRE_AUTH ? { userId: req.userId } : {};
    res.status(200).json(await Run.find(filter).sort({ createdAt: -1 }).select('summary createdAt').limit(50));
  } catch (err) {
    next(err);
  }
});

// GET /api/run/:id — full run detail. 404 (not 403) for another user's run,
// so an authenticated user can't distinguish "not yours" from "doesn't exist".
router.get('/:id', async (req, res, next) => {
  if (!isPersistenceAvailable()) return res.status(503).json({ error: 'Run history is unavailable (database not connected)' });
  try {
    const run = await Run.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    if (REQUIRE_AUTH && String(run.userId) !== String(req.userId)) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.status(200).json(run);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid run id' });
    next(err);
  }
});

module.exports = router;