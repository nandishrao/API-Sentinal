import { useState } from 'react';
import ChangeRow from './ChangeRow';

// Breaking first — a reviewer triaging risk needs the dangerous items before
// the safe ones, not in whatever order the diff engine emitted them.
const GROUP_ORDER = [
  { key: 'breaking', label: 'Breaking Changes', color: 'var(--breaking)', badgeClass: 'badge-breaking' },
  { key: 'ambiguous', label: 'Needs Review (Ambiguous)', color: 'var(--ambiguous)', badgeClass: 'badge-ambiguous' },
  { key: 'non-breaking', label: 'Non-Breaking Changes', color: 'var(--nonbreaking)', badgeClass: 'badge-nonbreaking' },
];

export default function ChangeList({ changes }) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'breaking' | 'ambiguous' | 'non-breaking'
  const [searchQuery, setSearchQuery] = useState('');

  if (!changes || changes.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--ink-muted)',
          margin: '24px 0',
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ margin: '0 auto 12px', color: 'var(--nonbreaking)' }}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h4 style={{ margin: '0 0 4px', color: 'var(--ink)', fontSize: 15 }}>No Differences Detected</h4>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', maxWidth: 360, margin: '0 auto' }}>
          The baseline and current contract tables are identical. No breaking or non-breaking API changes were identified.
        </p>
      </div>
    );
  }

  // Filter changes by classification tab and search text
  const filteredChanges = changes.filter((c) => {
    const matchesTab = filterTab === 'all' || c.classification === filterTab;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesTab;

    const endpoint = (c.endpoint || '').toLowerCase();
    const field = (c.before?.field || c.after?.field || '').toLowerCase();
    const explanation = (c.explanation || '').toLowerCase();
    const rule = (c.ruleName || '').toLowerCase();

    const matchesSearch =
      endpoint.includes(query) ||
      field.includes(query) ||
      explanation.includes(query) ||
      rule.includes(query);

    return matchesTab && matchesSearch;
  });

  const counts = {
    all: changes.length,
    breaking: changes.filter((c) => c.classification === 'breaking').length,
    ambiguous: changes.filter((c) => c.classification === 'ambiguous').length,
    'non-breaking': changes.filter((c) => c.classification === 'non-breaking').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Control Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: 'var(--surface)',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Changes', count: counts.all, badgeClass: 'badge-neutral' },
            { key: 'breaking', label: 'Breaking', count: counts.breaking, badgeClass: 'badge-breaking' },
            { key: 'ambiguous', label: 'Needs Review', count: counts.ambiguous, badgeClass: 'badge-ambiguous' },
            { key: 'non-breaking', label: 'Non-Breaking', count: counts['non-breaking'], badgeClass: 'badge-nonbreaking' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                borderRadius: 'var(--radius-full)',
                border: filterTab === tab.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: filterTab === tab.key ? 'var(--accent-light)' : 'var(--surface-subtle)',
                color: filterTab === tab.key ? 'var(--accent)' : 'var(--ink-muted)',
                fontWeight: filterTab === tab.key ? 600 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>{tab.label}</span>
              <span className={`badge ${tab.badgeClass}`} style={{ fontSize: 10, padding: '0 5px' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ width: 220, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search endpoints or fields…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              fontSize: 12,
              padding: '6px 10px',
              height: 32,
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </div>
      </div>

      {/* Filtered Changes Group Display */}
      {filteredChanges.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--ink-muted)',
            fontSize: 13,
          }}
        >
          No contract changes match the filter query "{searchQuery}".
        </div>
      ) : (
        GROUP_ORDER.map((group) => {
          const items = filteredChanges.filter((c) => c.classification === group.key);
          if (items.length === 0) return null;
          return (
            <div key={group.key}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: group.color,
                    }}
                  />
                  <h3 style={{ fontSize: 14, color: 'var(--ink)', margin: 0, fontWeight: 600 }}>
                    {group.label}
                  </h3>
                </div>
                <span className={`badge ${group.badgeClass}`}>{items.length}</span>
              </div>

              <div>
                {items.map((c) => (
                  <ChangeRow key={c.key} change={c} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}