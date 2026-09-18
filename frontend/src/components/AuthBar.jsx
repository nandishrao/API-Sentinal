import { useState } from 'react';
import { register as registerRequest, login as loginRequest, messageFromError } from '../api/client';

const TOKEN_KEY = 'abcd_token';
const USERNAME_KEY = 'abcd_username';

/**
 * Compact, optional sign-in. Inert when the backend runs with REQUIRE_AUTH
 * off (the default) — signing in just isn't necessary for anything to work,
 * which is the point: auth is additive, not a precondition (Phase 0 charter,
 * "Could Have"). Deliberately no separate route/page — this is one small
 * panel, not a feature that earns its own screen.
 */
export default function AuthBar({ username, onAuthed, onSignOut }) {
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

  function handleSignOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    onSignOut();
  }

  if (username) {
    const initials = username ? username.slice(0, 2).toUpperCase() : 'US';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'var(--surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '0.05em',
            }}
          >
            {initials}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Signed in</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{username}</div>
          </div>
        </div>
        <button
          className="btn-quiet"
          onClick={handleSignOut}
          style={{ fontSize: 12, padding: '4px 8px' }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--surface-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: 12,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          background: 'var(--surface)',
          padding: 2,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setMode('login')}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: 12,
            fontWeight: mode === 'login' ? 600 : 400,
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            background: mode === 'login' ? 'var(--surface-subtle)' : 'transparent',
            color: mode === 'login' ? 'var(--ink)' : 'var(--ink-muted)',
            border: 'none',
            boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: 12,
            fontWeight: mode === 'register' ? 600 : 400,
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            background: mode === 'register' ? 'var(--surface-subtle)' : 'transparent',
            color: mode === 'register' ? 'var(--ink)' : 'var(--ink-muted)',
            border: 'none',
            boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Register
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          autoComplete="username"
          style={{ fontSize: 12, padding: '8px 10px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          style={{ fontSize: 12, padding: '8px 10px' }}
        />
      </div>

      {error && (
        <div
          style={{
            color: 'var(--breaking)',
            fontSize: 12,
            marginBottom: 8,
            padding: '6px 8px',
            background: 'var(--breaking-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-secondary"
        disabled={busy}
        style={{ width: '100%', fontSize: 12, padding: '7px 0', fontWeight: 600 }}
      >
        {busy ? (
          <>
            <span className="spinner" style={{ width: 12, height: 12 }} />
            <span>Processing…</span>
          </>
        ) : mode === 'login' ? (
          'Sign in'
        ) : (
          'Create account'
        )}
      </button>
    </form>
  );
}