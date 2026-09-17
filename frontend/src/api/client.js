import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

/** Pulls a readable message out of whatever shape the backend returned. */
export function messageFromError(err) {
  const body = err.response?.data;
  if (!body) return err.message || 'Request failed';
  if (body.details?.length) return `${body.error}: ${body.details.join('; ')}`;
  return body.error || 'Request failed';
}

export async function submitRun(beforeRows, afterRows) {
  const { data } = await client.post('/runs', { beforeRows, afterRows });
  return data;
}

export async function fetchRunHistory() {
  const { data } = await client.get('/runs');
  return data;
}

export async function fetchRun(id) {
  const { data } = await client.get(`/runs/${id}`);
  return data;
}