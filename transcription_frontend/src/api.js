import { API_BASE } from './apiConfig.js';

export async function apiRequest(path, { token, headers, ...options } = {}) {
  const finalHeaders = { ...(headers || {}) };
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: finalHeaders });

  if (!res.ok) {
    let detail = `Server error: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* response wasn't JSON */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}
