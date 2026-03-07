// ============================================
// Station Card Component (Electica - Coral Theme)
// ============================================
import { icon } from './icons.js';
import { formatCurrency } from '../utils/helpers.js';

function slotDots(pods) {
  return pods.map(p => {
    const bg = p.status === 'ready' ? '#22c55e'
             : p.status === 'charging' ? '#D4654A'
             : p.status === 'fault' ? '#ef4444'
             : '#e2e8f0';
    return `<span style="width:9px;height:9px;border-radius:50%;background:${bg};display:inline-block;margin:1.5px;flex-shrink:0"></span>`;
  }).join('');
}

export function createStationCard(station, pods = []) {
  const isOnline = station.status === 'online';
  const readyCount    = pods.filter(p => p.status === 'ready').length;
  const chargingCount = pods.filter(p => p.status === 'charging').length;
  const queueCount    = Math.max(0, station.swapsToday % 5);
  const uptimeColor   = station.uptime >= 99 ? '#16a34a' : station.uptime >= 95 ? '#d97706' : '#ef4444';

  const iconBg        = isOnline ? 'rgba(212,101,74,0.12)' : '#f1f5f9';
  const iconColor     = isOnline ? '#D4654A' : '#94a3b8';

  return `
    <div onclick="location.hash='#station/${station.id}'"
         style="background:white;border-radius:16px;border:1px solid #e8e8e8;
                padding:1.25rem;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;
                ${!isOnline ? 'opacity:0.75' : ''}"
         onmouseover="this.style.boxShadow='0 8px 28px rgba(212,101,74,0.14)';this.style.transform='translateY(-2px)'"
         onmouseout="this.style.boxShadow='none';this.style.transform='translateY(0)'">

      <!-- Decorative background glow -->
      ${isOnline ? `<div style="position:absolute;top:-30px;right:-30px;width:100px;height:100px;background:radial-gradient(circle,rgba(212,101,74,0.06) 0%,transparent 70%);pointer-events:none"></div>` : ''}

      <!-- Header: icon + name + badge -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.875rem">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:42px;height:42px;background:${iconBg};border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span class="material-symbols-outlined" style="font-size:22px;color:${iconColor};font-variation-settings:'FILL' 1">ev_station</span>
          </div>
          <div>
            <h3 style="font-size:var(--font-lg);font-weight:700;color:#0f172a;line-height:1.2;margin-bottom:2px">${station.name}</h3>
            <p style="font-size:var(--font-xs);color:#94a3b8;display:flex;align-items:center;gap:3px">
              ${icon('location_on', '12px', 'color:#cbd5e1')} ${station.location}
            </p>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
          ${isOnline
            ? `<span style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:var(--radius-full);background:#f0fdf4;color:#16a34a;font-size:10px;font-weight:700;border:1px solid #bbf7d0">
                 <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite"></span> Online
               </span>`
            : `<span style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:var(--radius-full);background:#fef9ec;color:#d97706;font-size:10px;font-weight:700;border:1px solid #fde68a">
                 <span style="width:6px;height:6px;border-radius:50%;background:#f59e0b"></span> Maintenance
               </span>`
          }
          <span style="font-family:monospace;font-size:9px;font-weight:700;color:#D4654A;background:rgba(212,101,74,0.08);padding:2px 8px;border-radius:4px;border:1px solid rgba(212,101,74,0.20)">${station.id}</span>
        </div>
      </div>

      <!-- Slot dots -->
      <div style="background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;margin-bottom:0.875rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em">Slot Availability</span>
          <span style="font-size:var(--font-xs);font-weight:700;color:${isOnline ? '#D4654A' : '#94a3b8'}">${readyCount} / ${pods.length} Ready</span>
        </div>
        <div style="display:flex;gap:3px;flex-wrap:wrap">${slotDots(pods)}</div>
      </div>

      <!-- Stats triptych -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr ${isOnline ? '1fr' : ''};gap:8px;margin-bottom:0.875rem">
        <div style="text-align:center;padding:8px 6px;background:#f0fdf4;border-radius:8px;border:1px solid #dcfce7">
          <p style="font-size:1.1rem;font-weight:800;color:#16a34a">${readyCount}</p>
          <p style="font-size:9px;font-weight:700;color:#86efac;text-transform:uppercase;letter-spacing:0.04em">Ready</p>
        </div>
        <div style="text-align:center;padding:8px 6px;background:rgba(212,101,74,0.07);border-radius:8px;border:1px solid rgba(212,101,74,0.18)">
          <p style="font-size:1.1rem;font-weight:800;color:#D4654A">${chargingCount}</p>
          <p style="font-size:9px;font-weight:700;color:#D4654A;text-transform:uppercase;letter-spacing:0.04em;opacity:0.7">Charging</p>
        </div>
        <div style="text-align:center;padding:8px 6px;background:${queueCount > 0 ? '#fef9ec' : '#f8fafc'};border-radius:8px;border:1px solid ${queueCount > 0 ? '#fde68a' : '#f1f5f9'}">
          <p style="font-size:1.1rem;font-weight:800;color:${queueCount > 0 ? '#d97706' : '#94a3b8'}">${queueCount}</p>
          <p style="font-size:9px;font-weight:700;color:${queueCount > 0 ? '#f59e0b' : '#94a3b8'};text-transform:uppercase;letter-spacing:0.04em;opacity:0.8">Queue</p>
        </div>
        ${isOnline ? `
        <div style="text-align:center;padding:8px 6px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9">
          <p style="font-size:1.1rem;font-weight:800;color:${uptimeColor}">${station.uptime}%</p>
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em">Uptime</p>
        </div>` : ''}
      </div>

      <!-- Footer: swaps + revenue -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:0.875rem;border-top:1px solid #f1f5f9">
        <div>
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px">Swaps Today</p>
          <p style="font-size:var(--font-xl);font-weight:800;color:#0f172a">${station.swapsToday}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px">Revenue Today</p>
          <p style="font-size:var(--font-xl);font-weight:800;color:#0f172a">${formatCurrency(station.revenueToday)}</p>
        </div>
      </div>
    </div>
  `;
}
