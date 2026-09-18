import { useEffect, useState } from 'react';
import { fetchRunHistory, fetchRun, messageFromError } from '../api/client';

export default function RunHistory({ onSelectRun }) {
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRunHistory().then(setRuns).catch((err) => setError(messageFromError(err)));
  }, []);

  async function open(id) {
    try {
      onSelectRun(await fetchRun(id));
    } catch (err) {
      setError(messageFromError(err));
    }
  }

  if (error) {
    return (
      <div
        style={{
          padding: 12,
          fontSize: 12,
          color: 'var(--breaking)',
          background: 'var(--breaking-bg)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
        }}
      >
        {error}
      </div>
    );
  }

  if (runs === null) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>
        <span className="spinner" style={{ width: 16, height: 16, marginBottom: 8 }} />
        <p style={{ fontSize: 12, margin: 0 }}>Loading comparison history…</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--ink-muted)' }}>
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ margin: '0 auto 8px', color: 'var(--ink-light)' }}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <p style={{ fontSize: 12.5, margin: 0, lineHeight: 1.4 }}>
          No runs stored yet. Execute a comparison to view historical logs.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        Saved Runs ({runs.length})
      </div>
      {runs.map((run) => {
        const dateStr = new Date(run.createdAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <button
            key={run._id}
            onClick={() => open(run._id)}
            className="btn"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{dateStr}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-light)' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-breaking" style={{ fontSize: 10, padding: '1px 6px' }}>
                {run.summary.breakingCount} breaking
              </span>
              <span className="badge badge-ambiguous" style={{ fontSize: 10, padding: '1px 6px' }}>
                {run.summary.ambiguousCount} review
              </span>
              <span className="badge badge-nonbreaking" style={{ fontSize: 10, padding: '1px 6px' }}>
                {run.summary.nonBreakingCount} safe
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}