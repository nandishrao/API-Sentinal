import { useState } from 'react';
import { Shield, FileText, LogOut, Download, Sparkles } from 'lucide-react';
import TableInput from './components/TableInput';
import SummaryBar from './components/SummaryBar';
import ChangeList from './components/ChangeList';
import RunHistory from './components/RunHistory';
import AuthBar from './components/AuthBar';
import LoginPage from './components/LoginPage';
import { submitRun, downloadRunAsPdf, messageFromError } from './api/client';

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('abcd_username'));
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  function handleSignOut() {
    localStorage.removeItem('abcd_token');
    localStorage.removeItem('abcd_username');
    setUsername(null);
    setResult(null);
  }

  async function handleSubmit(beforeRows, afterRows) {
    if (!username) {
      setError('You must be signed in to run a comparison.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await submitRun(beforeRows, afterRows);
      setResult(data);
    } catch (err) {
      setError(messageFromError(err));
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExportPdf() {
    if (!result) return;
    setExporting(true);
    setError(null);
    try {
      await downloadRunAsPdf(result.changes, result.summary, username);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setExporting(false);
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

  // Protected Route: Render standalone Login/Register Page if user is not authenticated
  if (!username) {
    return <LoginPage onAuthed={setUsername} />;
  }

  const userInitials = username ? username.slice(0, 2).toUpperCase() : 'US';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* SaaS Navigation Header */}
      <header
        style={{
          height: 60,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Shield size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                API Sentinel
              </h1>
              <span className="badge badge-neutral" style={{ fontSize: 10.5, padding: '2px 7px', fontWeight: 600 }}>
                v0.1.0
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--ink-muted)', margin: 0, marginTop: 1 }}>
              Contract Compatibility & Breaking Change Detector
            </p>
          </div>
        </div>

        {/* Header Right User Profile & PDF Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {result && (
            <button
              className="btn btn-primary"
              onClick={handleExportPdf}
              disabled={exporting}
              style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              {exporting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  <span>Exporting PDF…</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>Export PDF Report</span>
                </>
              )}
            </button>
          )}

          {result && <div style={{ width: 1, height: 24, background: 'var(--border)' }} />}

          {/* User Status Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                letterSpacing: '0.05em',
              }}
            >
              {userInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{username}</span>
              <span style={{ fontSize: 10.5, color: 'var(--accent)', fontWeight: 500 }}>Authenticated</span>
            </div>
            <button
              className="btn-quiet"
              onClick={handleSignOut}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                color: 'var(--ink-muted)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                cursor: 'pointer',
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar Control Rail */}
        <aside
          style={{
            width: 360,
            flexShrink: 0,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Segmented Tab Navigation */}
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-subtle)',
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              marginBottom: 20,
            }}
          >
            {[
              { key: 'new', label: 'New Comparison', icon: '⚡' },
              { key: 'history', label: 'Run History', icon: '🕒' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  background: tab === t.key ? 'var(--surface)' : 'transparent',
                  border: 'none',
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  padding: '7px 0',
                  fontWeight: tab === t.key ? 600 : 500,
                  fontSize: 12.5,
                  color: tab === t.key ? 'var(--ink)' : 'var(--ink-muted)',
                  boxShadow: tab === t.key ? 'var(--shadow-sm)' : 'none',
                  gap: 6,
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {tab === 'new' ? (
            <div>
              <TableInput onSubmit={handleSubmit} submitting={submitting} isAuthed={Boolean(username)} />
              {error && (
                <div
                  style={{
                    color: 'var(--breaking)',
                    fontSize: 12,
                    marginTop: 14,
                    padding: '10px 12px',
                    background: 'var(--breaking-bg)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                  }}
                >
                  <strong>Error:</strong> {error}
                </div>
              )}
              <SummaryBar
                summary={result?.summary}
                aiDegraded={result?.aiDegraded}
                persisted={result?.persisted}
                onExportPdf={result ? handleExportPdf : null}
                exporting={exporting}
              />
            </div>
          ) : (
            <RunHistory onSelectRun={handleSelectHistoryRun} />
          )}
        </aside>

        {/* Right Main Hero / Results Area */}
        <main
          style={{
            flex: 1,
            padding: '28px 36px',
            overflowY: 'auto',
            background: 'var(--bg)',
          }}
        >
          {result ? (
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              {/* Result Overview Header Card */}
              <div
                className="card"
                style={{
                  padding: '20px 24px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                      Comparison Analysis Report
                    </h2>
                    <span className="badge badge-neutral">
                      {result.runId ? `ID: ${result.runId.slice(-6)}` : 'Active Run'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
                    Categorized contract modifications between Baseline (v1) and Current (v2).
                  </p>
                </div>

                {/* Stat summary cards */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 16px',
                      textAlign: 'center',
                      minWidth: 84,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                      Total
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                      {result.summary?.totalChanges ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--breaking-bg)',
                      border: '1px solid rgba(220, 38, 38, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 16px',
                      textAlign: 'center',
                      minWidth: 84,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--breaking)', textTransform: 'uppercase' }}>
                      Breaking
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--breaking)' }}>
                      {result.summary?.breakingCount ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--nonbreaking-bg)',
                      border: '1px solid rgba(22, 163, 74, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 16px',
                      textAlign: 'center',
                      minWidth: 84,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--nonbreaking)', textTransform: 'uppercase' }}>
                      Safe
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--nonbreaking)' }}>
                      {result.summary?.nonBreakingCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grouped Change Items List */}
              <ChangeList changes={result.changes} />
            </div>
          ) : (
            /* Empty State Hero Screen */
            <div
              style={{
                maxWidth: 720,
                margin: '40px auto 0',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 'var(--radius)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Shield size={28} strokeWidth={2.2} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Compare API Contracts & Detect Breaking Changes
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 auto 32px', maxWidth: 540, lineHeight: 1.6 }}>
                Paste or upload before/after contract JSON tables on the left control rail (or load sample data) to generate instant compatibility evaluations.
              </p>

              {/* Feature highlight cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'left' }}>
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>⚡</div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px', color: 'var(--ink)' }}>
                    Rules-Engine Powered
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.45 }}>
                    Deterministic categorization of breaking vs safe schema changes.
                  </p>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>✦</div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px', color: 'var(--ink)' }}>
                    AI Context Explanations
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.45 }}>
                    Clear developer explanations on why specific fields impact consumers.
                  </p>
                </div>

                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>📄</div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px', color: 'var(--ink)' }}>
                    Exportable PDF Audits
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.45 }}>
                    Download single-page executive PDF summaries for team triage.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}