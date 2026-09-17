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

  if (error) return <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{error}</p>;
  if (runs === null) return <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Loading history…</p>;
  if (runs.length === 0) return <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No runs yet. Run a comparison to see it here.</p>;

  return (
    <div>
      {runs.map((run) => (
        <button key={run._id} onClick={() => open(run._id)} className="btn" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>{new Date(run.createdAt).toLocaleString()}</div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--breaking)', fontWeight: 600 }}>{run.summary.breakingCount} breaking</span>{'  '}
            <span style={{ color: 'var(--ambiguous)' }}>{run.summary.ambiguousCount} ambiguous</span>{'  '}
            <span style={{ color: 'var(--nonbreaking)' }}>{run.summary.nonBreakingCount} non-breaking</span>
          </div>
        </button>
      ))}
    </div>
  );
}