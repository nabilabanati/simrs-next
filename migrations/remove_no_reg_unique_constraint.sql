-- Remove unique constraint from no_reg column if it exists
-- This allows multiple visits to have the same registration number pattern

-- Check if constraint exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'visits_no_reg_key'
    ) THEN
        ALTER TABLE visits DROP CONSTRAINT visits_no_reg_key;
        RAISE NOTICE 'Constraint visits_no_reg_key dropped successfully';
    ELSE
        RAISE NOTICE 'Constraint visits_no_reg_key does not exist';
    END IF;
END $$;

-- Verify the constraint is removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'visits'::regclass 
AND conname LIKE '%no_reg%';
