// Migrate db.json data to PostgreSQL
// Run once: node server/migrate-from-json.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db.json');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://electica:electica@localhost:5432/electica_bss'
});

async function migrate() {
  const db = JSON.parse(readFileSync(DB_PATH, 'utf8'));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Stations
    for (const s of (db.stations || [])) {
      await client.query(`
        INSERT INTO stations (id, name, location, status, pods, total_swaps_today, total_swaps_month, revenue_today, revenue_month, uptime, lat, lng)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO NOTHING
      `, [s.id, s.name, s.location, s.status, s.pods, s.totalSwapsToday, s.totalSwapsMonth, s.revenueToday, s.revenueMonth, s.uptime, s.lat, s.lng]);
    }
    console.log(`Migrated ${(db.stations || []).length} stations`);

    // Batteries
    for (const b of (db.batteries || [])) {
      await client.query(`
        INSERT INTO batteries (id, station_id, station_name, status, assigned_to, soc, health, cycle_count, temperature, last_swap)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `, [b.id, b.stationId, b.stationName, b.status, b.assignedTo, b.soc, b.health, b.cycleCount, b.temperature, b.lastSwap]);
    }
    console.log(`Migrated ${(db.batteries || []).length} batteries`);

    // Users
    for (const u of (db.users || [])) {
      await client.query(`
        INSERT INTO users (id, name, initials, phone, vehicle, vehicle_id, battery_id, station, swap_count, total_spent, kyc_status, deposit_paid, deposit_txn_id, aadhaar, pan, onboarded_by, onboarded_at, last_swap, registered_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        ON CONFLICT (id) DO NOTHING
      `, [u.id, u.name, u.initials, u.phone, u.vehicle, u.vehicleId, u.batteryId, u.station, u.swapCount, u.totalSpent, u.kycStatus, u.depositPaid, u.depositTxnId, u.aadhaar, u.pan, u.onboardedBy, u.onboardedAt, u.lastSwap, u.onboardedAt || u.registeredAt]);
    }
    console.log(`Migrated ${(db.users || []).length} users`);

    // Swaps
    for (const s of (db.swaps || [])) {
      await client.query(`
        INSERT INTO swaps (id, user_id, station_id, station_name, battery_out, battery_in, amount, transaction_id, status, timestamp)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `, [s.id, s.userId, s.stationId, s.stationName, s.batteryOut, s.batteryIn, s.amount, s.transactionId, s.status, s.timestamp]);
    }
    console.log(`Migrated ${(db.swaps || []).length} swaps`);

    // Transactions
    for (const t of (db.transactions || [])) {
      await client.query(`
        INSERT INTO transactions (id, user_id, type, amount, mode, status, description, timestamp)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO NOTHING
      `, [t.id, t.userId, t.type, t.amount, t.mode, t.status, t.description, t.timestamp]);
    }
    console.log(`Migrated ${(db.transactions || []).length} transactions`);

    // Tickets
    for (const t of (db.tickets || [])) {
      await client.query(`
        INSERT INTO tickets (id, type, user_id, agent_id, target_agent_id, battery_id, station_id, subject, category, description, status, response, responded_by, responded_at, timestamp)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO NOTHING
      `, [t.id, t.type, t.userId, t.agentId, t.targetAgentId, t.batteryId, t.stationId, t.subject, t.category, t.description, t.status, t.response, t.respondedBy, t.respondedAt, t.timestamp]);
    }
    console.log(`Migrated ${(db.tickets || []).length} tickets`);

    // Admins
    for (const a of (db.admins || [])) {
      await client.query(`
        INSERT INTO admins (id, username, name, email, password_hash)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (id) DO NOTHING
      `, [a.id, a.username, a.name, a.email || null, a.passwordHash]);
    }
    console.log(`Migrated ${(db.admins || []).length} admins`);

    // Agents
    for (const a of (db.agents || [])) {
      await client.query(`
        INSERT INTO agents (id, name, zone, password_hash)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (id) DO NOTHING
      `, [a.id, a.name, a.zone, a.passwordHash]);
    }
    console.log(`Migrated ${(db.agents || []).length} agents`);

    await client.query('COMMIT');
    console.log('\nMigration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
