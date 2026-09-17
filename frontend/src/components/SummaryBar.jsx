const STAT_CONFIG = [
  { key: 'totalChanges', label: 'Total changes', color: 'var(--ink)' },
  { key: 'breakingCount', label: 'Breaking', color: 'var(--breaking)' },
  { key: 'nonBreakingCount', label: 'Non-breaking', color: 'var(--nonbreaking)' },
  { key: 'ambiguousCount', label: 'Ambiguous', color: 'var(--ambiguous)' },
];

/**
 * A vertical stat list, not a row of stat "cards" — keeps the left rail
 * feeling like a control panel rather than a dashboard-template import.
 */
export default function SummaryBar({ summary, aiDegraded, persisted, onExportPdf, exporting }) {
  if (!summary) return null;

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h3 style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0, fontWeight: 600 }}>Summary</h3>
        {onExportPdf && (
          <button className="btn-quiet" onClick={onExportPdf} disabled={exporting} style={{ fontSize: 12 }}>
            {exporting ? 'Exporting\u2026' : 'Export PDF'}
          </button>
        )}
      </div>
      {STAT_CONFIG.map((s) => (
        <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
          <span style={{ color: 'var(--ink-muted)' }}>{s.label}</span>
          <span className="mono" style={{ color: s.color, fontWeight: 600 }}>{summary[s.key]}</span>
        </div>
      ))}

      {aiDegraded && (
        <p style={{ fontSize: 12, color: 'var(--ambiguous)', marginTop: 12, lineHeight: 1.4 }}>
          The AI explanation call did not succeed for this run. Explanations below were written by the rules engine's fallback text instead.
        </p>
      )}
      {persisted === false && (
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.4 }}>
          This run was not saved to history (database unavailable).
        </p>
      )}
    </div>
  );
}