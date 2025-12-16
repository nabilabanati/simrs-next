-- Add columns for visit attributes
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS kunjungan_ke INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS keluhan TEXT;
