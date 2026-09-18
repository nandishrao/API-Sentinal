import { FileText } from 'lucide-react';

const STAT_CONFIG = [
  { key: 'totalChanges', label: 'Total Changes', color: 'var(--ink)', bg: 'var(--surface-subtle)', dot: '#64748b' },
  { key: 'breakingCount', label: 'Breaking', color: 'var(--breaking)', bg: 'var(--breaking-bg)', dot: 'var(--breaking)' },
  { key: 'nonBreakingCount', label: 'Non-Breaking', color: 'var(--nonbreaking)', bg: 'var(--nonbreaking-bg)', dot: 'var(--nonbreaking)' },
  { key: 'ambiguousCount', label: 'Ambiguous', color: 'var(--ambiguous)', bg: 'var(--ambiguous-bg)', dot: 'var(--ambiguous)' },
];

/**
 * A vertical stat list — control panel summary with export capability and status notices.
 */
export default function SummaryBar({ summary, aiDegraded, persisted, onExportPdf, exporting }) {
  if (!summary) return null;

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Summary
        </h3>
        {onExportPdf && (
          <button
            className="btn btn-secondary"
            onClick={onExportPdf}
            disabled={exporting}
            style={{ fontSize: 11, padding: '4px 8px', gap: 4, display: 'flex', alignItems: 'center' }}
          >
            {exporting ? (
              <>
                <span className="spinner" style={{ width: 10, height: 10 }} />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <FileText size={12} />
                <span>Export PDF</span>
              </>
            )}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {STAT_CONFIG.map((s) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              fontSize: 12.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: s.dot,
                }}
              />
              <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
            <span className="mono" style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>
              {summary[s.key] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {aiDegraded && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--ambiguous)',
            marginTop: 12,
            padding: '8px 10px',
            background: 'var(--ambiguous-bg)',
            border: '1px solid rgba(217, 119, 6, 0.2)',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1.45,
          }}
        >
          <strong>AI Status Notice:</strong> Fallback rules engine used for change explanations.
        </div>
      )}

      {persisted === false && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--ink-muted)',
            marginTop: 8,
            padding: '8px 10px',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            lineHeight: 1.45,
          }}
        >
          <strong>History Notice:</strong> This run was not saved (DB unavailable).
        </div>
      )}
    </div>
  );
}