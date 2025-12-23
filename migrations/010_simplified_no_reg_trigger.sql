-- Migration 010: Simplified no_reg trigger without logging
-- Remove all RAISE NOTICE to avoid potential issues

DROP TRIGGER IF EXISTS before_insert_no_reg ON visits;
DROP FUNCTION IF EXISTS generate_no_reg();

-- Create simplified function
CREATE OR REPLACE FUNCTION generate_no_reg()
RETURNS TRIGGER AS $$
DECLARE
  today TEXT;
  last_reg TEXT;
  last_number INT;
  poli_code TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get poli code from poli table
  IF NEW.poli_id IS NOT NULL THEN
    SELECT kode INTO poli_code
    FROM poli
    WHERE id = NEW.poli_id;
  END IF;
  
  -- If poli_code is null, use 'UMUM' as default
  IF poli_code IS NULL OR poli_code = '' THEN
    poli_code := 'UMUM';
  END IF;
  
  -- Get the last registration number for this poli and date
  SELECT no_reg INTO last_reg
  FROM visits
  WHERE no_reg LIKE poli_code || '-' || today || '%'
  ORDER BY no_reg DESC
  LIMIT 1;
  
  -- Extract the increment number
  IF last_reg IS NULL THEN
    last_number := 1;
  ELSE
    -- Extract the last 4 digits (increment part)
    last_number := SUBSTRING(last_reg FROM LENGTH(last_reg) - 3)::INT + 1;
  END IF;
  
  -- Generate new no_reg: KODEPOLI-YYYYMMDD-INCREMENT
  NEW.no_reg := poli_code || '-' || today || '-' || LPAD(last_number::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER before_insert_no_reg
BEFORE INSERT ON visits
FOR EACH ROW
WHEN (NEW.no_reg IS NULL AND NEW.poli_id IS NOT NULL)
EXECUTE FUNCTION generate_no_reg();

-- Test with a simple query
SELECT 'Migration 010 completed: Simplified no_reg trigger created' AS status;

-- Show trigger info
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'visits'
  AND trigger_name = 'before_insert_no_reg';
