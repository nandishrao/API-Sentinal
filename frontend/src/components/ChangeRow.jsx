const SEVERITY_STYLE = {
  breaking: { border: 'var(--breaking)', bg: 'var(--breaking-bg)', label: 'Breaking' },
  ambiguous: { border: 'var(--ambiguous)', bg: 'var(--ambiguous-bg)', label: 'Needs review' },
  'non-breaking': { border: 'var(--nonbreaking)', bg: 'var(--nonbreaking-bg)', label: 'Non-breaking' },
};

/** Severity is color + left border + text label — never color alone. */
export default function ChangeRow({ change }) {
  const style = SEVERITY_STYLE[change.classification];
  const fieldOrStatus =
    change.scope === 'field'
      ? change.before?.field || change.after?.field
      : change.scope === 'status'
      ? `status ${change.before?.statusCode ?? change.after?.statusCode}`
      : null;

  return (
    <div style={{ borderLeft: `3px solid ${style.border}`, background: style.bg, padding: '10px 14px', marginBottom: 6, borderRadius: 'var(--radius)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
        <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{change.endpoint}</span>
        {fieldOrStatus && <span className="mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{fieldOrStatus}</span>}
        <span style={{ fontSize: 11, color: style.border, fontWeight: 600, marginLeft: 'auto' }}>{style.label}</span>
      </div>

      <p style={{ margin: '4px 0 6px', fontSize: 13, lineHeight: 1.5 }}>{change.explanation}</p>

      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-muted)' }}>
        <span className="mono">{change.ruleName}</span>
        <span style={{ borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
          {change.explanationSource === 'ai' ? 'AI-written' : 'Rules-engine fallback'}
        </span>
      </div>
    </div>
  );
}