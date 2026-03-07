// ============================================
// API helpers
// ============================================

import { apiFetch } from './apiFetch.js';

export async function getUsers(agentId) {
  const res = await apiFetch(`/users?onboardedBy=${agentId}`);
  return res.json();
}

export async function getAllPendingUsers() {
  const res = await apiFetch('/users?kycStatus=pending');
  return res.json();
}

export async function createUser(data) {
  const res = await apiFetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create user');
  return res.json();
}

export async function getNextUserId() {
  const res = await apiFetch('/users');
  const users = await res.json();
  const nums = users.map(u => parseInt(u.id.replace('USR-', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `USR-${String(next).padStart(4, '0')}`;
}
