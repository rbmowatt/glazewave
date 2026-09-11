import { storedToken } from './auth.js';

// Same origin in production, because nginx serves /admin and proxies /api off
// the one host. Set VITE_API_BASE only to point a local dev console at the
// deployed API.
const BASE = import.meta.env.VITE_API_BASE || '';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed (${status})`);
    this.status = status;
    this.body = body || {};
  }
}

async function request(path, options = {}) {
  const token = storedToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // NODE_ENV=production on the systemd unit makes Express replace real error
  // messages with the bare status phrase, so a 400 can arrive as the string
  // "Bad Request" rather than JSON. Read it either way.
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (err) {
    body = { message: text };
  }

  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

export const getMe = () => request('/api/admin/me');
export const getFlags = () => request('/api/admin/settings');
export const setFlag = (key, enabled) =>
  request(`/api/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });

export const getUsers = () => request('/api/admin/users');
export const setUserActive = (id, active) =>
  request(`/api/admin/users/${id}/${active ? 'enable' : 'disable'}`, { method: 'POST' });
