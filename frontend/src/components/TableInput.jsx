import { useState } from 'react';
import { Upload, Lock, Search, Play, Sparkles } from 'lucide-react';
import { sampleBefore, sampleAfter } from '../sampleData';

function TableField({ label, badgeText, badgeColor, value, onChange, onFile }) {
  return (
    <div
      style={{
        marginBottom: 16,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--surface-subtle)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: 4,
              background: badgeColor || 'var(--accent-light)',
              color: 'var(--ink)',
            }}
          >
            {badgeText || label}
          </span>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{label}</span>
        </div>
        <label
          className="btn-quiet"
          style={{
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Upload size={12} />
          Upload JSON
          <input
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onFile(reader.result);
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <textarea
        rows={9}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} rows as a JSON array…`}
        spellCheck={false}
        style={{
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
          fontSize: 12,
          padding: '12px',
          background: 'var(--surface)',
          resize: 'vertical',
        }}
      />
    </div>
  );
}

/**
 * Upload/paste UI. Client-side JSON parsing only — row-shape and semantic
 * validation both live server-side (Phase 3), so this never re-implements
 * rules the backend already owns.
 */
export default function TableInput({ onSubmit, submitting, isAuthed }) {
  const [beforeText, setBeforeText] = useState('');
  const [afterText, setAfterText] = useState('');
  const [parseError, setParseError] = useState(null);

  function loadSample() {
    setBeforeText(JSON.stringify(sampleBefore, null, 2));
    setAfterText(JSON.stringify(sampleAfter, null, 2));
    setParseError(null);
  }

  function handleSubmit() {
    if (!isAuthed) {
      return setParseError('Please sign in or register an account before running a comparison.');
    }
    setParseError(null);
    let beforeRows, afterRows;
    try { beforeRows = JSON.parse(beforeText); } catch { return setParseError('"Before" is not valid JSON.'); }
    try { afterRows = JSON.parse(afterText); } catch { return setParseError('"After" is not valid JSON.'); }
    onSubmit(beforeRows, afterRows);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Contracts</h2>
          <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '2px 0 0' }}>Paste or upload JSON schemas</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={loadSample}
          style={{ fontSize: 11, padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <Sparkles size={12} style={{ color: 'var(--accent)' }} />
          <span>Load sample data</span>
        </button>
      </div>

      <TableField
        label="Before (Baseline)"
        badgeText="v1.0"
        badgeColor="#e2e8f0"
        value={beforeText}
        onChange={setBeforeText}
        onFile={setBeforeText}
      />
      <TableField
        label="After (Current)"
        badgeText="v2.0"
        badgeColor="var(--accent-light)"
        value={afterText}
        onChange={setAfterText}
        onFile={setAfterText}
      />

      {!isAuthed && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--ambiguous)',
            background: 'var(--ambiguous-bg)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Lock size={14} />
          <span>Please <strong>Sign in</strong> or <strong>Register</strong> above to compare contracts.</span>
        </div>
      )}

      {parseError && (
        <div
          style={{
            color: 'var(--breaking)',
            fontSize: 12,
            marginBottom: 14,
            padding: '8px 12px',
            background: 'var(--breaking-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
          }}
        >
          {parseError}
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting || !beforeText.trim() || !afterText.trim() || !isAuthed}
        style={{
          width: '100%',
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {submitting ? (
          <>
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span>Comparing contracts…</span>
          </>
        ) : !isAuthed ? (
          <>
            <Lock size={14} />
            <span>Sign in to run comparison</span>
          </>
        ) : (
          <>
            <Search size={14} strokeWidth={2.5} />
            <span>Run comparison</span>
          </>
        )}
      </button>
    </div>
  );
}