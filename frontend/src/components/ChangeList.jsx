import ChangeRow from './ChangeRow';

// Breaking first — a reviewer triaging risk needs the dangerous items before
// the safe ones, not in whatever order the diff engine emitted them.
const GROUP_ORDER = [
  { key: 'breaking', label: 'Breaking' },
  { key: 'ambiguous', label: 'Needs review' },
  { key: 'non-breaking', label: 'Non-breaking' },
];

export default function ChangeList({ changes }) {
  if (!changes || changes.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>
        <p style={{ fontSize: 13 }}>No differences between the two tables.</p>
      </div>
    );
  }

  return (
    <div>
      {GROUP_ORDER.map((group) => {
        const items = changes.filter((c) => c.classification === group.key);
        if (items.length === 0) return null;
        return (
          <div key={group.key} style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 8px', fontWeight: 600 }}>
              {group.label} ({items.length})
            </h3>
            {items.map((c) => <ChangeRow key={c.key} change={c} />)}
          </div>
        );
      })}
    </div>
  );
}