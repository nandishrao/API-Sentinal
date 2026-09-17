const express = require('express');
const router = express.Router();
const { streamRunAsPdf } = require('../reports/pdfReport');

/**
 * POST /api/reports/pdf
 * body: { changes: Change[], summary: Object }
 *
 * Takes the exact result shape the frontend already holds in state and
 * renders it — deliberately NOT keyed by runId. That keeps export working
 * whether or not the run was persisted (ADR-001: persistence is off the
 * critical path everywhere else in this app; the export feature honors
 * the same rule rather than becoming the one place that requires Mongo).
 */
router.post('/pdf', (req, res) => {
  const { changes, summary } = req.body || {};

  if (!Array.isArray(changes) || typeof summary !== 'object' || summary === null) {
    return res.status(400).json({ error: 'Request body must include changes[] and a summary object' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="breaking-change-report-${Date.now()}.pdf"`);

  try {
    streamRunAsPdf({ changes, summary }, res);
  } catch (err) {
    // If generation fails after headers are already sent, we can't send a
    // clean JSON error — best we can do is end the stream and log it.
    if (!res.headersSent) return res.status(500).json({ error: 'PDF generation failed' });
    res.end();
  }
});
