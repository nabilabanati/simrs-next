-- Migration: Create queue system tables for multi-loket queue management
-- This migration creates both queue_counters and queue_tickets tables

-- Step 1: Create queue_counters table (must be created first)
CREATE TABLE IF NOT EXISTS queue_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loket_nama VARCHAR(50) UNIQUE NOT NULL,
  current_queue INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create queue_tickets table
CREATE TABLE IF NOT EXISTS queue_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_number INTEGER NOT NULL,
  loket_id INTEGER NOT NULL CHECK (loket_id BETWEEN 1 AND 5),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'completed', 'cancelled')),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_queue_tickets_loket_status ON queue_tickets(loket_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_tickets_created_at ON queue_tickets(created_at DESC);

-- Insert seed data for queue_counters (5 lokets)
INSERT INTO queue_counters (id, loket_nama, current_queue, updated_at)
VALUES 
  (uuid_generate_v4(), 'LOKET-1', 0, NOW()),
  (uuid_generate_v4(), 'LOKET-2', 0, NOW()),
  (uuid_generate_v4(), 'LOKET-3', 0, NOW()),
  (uuid_generate_v4(), 'LOKET-4', 0, NOW()),
  (uuid_generate_v4(), 'LOKET-5', 0, NOW())
ON CONFLICT (loket_nama) DO NOTHING;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on queue_tickets
CREATE TRIGGER update_queue_tickets_updated_at BEFORE UPDATE ON queue_tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
