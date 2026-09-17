import { useState } from 'react';
import TableInput from './components/TableInput';
import SummaryBar from './components/SummaryBar';
import ChangeList from './components/ChangeList';
import RunHistory from './components/RunHistory';
import { submitRun, messageFromError } from './api/client';

export default function App() {
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(beforeRows, afterRows) {
    setSubmitting(true);
    setError(null);
    try {
      setResult(await submitRun(beforeRows, afterRows));
    } catch (err) {
      setError(messageFromError(err));
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectHistoryRun(run) {
    setResult({
      runId: run._id,
      changes: run.changes,
      summary: run.summary,
      aiDegraded: run.changes.some((c) => c.explanationSource === 'fallback'),
      persisted: true,
    });
    setTab('new');
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', padding: 24, overflowY: 'auto' }}>
        <h1 style={{ fontSize: 16, margin: '0 0 4px' }}>API Breaking Change Detector</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 20px' }}>
          Compares two API contract tables and flags breaking changes.
        </p>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {[{ key: 'new', label: 'New run' }, { key: 'history', label: 'History' }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: 'none', border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '8px 0', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? 'var(--ink)' : 'var(--ink-muted)',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'new' ? (
          <>
            <TableInput onSubmit={handleSubmit} submitting={submitting} />
            {error && <p style={{ color: 'var(--breaking)', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <SummaryBar summary={result?.summary} aiDegraded={result?.aiDegraded} persisted={result?.persisted} />
          </>
        ) : (
          <RunHistory onSelectRun={handleSelectHistoryRun} />
        )}
      </aside>

      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        {result ? (
          <ChangeList changes={result.changes} />
        ) : (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>
            <p style={{ fontSize: 13, maxWidth: 380, margin: '0 auto' }}>
              Paste or upload a before/after contract table pair on the left, or load the sample data,
              then run a comparison to see categorized changes here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}