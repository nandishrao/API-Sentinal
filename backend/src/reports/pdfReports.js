const PDFDocument = require('pdfkit');

const SEVERITY_LABEL = { breaking: 'BREAKING', ambiguous: 'NEEDS REVIEW', 'non-breaking': 'NON-BREAKING' };
const SEVERITY_COLOR = { breaking: '#b3261e', ambiguous: '#8a5a00', 'non-breaking': '#1d7a4c' };
const GROUP_ORDER = ['breaking', 'ambiguous', 'non-breaking'];

/**
 * Renders a run's changes into a PDF and streams it directly to `res`.
 * No temp files, no disk writes — pdfkit is a writable stream, `res` is a
 * writable stream, we just pipe one into the other.
 *
 * @param {{changes: Array, summary: Object}} run
 * @param {import('express').Response} res
 */
function streamRunAsPdf(run, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).fillColor('#1b1e1f').text('API Breaking Change Report', { align: 'left' });
  doc.fontSize(9).fillColor('#62696d').text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  doc.fontSize(11).fillColor('#1b1e1f');
  const { totalChanges, breakingCount, nonBreakingCount, ambiguousCount } = run.summary;
  doc.text(`Total changes: ${totalChanges}    Breaking: ${breakingCount}    Non-breaking: ${nonBreakingCount}    Ambiguous: ${ambiguousCount}`);
  doc.moveDown(1);
  doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#dfe1df').stroke();
  doc.moveDown(0.8);

  for (const group of GROUP_ORDER) {
    const items = run.changes.filter((c) => c.classification === group);
    if (items.length === 0) continue;

    doc.fontSize(13).fillColor(SEVERITY_COLOR[group]).text(`${SEVERITY_LABEL[group]} (${items.length})`, { underline: false });
    doc.moveDown(0.4);

    for (const change of items) {
      // Keep each change together on one page where possible — a report
      // that splits a single change across a page break reads as sloppy.
      const estimatedHeight = 70;
      if (doc.y + estimatedHeight > doc.page.height - doc.page.margins.bottom) doc.addPage();

      doc.fontSize(10).fillColor('#1b1e1f').font('Helvetica-Bold').text(change.endpoint, { continued: false });
      doc.font('Helvetica');

      const fieldOrStatus =
        change.scope === 'field'
          ? change.before?.field || change.after?.field
          : change.scope === 'status'
          ? `status ${change.before?.statusCode ?? change.after?.statusCode}`
          : null;
      if (fieldOrStatus) doc.fontSize(9).fillColor('#62696d').text(fieldOrStatus);

      doc.fontSize(9.5).fillColor('#1b1e1f').text(change.explanation, { width: 495 });

      let meta = change.ruleName;
      if (change.ruleName === 'possible-rename' && change.confidenceLabel) {
        meta += `  |  ${change.confidenceLabel} confidence (${change.confidence})`;
      }
      doc.fontSize(8).fillColor('#9a9fa3').text(meta);
      doc.moveDown(0.6);
    }
    doc.moveDown(0.4);
  }

  doc.end();
}

module.exports = { streamRunAsPdf };