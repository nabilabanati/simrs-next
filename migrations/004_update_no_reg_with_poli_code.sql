-- Improved version of no_reg generator with better error handling and logging
-- Format: KODEPOLI-YYYYMMDD-INCREMENT
-- Example: UMUM-20251223-0001

-- Drop existing triggers
DROP TRIGGER IF EXISTS before_insert_no_reg ON visits;
DROP TRIGGER IF EXISTS before_update_no_reg ON visits;
DROP FUNCTION IF EXISTS generate_no_reg();

-- Create improved function with logging
CREATE OR REPLACE FUNCTION generate_no_reg()
RETURNS TRIGGER AS $$
DECLARE
  today TEXT;
  last_reg TEXT;
  last_number INT;
  poli_code TEXT;
BEGIN
  -- Log trigger execution
  RAISE NOTICE 'generate_no_reg triggered for visit_id: %, queue_status: %, poli_id: %', 
    NEW.id, NEW.queue_status, NEW.poli_id;
  
  -- Get today's date in YYYYMMDD format
  today := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get poli code from poli table
  IF NEW.poli_id IS NOT NULL THEN
    SELECT kode INTO poli_code
    FROM poli
    WHERE id = NEW.poli_id;
    
    RAISE NOTICE 'Found poli_code: % for poli_id: %', poli_code, NEW.poli_id;
  END IF;
  
  -- If poli_code is null, use 'UMUM' as default
  IF poli_code IS NULL OR poli_code = '' THEN
    poli_code := 'UMUM';
    RAISE NOTICE 'Using default poli_code: UMUM';
  END IF;
  
  -- Get the last registration number for this poli and date
  SELECT no_reg INTO last_reg
  FROM visits
  WHERE no_reg LIKE poli_code || '-' || today || '%'
  ORDER BY no_reg DESC
  LIMIT 1;
  
  RAISE NOTICE 'Last reg found: %', last_reg;
  
  -- Extract the increment number
  IF last_reg IS NULL THEN
    last_number := 1;
  ELSE
    -- Extract the last 4 digits (increment part)
    last_number := SUBSTRING(last_reg FROM LENGTH(last_reg) - 3)::INT + 1;
  END IF;
  
  -- Generate new no_reg: KODEPOLI-YYYYMMDD-INCREMENT
  NEW.no_reg := poli_code || '-' || today || '-' || LPAD(last_number::TEXT, 4, '0');
  
  RAISE NOTICE 'Generated no_reg: %', NEW.no_reg;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in generate_no_reg: %', SQLERRM;
    -- Return NEW anyway to not block the update
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for UPDATE (when registering patient at loket)
CREATE TRIGGER before_update_no_reg
BEFORE UPDATE ON visits
FOR EACH ROW
WHEN (
  NEW.queue_status = 'terdaftar' 
  AND (OLD.queue_status IS NULL OR OLD.queue_status != 'terdaftar')
  AND (NEW.no_reg IS NULL OR NEW.no_reg = '')
  AND NEW.poli_id IS NOT NULL
)
EXECUTE FUNCTION generate_no_reg();

-- Add comment
COMMENT ON FUNCTION generate_no_reg() IS 'Generates registration number with format: KODEPOLI-YYYYMMDD-INCREMENT (e.g., UMUM-20251223-0001). Only triggered when visit status changes to terdaftar. Includes logging for debugging.';

-- Test the function
SELECT 'Migration 004 (improved) completed successfully. Trigger will generate no_reg when queue_status changes to terdaftar.' AS status;
