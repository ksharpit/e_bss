// ============================================
// Electica BSS - API Service Layer
// All apps consume data through these functions.
// ============================================

import { API_BASE as BASE } from '../config.js';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ─── Stations ───────────────────────────────
export const getStations = () => request('/stations');
export const getStation  = (id) => request(`/stations/${id}`);

// ─── Batteries ──────────────────────────────
export const getBatteries         = () => request('/batteries');
export const getBattery           = (id) => request(`/batteries/${id}`);
export const getBatteriesByStation = (stationId) => request(`/batteries?stationId=${stationId}`);
export const getAvailableBatteries = (stationId) => request(`/batteries?stationId=${stationId}&status=available`);
export const updateBattery        = (id, data) => request(`/batteries/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// ─── Users ──────────────────────────────────
export const getUsers         = () => request('/users');
export const getUser          = (id) => request(`/users/${id}`);
export const getUsersByStatus = (status) => request(`/users?kycStatus=${status}`);
export const updateUser       = (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// ─── KYC Actions (Provider App writes these) ─
export async function approveKYC(userId, { batteryId, depositTxnId, mode, providerId }) {
  return updateUser(userId, {
    kycStatus:     'verified',
    batteryId,
    depositPaid:   true,
    depositTxnId,
    onboardedBy:   providerId,
    onboardedAt:   new Date().toISOString(),
  });
}

export async function rejectKYC(userId, rejectionReason) {
  return updateUser(userId, {
    kycStatus: 'rejected',
    rejectionReason,
  });
}

// ─── Swaps ──────────────────────────────────
export const getSwaps        = () => request('/swaps');
export const getSwap         = (id) => request(`/swaps/${id}`);
export const getSwapsByUser  = (userId) => request(`/swaps?userId=${userId}`);
export const getSwapsByStation = (stationId) => request(`/swaps?stationId=${stationId}`);
export const createSwap      = (data) => request('/swaps', { method: 'POST', body: JSON.stringify(data) });

// ─── Transactions ───────────────────────────
export const getTransactions        = () => request('/transactions');
export const getTransactionsByUser  = (userId) => request(`/transactions?userId=${userId}`);
export const createTransaction      = (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) });

// ─── Full Swap Flow (User App calls this) ───
// Records the swap + payment in one action
export async function executeSwap({ userId, stationId, stationName, batteryOut, batteryIn, mode = 'QR' }) {
  const now = new Date().toISOString();
  const swapId = `SWP-${Date.now()}`;
  const txnId  = `TXN-SW-${Date.now()}`;

  const swap = await createSwap({
    id: swapId, userId, stationId, stationName,
    batteryOut, batteryIn,
    timestamp: now, amount: 65,
    transactionId: txnId, status: 'completed',
  });

  await createTransaction({
    id: txnId, userId, type: 'swap_payment',
    amount: 65, mode, status: 'completed',
    timestamp: now, swapId,
  });

  await updateUser(userId, { lastSwap: now });

  return swap;
}
