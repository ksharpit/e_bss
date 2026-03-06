// ============================================
// Battery Table Component (Electica)
// ============================================
import { socColor } from '../utils/helpers.js';

const statusBadge = {
  available: { cls: 'available', label: 'Available' },
  charging:  { cls: 'charging',  label: 'Charging'  },
  in_use:    { cls: 'online',    label: 'In Use'     },
  deployed:  { cls: 'online',    label: 'Deployed'   },
  stock:     { cls: 'empty',     label: 'In Stock'   },
  fault:     { cls: 'fault',     label: 'Fault'      },
  'in-use':  { cls: 'online',    label: 'In Use'     },
  retired:   { cls: 'fault',     label: 'Retired'    },
};

export function renderBatteryTable(batteries, filters = {}) {
  let filtered = [...batteries];

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(b => b.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(b =>
      b.id.toLowerCase().includes(q) ||
      (b.stationName || '').toLowerCase().includes(q) ||
      (b.stationId   || '').toLowerCase().includes(q) ||
      (b.assignedTo  || '').toLowerCase().includes(q) ||
      (b._userName   || '').toLowerCase().includes(q) ||
      (b._stationName|| '').toLowerCase().includes(q)
    );
  }

  const rows = filtered.map(b => {
    const badge = statusBadge[b.status] || { cls: 'empty', label: b.status };

    // Show where the battery is: with user or at station
    let location;
    if (b.status === 'deployed') {
      const name = b._userName || b.assignedTo || '—';
      const phone = b._userPhone ? ` <span style="color:#94a3b8;font-size:10px">${b._userPhone}</span>` : '';
      location = `<span style="font-size:var(--font-xs);color:#8b5cf6;font-weight:600">${name}</span>${phone}`;
    } else if (b.status === 'stock') {
      location = `<span style="font-size:var(--font-xs);color:#64748b">Warehouse</span>`;
    } else {
      const stName = b._stationName || b.stationName || b.stationId || '—';
      location = `<span style="font-size:var(--font-xs);color:var(--text-primary)">${stName}</span>`;
    }

    const swapCount = b._swapCount ?? b.cycleCount ?? b.swapCount ?? 0;

    return `
    <tr style="cursor:pointer;transition:background 0.15s" onclick="location.hash='#battery-detail/${b.id}'"
        onmouseover="this.style.background='rgba(212,101,74,0.03)'" onmouseout="this.style.background='transparent'">
      <td class="bold">${b.id}</td>
      <td>${location}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="soc-bar"><div class="soc-fill" style="width:${b.soc}%;background:${socColor(b.soc)}"></div></div>
          <span style="font-weight:600">${b.soc}%</span>
        </div>
      </td>
      <td style="color:${b.health >= 90 ? 'var(--color-success)' : b.health >= 70 ? 'var(--color-warning)' : 'var(--color-danger)'};font-weight:700">${b.health}%</td>
      <td>${swapCount.toLocaleString()}</td>
      <td>
        <span class="badge ${badge.cls}">
          <span class="badge-dot"></span>${badge.label}
        </span>
      </td>
    </tr>`;
  }).join('');

  return `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Battery ID</th>
            <th>Location / User</th>
            <th>SOC</th>
            <th>Health</th>
            <th>Swaps</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8">No batteries match</td></tr>'}</tbody>
      </table>
    </div>
  `;
}
