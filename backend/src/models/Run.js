const mongoose = require('mongoose');

/**
 * A Run is a persisted record of one comparison. Persistence is off the
 * critical path of the diff/explain flow — see ADR-001 & ADR-002. If Mongo
 * is unreachable, /api/runs POST will still return diff results; only the
 * save step fails, and that failure will not fail the whole request.
 */
const RunSchema = new mongoose.Schema(
  {
    beforeRows: { type: Array, required: true },
    afterRows: { type: Array, required: true },
    changes: { type: Array, required: true },
    summary: {
      breakingCount: Number,
      nonBreakingCount: Number,
      ambiguousCount: Number,
      totalChanges: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Run', RunSchema);
