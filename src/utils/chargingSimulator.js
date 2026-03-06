// ============================================
// Charging Simulator — Background Service
// ============================================
// Batteries with status "charging" will reach 100% SOC in 1.5 hours,
// then automatically flip to "available".

import { API_BASE } from '../config.js';
const API = API_BASE;
const FULL_CHARGE_MS = 1.5 * 60 * 60 * 1000; // 1.5 hours in ms
const TICK_INTERVAL  = 30_000;                 // update every 30 seconds

let timer = null;

async function tick() {
  let batteries;
  try {
    batteries = await fetch(`${API}/batteries?status=charging`).then(r => r.json());
  } catch { return; }

  if (!batteries.length) return;

  for (const b of batteries) {
    const soc = b.soc ?? 0;
    if (soc >= 100) {
      // Fully charged → flip to available
      await patch(b.id, { soc: 100, status: 'available' });
      continue;
    }

    // Calculate increment: remaining % spread over remaining time
    // Linear charge: gain (100 - startSOC) over FULL_CHARGE_MS
    // Per tick we gain: (100 / (FULL_CHARGE_MS / TICK_INTERVAL))
    const incrementPerTick = 100 / (FULL_CHARGE_MS / TICK_INTERVAL);
    const newSoc = Math.min(100, Math.round(soc + incrementPerTick));

    if (newSoc >= 100) {
      await patch(b.id, { soc: 100, status: 'available' });
    } else {
      await patch(b.id, { soc: newSoc });
    }
  }
}

async function patch(id, data) {
  try {
    await fetch(`${API}/batteries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch { /* silent */ }
}

export function startChargingSimulator() {
  if (timer) return;
  // Run first tick immediately, then repeat
  tick();
  timer = setInterval(tick, TICK_INTERVAL);
}

export function stopChargingSimulator() {
  if (timer) { clearInterval(timer); timer = null; }
}
