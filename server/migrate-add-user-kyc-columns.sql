-- Add missing KYC/onboarding columns and swap type
-- Run once on production: psql -U electica -d electica_bss -f server/migrate-add-user-kyc-columns.sql

-- Users table: KYC proof columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_proof    JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_photo   JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;

-- Swaps table: type column for allocation vs regular swap
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS type TEXT;
