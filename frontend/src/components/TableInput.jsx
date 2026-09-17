import { useState } from 'react';
import { sampleBefore, sampleAfter } from '../sampleData';

function TableField({ label, value, onChange, onFile }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontWeight: 600, fontSize: 13 }}>{label}</label>
        <label className="btn-quiet" style={{ fontSize: 12, cursor: 'pointer' }}>
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
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste ${label.toLowerCase()} rows as a JSON array…`}
        spellCheck={false}
      />
    </div>
  );
}

/**
 * Upload/paste UI. Client-side JSON parsing only — row-shape and semantic
 * validation both live server-side (Phase 3), so this never re-implements
 * rules the backend already owns.
 */
export default function TableInput({ onSubmit, submitting }) {
  const [beforeText, setBeforeText] = useState('');
  const [afterText, setAfterText] = useState('');
  const [parseError, setParseError] = useState(null);

  function loadSample() {
    setBeforeText(JSON.stringify(sampleBefore, null, 2));
    setAfterText(JSON.stringify(sampleAfter, null, 2));
    setParseError(null);
  }

  function handleSubmit() {
    setParseError(null);
    let beforeRows, afterRows;
    try { beforeRows = JSON.parse(beforeText); } catch { return setParseError('"Before" is not valid JSON.'); }
    try { afterRows = JSON.parse(afterText); } catch { return setParseError('"After" is not valid JSON.'); }
    onSubmit(beforeRows, afterRows);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, margin: 0 }}>Compare contract tables</h2>
        <button className="btn-quiet" onClick={loadSample} style={{ fontSize: 12 }}>Load sample data</button>
      </div>

      <TableField label="Before" value={beforeText} onChange={setBeforeText} onFile={setBeforeText} />
      <TableField label="After" value={afterText} onChange={setAfterText} onFile={setAfterText} />

      {parseError && <p style={{ color: 'var(--breaking)', fontSize: 13, margin: '0 0 12px' }}>{parseError}</p>}

      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting || !beforeText.trim() || !afterText.trim()}
        style={{ width: '100%' }}
      >
        {submitting ? 'Comparing…' : 'Run comparison'}
      </button>
    </div>
  );
}