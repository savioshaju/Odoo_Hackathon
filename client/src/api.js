
const DEMO_KEY = 'loopledger.demoUser';

export function getDemoUser() {
  try {
    return localStorage.getItem(DEMO_KEY) || 'admin';
  } catch {
    return 'admin';
  }
}

export function setDemoUser(key) {
  try {
    localStorage.setItem(DEMO_KEY, key);
  } catch {
  }
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(path, { method = 'GET', body, base = '/api/billing' } = {}) {
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Demo-User': getDemoUser() },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network', 'The server is not reachable. Is it running (npm run dev)?');
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
  }
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(res.status, e.code ?? 'error', e.message ?? `Request failed (${res.status})`, e.details);
  }
  return data;
}
