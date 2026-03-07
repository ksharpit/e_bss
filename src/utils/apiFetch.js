// Authenticated fetch wrapper for Admin Dashboard
// Adds JWT token from localStorage to all API requests

import { API_BASE } from '../config.js';

const TOKEN_KEY = 'electica_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('electica_admin_user');
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem('electica_admin_user'));
  } catch {
    return null;
  }
}

export function setAdminUser(user) {
  localStorage.setItem('electica_admin_user', JSON.stringify(user));
}

// Drop-in replacement for fetch(API_BASE + path, options)
// Usage: apiFetch('/stations') or apiFetch('/stations', { method: 'PATCH', ... })
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto-set Content-Type for JSON bodies
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // If 401 and we had a token, session expired - redirect to login
  if (res.status === 401 && token) {
    clearToken();
    window.location.hash = '#login';
    throw new Error('Session expired');
  }

  return res;
}
