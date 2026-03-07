-- Add contact_info column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_info text;
