import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

// Attaches a stored token to every request when one exists. Harmless when
// REQUIRE_AUTH is off (the default) — the backend simply ignores the header
// on routes that aren't gated by requireAuth. Token lives in localStorage,
// not an HttpOnly cookie: a known, documented XSS tradeoff (see
// docs/phase8-auth.md) accepted for an assessment-scoped SPA with no
// separate backend-for-frontend layer to set cookies from.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('abcd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Pulls a readable message out of whatever shape the backend returned. */
export function messageFromError(err) {
  const body = err.response?.data;
  if (!body) return err.message || 'Request failed';
  if (body.details?.length) return `${body.error}: ${body.details.join('; ')}`;
  return body.error || 'Request failed';
}

export async function submitRun(beforeRows, afterRows) {
  const { data } = await client.post('/run', { beforeRows, afterRows });
  return data;
}

export async function fetchRunHistory() {
  const { data } = await client.get('/run');
  return data;
}

export async function register(username, password) {
  const { data } = await client.post('/auth/register', { username, password });
  return data; // { token, username }
}

export async function login(username, password) {
  const { data } = await client.post('/auth/login', { username, password });
  return data; // { token, username }
}

export async function fetchRun(id) {
  const { data } = await client.get(`/run/${id}`);
  return data;
}

/** Requests a PDF for the given result and triggers a browser download. */
export async function downloadRunAsPdf(changes, summary) {
  const res = await client.post(
    '/reports/pdf',
    { changes, summary },
    { responseType: 'blob' }
  );
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `breaking-change-report-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}