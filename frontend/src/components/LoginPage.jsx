import { useState } from 'react';
import { Shield, Lock, User, CheckCircle2, FileText, Zap } from 'lucide-react';
import { register as registerRequest, login as loginRequest, messageFromError } from '../api/client';

const TOKEN_KEY = 'abcd_token';
const USERNAME_KEY = 'abcd_username';

export default function LoginPage({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const fn = mode === 'login' ? loginRequest : registerRequest;
      const { token, username: name } = await fn(form.username, form.password);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USERNAME_KEY, name);
      onAuthed(name);
      setForm({ username: '', password: '' });
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg)',
      }}
    >
      {/* Left Column: Branding Showcase & Project Description */}
      <div
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius)',
                background: 'var(--accent)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 20,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
              }}
            >
              <Shield size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                API Sentinel
              </h1>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Contract Breaking Change Detector</span>
            </div>
          </div>

          {/* Hero Pitch */}
          <div style={{ maxWidth: 520 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                color: '#a5b4fc',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              <span>✨</span>
              <span>Automated Contract Safeguards</span>
            </div>

            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.25,
                color: '#ffffff',
                margin: '0 0 16px',
                letterSpacing: '-0.03em',
              }}
            >
              Detect breaking API changes before your clients do.
            </h2>

            <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 36px' }}>
              API Sentinel compares OpenAPI and table contract revisions in real time, detecting field removals, type shifts, enum shrinkage, and status code modifications with zero false positives.
            </p>

            {/* Feature Bullet List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  <Zap size={14} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                    Deterministic Diff Engine
                  </div>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.45 }}>
                    Accurate severity classification into Breaking, Ambiguous (Needs Review), and Non-Breaking changes.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {/* <Sparkles size={14} style={{ color: '#818cf8' }} /> */}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                    AI Consumer Impact Analysis
                  </div>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.45 }}>
                    Clear developer contextual guidance explaining why specific schema changes break downstream integration.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  <FileText size={14} style={{ color: '#818cf8' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                    Exportable PDF Audits
                  </div>
                  <div style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.45 }}>
                    Generate executive single-page compliance PDFs ready for engineering triage meetings.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: 12, color: '#64748b' }}>
          API Sentinel v0.1.0 • Enterprise API Governance
        </div>
      </div>

      {/* Right Column: Authentication Form Card */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: 'var(--bg)',
        }}
      >
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 32,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
              {mode === 'login'
                ? 'Sign in to access your contract comparison workspace'
                : 'Register an account to start auditing API contracts'}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-subtle)',
              padding: 3,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                fontSize: 13,
                fontWeight: mode === 'login' ? 600 : 500,
                borderRadius: 'calc(var(--radius-sm) - 2px)',
                background: mode === 'login' ? 'var(--surface)' : 'transparent',
                color: mode === 'login' ? 'var(--ink)' : 'var(--ink-muted)',
                border: 'none',
                boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              style={{
                flex: 1,
                padding: '8px 0',
                fontSize: 13,
                fontWeight: mode === 'register' ? 600 : 500,
                borderRadius: 'calc(var(--radius-sm) - 2px)',
                background: mode === 'register' ? 'var(--surface)' : 'transparent',
                color: mode === 'register' ? 'var(--ink)' : 'var(--ink-muted)',
                border: 'none',
                boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  autoComplete="username"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--breaking)',
                  fontSize: 12.5,
                  marginBottom: 18,
                  padding: '10px 12px',
                  background: 'var(--breaking-bg)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !form.username.trim() || !form.password.trim()}
              style={{
                width: '100%',
                padding: '11px 16px',
                fontSize: 13.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {busy ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  <span>Processing request…</span>
                </>
              ) : mode === 'login' ? (
                'Sign In to Dashboard'
              ) : (
                'Create Sentinel Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
