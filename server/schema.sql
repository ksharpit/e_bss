-- Electica BSS - PostgreSQL + TimescaleDB Schema
-- Run once on fresh database to create all tables

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- =============================================
-- BUSINESS TABLES (regular PostgreSQL)
-- =============================================

-- Stations
CREATE TABLE IF NOT EXISTS stations (
    id          TEXT PRIMARY KEY,            -- BSS-001
    name        TEXT NOT NULL,
    location    TEXT,
    status      TEXT DEFAULT 'online',       -- online, maintenance, offline
    pods        INTEGER DEFAULT 0,
    total_swaps_today   INTEGER DEFAULT 0,
    total_swaps_month   INTEGER DEFAULT 0,
    revenue_today       NUMERIC(12,2) DEFAULT 0,
    revenue_month       NUMERIC(12,2) DEFAULT 0,
    uptime      NUMERIC(5,2) DEFAULT 100,
    lat         NUMERIC(10,6),
    lng         NUMERIC(10,6),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Batteries
CREATE TABLE IF NOT EXISTS batteries (
    id              TEXT PRIMARY KEY,        -- BAT-0001
    device_id       TEXT UNIQUE,             -- BMS device_id field (e.g. "ESP32_BMS_01")
    station_id      TEXT REFERENCES stations(id) ON DELETE SET NULL,
    station_name    TEXT,
    status          TEXT DEFAULT 'stock',    -- stock, available, charging, deployed, fault
    assigned_to     TEXT,                    -- user ID
    soc             NUMERIC(5,2) DEFAULT 0,  -- state of charge %
    health          NUMERIC(5,2) DEFAULT 100,-- state of health %
    cycle_count     INTEGER DEFAULT 0,
    temperature     NUMERIC(5,1) DEFAULT 0,
    voltage         NUMERIC(7,3) DEFAULT 0,  -- pack voltage
    current_draw    NUMERIC(12,3) DEFAULT 0, -- current in amps
    last_swap       TIMESTAMPTZ,
    last_telemetry  TIMESTAMPTZ,             -- last MQTT data received
    cap_initial     NUMERIC(10,2),           -- initial capacity (Ah) from BMS
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Users (customers)
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,        -- USR-0001
    name            TEXT NOT NULL,
    initials        TEXT,
    phone           TEXT UNIQUE NOT NULL,
    vehicle         TEXT,
    vehicle_id      TEXT,
    battery_id      TEXT,
    station         TEXT,
    swap_count      INTEGER DEFAULT 0,
    total_spent     NUMERIC(12,2) DEFAULT 0,
    kyc_status      TEXT DEFAULT 'pending',  -- pending, verified, rejected
    deposit_paid    BOOLEAN DEFAULT FALSE,
    deposit_txn_id  TEXT,
    aadhaar         TEXT,
    pan             TEXT,
    onboarded_by    TEXT,                    -- agent ID
    onboarded_at    TIMESTAMPTZ,
    last_swap       TIMESTAMPTZ,
    registered_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Swaps
CREATE TABLE IF NOT EXISTS swaps (
    id              TEXT PRIMARY KEY,        -- SWP-0001
    user_id         TEXT REFERENCES users(id),
    station_id      TEXT REFERENCES stations(id),
    station_name    TEXT,
    battery_out     TEXT,                    -- battery given to user
    battery_in      TEXT,                    -- battery returned by user
    amount          NUMERIC(10,2) DEFAULT 65,
    transaction_id  TEXT,
    status          TEXT DEFAULT 'completed',
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id              TEXT PRIMARY KEY,        -- TXN-DP-0001
    user_id         TEXT REFERENCES users(id),
    type            TEXT NOT NULL,           -- security_deposit, swap_fee, refund
    amount          NUMERIC(12,2) NOT NULL,
    mode            TEXT,                    -- UPI, cash, card
    status          TEXT DEFAULT 'completed',
    description     TEXT,
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets (support, fault reports, queries)
CREATE TABLE IF NOT EXISTS tickets (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL,           -- fault_report, repair_request, query, admin_query
    user_id         TEXT,
    agent_id        TEXT,
    target_agent_id TEXT,
    battery_id      TEXT,
    station_id      TEXT,
    subject         TEXT,
    category        TEXT,
    description     TEXT,
    status          TEXT DEFAULT 'open',     -- open, resolved, closed
    response        TEXT,
    responded_by    TEXT,
    responded_at    TIMESTAMPTZ,
    replies         JSONB DEFAULT '[]'::jsonb,
    resolved_at     TIMESTAMPTZ,
    approved_by     TEXT,
    timestamp       TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
    id              TEXT PRIMARY KEY,        -- ADM-001
    username        TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    email           TEXT,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (provider staff)
CREATE TABLE IF NOT EXISTS agents (
    id              TEXT PRIMARY KEY,        -- AGT-001
    name            TEXT NOT NULL,
    zone            TEXT,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TELEMETRY TABLE (TimescaleDB hypertable)
-- =============================================

-- Raw telemetry from BMS via MQTT
CREATE TABLE IF NOT EXISTS battery_telemetry (
    time            TIMESTAMPTZ NOT NULL,
    device_id       TEXT NOT NULL,           -- BMS device_id field
    battery_id      TEXT,                    -- resolved BAT-xxxx
    voltage         NUMERIC(7,3),            -- pack voltage (V)
    current_draw    NUMERIC(12,3),           -- current (A), negative = charging
    soc             NUMERIC(5,2),            -- state of charge %
    soh             NUMERIC(5,2),            -- state of health %
    cycle_count     INTEGER,
    cap_available   NUMERIC(10,2),           -- available capacity
    cap_initial     NUMERIC(10,2),           -- initial capacity
    pod_temp        NUMERIC(5,1),            -- pod temperature
    cell_voltages   NUMERIC(6,3)[],          -- 16 cell voltages array
    ntc_temps       NUMERIC(7,2)[],          -- 6 NTC temperature readings
    pdu_temps       NUMERIC(7,2)[]           -- 4 PDU temperature readings
);

-- Convert to hypertable (auto-partitions by time)
SELECT create_hypertable('battery_telemetry', 'time', if_not_exists => TRUE);

-- =============================================
-- INDEXES
-- =============================================

-- Battery lookups
CREATE INDEX IF NOT EXISTS idx_batteries_device_id ON batteries(device_id);
CREATE INDEX IF NOT EXISTS idx_batteries_station ON batteries(station_id);
CREATE INDEX IF NOT EXISTS idx_batteries_status ON batteries(status);
CREATE INDEX IF NOT EXISTS idx_batteries_assigned ON batteries(assigned_to);

-- User lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_kyc ON users(kyc_status);

-- Swap lookups
CREATE INDEX IF NOT EXISTS idx_swaps_user ON swaps(user_id);
CREATE INDEX IF NOT EXISTS idx_swaps_station ON swaps(station_id);
CREATE INDEX IF NOT EXISTS idx_swaps_time ON swaps(timestamp DESC);

-- Transaction lookups
CREATE INDEX IF NOT EXISTS idx_txn_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);

-- Ticket lookups
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_agent ON tickets(agent_id);

-- Telemetry lookups (hypertable auto-indexes time)
CREATE INDEX IF NOT EXISTS idx_telemetry_device ON battery_telemetry(device_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_battery ON battery_telemetry(battery_id, time DESC);

-- =============================================
-- DATA RETENTION POLICY
-- =============================================

-- Auto-delete telemetry older than 90 days
SELECT add_retention_policy('battery_telemetry', INTERVAL '90 days', if_not_exists => TRUE);

-- Compress telemetry older than 7 days (saves ~90% disk space)
ALTER TABLE battery_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('battery_telemetry', INTERVAL '7 days', if_not_exists => TRUE);
