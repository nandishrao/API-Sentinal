const STAT_CONFIG = [
  { key: 'totalChanges', label: 'Total changes', color: 'var(--ink)' },
  { key: 'breakingCount', label: 'Breaking', color: 'var(--breaking)' },
  { key: 'nonBreakingCount', label: 'Non-breaking', color: 'var(--nonbreaking)' },
  { key: 'ambiguousCount', label: 'Ambiguous', color: 'var(--ambiguous)' },
];

export default function SummaryBar({ summary, aiDegraded, persisted }) {
  if (!summary) return null;

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 12px', fontWeight: 600 }}>Summary</h3>
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