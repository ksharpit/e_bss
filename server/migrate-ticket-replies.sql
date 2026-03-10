-- Add replies, resolved_at, approved_by columns to tickets table
-- Run: psql -U electica -d electica_bss -f server/migrate-ticket-replies.sql

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approved_by TEXT;
