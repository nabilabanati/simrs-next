-- Add no_registrasi column to visits table
ALTER TABLE visits 
ADD COLUMN no_registrasi TEXT;

-- Add index for faster queries
CREATE INDEX idx_visits_no_registrasi ON visits(no_registrasi);

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'visits' AND column_name = 'no_registrasi';
