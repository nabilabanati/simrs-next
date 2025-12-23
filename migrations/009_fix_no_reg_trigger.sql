-- Migration 009: Fix no_reg trigger for new schema
-- Ensure trigger works on INSERT (not UPDATE) since visits are created at registration

-- Drop all existing triggers
DROP TRIGGER IF EXISTS before_insert_no_reg ON visits;
DROP TRIGGER IF EXISTS before_update_no_reg ON visits;

-- Recreate trigger for INSERT only
-- Visits are created when registration happens, so trigger on INSERT
CREATE TRIGGER before_insert_no_reg
BEFORE INSERT ON visits
FOR EACH ROW
WHEN (NEW.no_reg IS NULL AND NEW.poli_id IS NOT NULL)
EXECUTE FUNCTION generate_no_reg();

-- Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'visits'
  AND trigger_name LIKE '%no_reg%';

-- Add comment
COMMENT ON TRIGGER before_insert_no_reg ON visits IS 'Auto-generates no_reg when visit is inserted with poli_id';

-- Display success message
SELECT 'Migration 009 completed: no_reg trigger fixed for INSERT on visits table' AS status;
