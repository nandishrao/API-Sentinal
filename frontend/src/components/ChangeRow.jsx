import { Sparkles, Cpu } from 'lucide-react';

const SEVERITY_STYLE = {
  breaking: {
    border: 'var(--breaking-border)',
    bg: 'var(--surface)',
    badgeClass: 'badge-breaking',
    label: 'Breaking Change',
    icon: '🔴',
  },
  ambiguous: {
    border: 'var(--ambiguous-border)',
    bg: 'var(--surface)',
    badgeClass: 'badge-ambiguous',
    label: 'Needs Review',
    icon: '🟡',
  },
  'non-breaking': {
    border: 'var(--nonbreaking-border)',
    bg: 'var(--surface)',
    badgeClass: 'badge-nonbreaking',
    label: 'Non-Breaking',
    icon: '🟢',
  },
};

/**
 * One row per change. Severity is carried by color AND the left border AND
 * a text badge — ensuring accessibility across screen contrast levels.
 */
export default function ChangeRow({ change }) {
  const style = SEVERITY_STYLE[change.classification] || SEVERITY_STYLE['non-breaking'];

  const fieldOrStatus =
    change.scope === 'field'
      ? change.before?.field || change.after?.field
      : change.scope === 'status'
      ? `status ${change.before?.statusCode ?? change.after?.statusCode}`
      : null;

  // Split endpoint string into HTTP Method and Path if formatted like "POST /users"
  const parts = (change.endpoint || '').split(' ');
  const method = parts.length > 1 ? parts[0] : null;
  const path = parts.length > 1 ? parts.slice(1).join(' ') : change.endpoint;

  return (
    <div
      style={{
        borderLeft: `4px solid ${style.border}`,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 16px',
        marginBottom: 10,
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {method && <span className="badge-method">{method}</span>}
          <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {path}
          </span>
          {fieldOrStatus && (
            <span
              className="mono"
              style={{
                fontSize: 11.5,
                background: 'var(--surface-subtle)',
                color: 'var(--ink-muted)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              {fieldOrStatus}
            </span>
          )}
        </div>
        <span className={`badge ${style.badgeClass}`}>{style.label}</span>
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.55 }}>
        {change.explanation}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--ink-muted)' }}>
        <span
          className="mono"
          style={{
            background: 'var(--surface-subtle)',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid var(--border)',
          }}
        >
          {change.ruleName}
        </span>

        {change.ruleName === 'possible-rename' && (
          <span
            style={{
              color: style.border,
              fontWeight: 600,
              background: style.bg,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {change.confidenceLabel} confidence ({change.confidence})
          </span>
        )}

        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontWeight: 500,
            color: change.explanationSource === 'ai' ? 'var(--accent)' : 'var(--ink-muted)',
          }}
        >
          {change.explanationSource === 'ai' ? (
            <>
              <Sparkles size={12} />
              <span>AI Explanation</span>
            </>
          ) : (
            <>
              <Cpu size={12} />
              <span>Rules-engine fallback</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}