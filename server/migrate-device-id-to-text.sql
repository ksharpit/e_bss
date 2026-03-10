-- Migration: Change device_id from INTEGER to TEXT
-- Run on EC2: sudo -u postgres psql -d electica_bss -f /var/www/electica/server/migrate-device-id-to-text.sql

-- Batteries table
ALTER TABLE batteries ALTER COLUMN device_id TYPE TEXT USING device_id::TEXT;

-- Battery telemetry table
ALTER TABLE battery_telemetry ALTER COLUMN device_id TYPE TEXT USING device_id::TEXT;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name IN ('batteries', 'battery_telemetry') AND column_name = 'device_id';
