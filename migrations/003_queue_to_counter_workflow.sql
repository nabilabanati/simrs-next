-- Migration: Queue-to-Counter Workflow Integration
-- This migration integrates the queue system into the visits table
-- and adds quota tracking to poli and doctors tables

-- ============================================
-- Step 1: Add queue-related columns to visits
-- ============================================

-- Add loket assignment column
ALTER TABLE visits ADD COLUMN IF NOT EXISTS loket_id INTEGER 
  CHECK (loket_id BETWEEN 1 AND 5);

-- Add queue number column
ALTER TABLE visits ADD COLUMN IF NOT EXISTS queue_number INTEGER;

-- Add queue status column with specific workflow states
ALTER TABLE visits ADD COLUMN IF NOT EXISTS queue_status TEXT 
  DEFAULT 'menunggu_loket' 
  CHECK (queue_status IN ('menunggu_loket', 'dipanggil', 'terdaftar', 'batal', 'no_show'));

-- Add timestamp columns for tracking
ALTER TABLE visits ADD COLUMN IF NOT EXISTS called_at TIMESTAMPTZ;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;

-- Add keluhan (complaint) column if not exists
ALTER TABLE visits ADD COLUMN IF NOT EXISTS keluhan TEXT;

-- Add penjamin_id (payment method) column if not exists
ALTER TABLE visits ADD COLUMN IF NOT EXISTS penjamin_id UUID REFERENCES penjamin(id) ON DELETE SET NULL;

-- Add harga (price) column if not exists
ALTER TABLE visits ADD COLUMN IF NOT EXISTS harga NUMERIC DEFAULT 0;

-- Add kunjungan_ke (visit number) column if not exists
ALTER TABLE visits ADD COLUMN IF NOT EXISTS kunjungan_ke INTEGER DEFAULT 1;

-- ============================================
-- Step 2: Add quota columns to poli
-- ============================================

ALTER TABLE poli ADD COLUMN IF NOT EXISTS kuota_harian INTEGER DEFAULT 50;

-- Add comment for clarity
COMMENT ON COLUMN poli.kuota_harian IS 'Kuota maksimal pasien per hari untuk poli ini. Diatur oleh admin.';

-- ============================================
-- Step 3: Add quota columns to doctors
-- ============================================

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS kuota_harian INTEGER DEFAULT 30;

-- Add comment for clarity
COMMENT ON COLUMN doctors.kuota_harian IS 'Kuota maksimal pasien per hari untuk dokter ini. Diatur oleh admin.';

-- ============================================
-- Step 4: Create indexes for performance
-- ============================================

-- Index for queue queries (loket + status)
CREATE INDEX IF NOT EXISTS idx_visits_loket_queue_status 
  ON visits(loket_id, queue_status) 
  WHERE queue_status IN ('menunggu_loket', 'dipanggil');

-- Index for queue number queries
CREATE INDEX IF NOT EXISTS idx_visits_queue_number 
  ON visits(queue_number DESC) 
  WHERE queue_number IS NOT NULL;

-- Index for daily quota queries (poli)
CREATE INDEX IF NOT EXISTS idx_visits_poli_date 
  ON visits(poli_id, created_at) 
  WHERE queue_status = 'terdaftar';

-- Index for daily quota queries (doctor)
CREATE INDEX IF NOT EXISTS idx_visits_doctor_date 
  ON visits(dokter_id, created_at) 
  WHERE queue_status = 'terdaftar';

-- Index for FIFO queue ordering
CREATE INDEX IF NOT EXISTS idx_visits_created_at_queue 
  ON visits(created_at ASC) 
  WHERE queue_status = 'menunggu_loket';

-- ============================================
-- Step 5: Create function for load balancing
-- ============================================

-- Function to get loket with minimum active visits
CREATE OR REPLACE FUNCTION get_least_busy_loket()
RETURNS INTEGER AS $$
DECLARE
  least_busy_loket INTEGER;
