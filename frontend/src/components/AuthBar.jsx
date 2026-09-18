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
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <span>
          Signed in as <strong>{username}</strong>
        </span>
        <button className="btn-quiet" onClick={handleSignOut} style={{ fontSize: 12 }}>Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button type="button" className="btn-quiet" onClick={() => setMode('login')}
          style={{ fontWeight: mode === 'login' ? 700 : 400, textDecoration: mode === 'login' ? 'underline' : 'none' }}>
          Sign in
        </button>
        <span style={{ color: 'var(--ink-muted)' }}>/</span>
        <button type="button" className="btn-quiet" onClick={() => setMode('register')}
          style={{ fontWeight: mode === 'register' ? 700 : 400, textDecoration: mode === 'register' ? 'underline' : 'none' }}>
          Register
        </button>
        <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginLeft: 'auto', alignSelf: 'center' }}>optional</span>
      </div>

      <input
        type="text"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        style={{ marginBottom: 6 }}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        style={{ marginBottom: 8 }}
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
      />
      {error && <p style={{ color: 'var(--breaking)', fontSize: 12, margin: '0 0 8px' }}>{error}</p>}
      <button type="submit" className="btn" disabled={busy} style={{ width: '100%', fontSize: 12 }}>
        {busy ? 'Please wait\u2026' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}