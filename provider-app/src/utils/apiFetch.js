// Authenticated fetch wrapper for Provider App
import { API_BASE } from '../config.js';

const TOKEN_KEY = 'electica_agent_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('electica_agent_data');
}

export function getAgent() {
  try {
    return JSON.parse(localStorage.getItem('electica_agent_data'));
  } catch {
    return null;
  }
}

export function setAgent(agent) {
  localStorage.setItem('electica_agent_data', JSON.stringify(agent));
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
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  return res;
}