BEGIN
  -- Count active visits per loket (menunggu_loket + dipanggil)
  -- Return loket with minimum count
  SELECT loket_id INTO least_busy_loket
  FROM (
    SELECT 
      loket_id,
      COUNT(*) as active_count
    FROM visits
    WHERE queue_status IN ('menunggu_loket', 'dipanggil')
      AND loket_id IS NOT NULL
    GROUP BY loket_id
    
    UNION ALL
    
    -- Include lokets with zero active visits
    SELECT 
      generate_series(1, 5) as loket_id,
      0 as active_count
  ) loket_counts
  GROUP BY loket_id
  ORDER BY SUM(active_count) ASC, loket_id ASC
  LIMIT 1;
  
  RETURN least_busy_loket;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 6: Create function for daily queue reset
-- ============================================

-- Function to get next queue number for today
CREATE OR REPLACE FUNCTION get_next_queue_number()
RETURNS INTEGER AS $$
DECLARE
  today_start TIMESTAMPTZ;
  max_queue INTEGER;
BEGIN
  -- Get start of today
  today_start := DATE_TRUNC('day', NOW());
  
  -- Get max queue number for today
  SELECT COALESCE(MAX(queue_number), 0) INTO max_queue
  FROM visits
  WHERE created_at >= today_start
    AND queue_number IS NOT NULL;
  
  -- Return next number
  RETURN max_queue + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 7: Create function to check poli quota
-- ============================================

CREATE OR REPLACE FUNCTION check_poli_quota(p_poli_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  today_start TIMESTAMPTZ;
  poli_quota INTEGER;
  current_count INTEGER;
BEGIN
  -- Get start of today
  today_start := DATE_TRUNC('day', NOW());
  
  -- Get poli quota
  SELECT kuota_harian INTO poli_quota
  FROM poli
  WHERE id = p_poli_id;
  
  -- If no quota set, allow unlimited
  IF poli_quota IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Count registered visits for this poli today
  SELECT COUNT(*) INTO current_count
  FROM visits
  WHERE poli_id = p_poli_id
    AND queue_status = 'terdaftar'
    AND created_at >= today_start;
  
  -- Return true if quota available
  RETURN current_count < poli_quota;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 8: Create function to check doctor quota
-- ============================================

CREATE OR REPLACE FUNCTION check_doctor_quota(p_dokter_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  today_start TIMESTAMPTZ;
  doctor_quota INTEGER;
  current_count INTEGER;
BEGIN
  -- Get start of today
  today_start := DATE_TRUNC('day', NOW());
  
  -- Get doctor quota
  SELECT kuota_harian INTO doctor_quota
  FROM doctors
  WHERE id = p_dokter_id;
  
  -- If no quota set, allow unlimited
  IF doctor_quota IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Count registered visits for this doctor today
  SELECT COUNT(*) INTO current_count
  FROM visits
  WHERE dokter_id = p_dokter_id
    AND queue_status = 'terdaftar'
    AND created_at >= today_start;
  
  -- Return true if quota available
  RETURN current_count < doctor_quota;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 9: Add comments for documentation
-- ============================================

COMMENT ON COLUMN visits.loket_id IS 'Loket yang ditugaskan untuk visit ini (1-5). Ditentukan otomatis berdasarkan load balancing.';
COMMENT ON COLUMN visits.queue_number IS 'Nomor antrian global harian. Reset setiap hari.';
COMMENT ON COLUMN visits.queue_status IS 'Status antrian: menunggu_loket, dipanggil, terdaftar, batal, no_show';
COMMENT ON COLUMN visits.called_at IS 'Waktu saat antrian dipanggil oleh loket';
COMMENT ON COLUMN visits.registered_at IS 'Waktu saat registrasi selesai (data lengkap)';

-- ============================================
-- Migration Complete
-- ============================================

-- Note: This migration is safe to run multiple times (idempotent)
-- All ALTER TABLE statements use IF NOT EXISTS
-- All CREATE INDEX statements use IF NOT EXISTS
-- All functions use CREATE OR REPLACE
