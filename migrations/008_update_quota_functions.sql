-- Migration 008: Update quota check functions for new schema
-- Fix check_poli_quota and check_doctor_quota to work without queue_status column

-- ============================================
-- Update check_poli_quota function
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
  -- Since visits are only created when registered, just count all visits
  SELECT COUNT(*) INTO current_count
  FROM visits
  WHERE poli_id = p_poli_id
    AND created_at >= today_start;
  
  -- Return true if quota available
  RETURN current_count < poli_quota;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Update check_doctor_quota function
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
  -- Since visits are only created when registered, just count all visits
  SELECT COUNT(*) INTO current_count
  FROM visits
  WHERE dokter_id = p_dokter_id
    AND created_at >= today_start;
  
  -- Return true if quota available
  RETURN current_count < doctor_quota;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION check_poli_quota(UUID) IS 'Check if poli has available quota for today. Returns TRUE if quota available or unlimited.';
COMMENT ON FUNCTION check_doctor_quota(UUID) IS 'Check if doctor has available quota for today. Returns TRUE if quota available or unlimited.';

-- Display success message
SELECT 'Migration 008 completed: Quota check functions updated for new schema' AS status;
