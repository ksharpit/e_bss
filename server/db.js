// Database connection pool and helpers
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://electica:electica@localhost:5432/electica_bss'
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

// Column name mapping: camelCase (API) <-> snake_case (DB)
const COL_MAP = {
  // stations
  totalSwapsToday: 'total_swaps_today',
  totalSwapsMonth: 'total_swaps_month',
  revenueToday: 'revenue_today',
  revenueMonth: 'revenue_month',
  createdAt: 'created_at',
  // batteries
  deviceId: 'device_id',
  stationId: 'station_id',
  stationName: 'station_name',
  assignedTo: 'assigned_to',
  cycleCount: 'cycle_count',
  lastSwap: 'last_swap',
  lastTelemetry: 'last_telemetry',
  currentDraw: 'current_draw',
  // users
  vehicleId: 'vehicle_id',
  batteryId: 'battery_id',
  swapCount: 'swap_count',
  totalSpent: 'total_spent',
  kycStatus: 'kyc_status',
  depositPaid: 'deposit_paid',
  depositTxnId: 'deposit_txn_id',
  onboardedBy: 'onboarded_by',
  onboardedAt: 'onboarded_at',
  registeredAt: 'registered_at',
  // swaps
  userId: 'user_id',
  batteryOut: 'battery_out',
  batteryIn: 'battery_in',
  transactionId: 'transaction_id',
  // tickets
  agentId: 'agent_id',
  targetAgentId: 'target_agent_id',
  respondedBy: 'responded_by',
  respondedAt: 'responded_at',
  resolvedAt: 'resolved_at',
  approvedBy: 'approved_by',
  // admins
  passwordHash: 'password_hash',
  // common
  capAvailable: 'cap_available',
  capInitial: 'cap_initial',
  podTemp: 'pod_temp',
  cellVoltages: 'cell_voltages',
  ntcTemps: 'ntc_temps',
  pduTemps: 'pdu_temps',
};

// Reverse map: snake_case -> camelCase
const REVERSE_COL_MAP = {};
for (const [camel, snake] of Object.entries(COL_MAP)) {
  REVERSE_COL_MAP[snake] = camel;
}

// Convert DB row (snake_case) to API response (camelCase)
export function rowToCamel(row) {
  if (!row) return null;
  const out = {};
  for (const [key, val] of Object.entries(row)) {
    const camelKey = REVERSE_COL_MAP[key] || key;
    out[camelKey] = val;
  }
  return out;
}

// Convert API body (camelCase) to DB columns (snake_case)
export function bodyToSnake(body) {
  const out = {};
  for (const [key, val] of Object.entries(body)) {
    const snakeKey = COL_MAP[key] || key;
    out[snakeKey] = val;
  }
  return out;
}

export default pool;
