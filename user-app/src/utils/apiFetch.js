// Authenticated fetch wrapper for User App
import { API_BASE } from '../config.js';

const TOKEN_KEY = 'electica_user_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    // Only reload if there was a token (session expired)
    // Don't reload if there was no token (pre-auth request)
    clearToken();
    localStorage.removeItem('electica_auth');
    window.location.reload();
    throw new Error('Session expired');
  }

  return res;
}
