-- Add kode column to poli table if not exists
-- This column stores the poli code used in no_reg format

-- Add kode column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'poli' 
        AND column_name = 'kode'
    ) THEN
        ALTER TABLE poli ADD COLUMN kode TEXT;
        RAISE NOTICE 'Column kode added to poli table';
    ELSE
        RAISE NOTICE 'Column kode already exists in poli table';
    END IF;
END $$;

-- Update existing poli records with default codes based on nama
-- You should update these codes according to your actual poli codes
UPDATE poli SET kode = 'UMUM' WHERE LOWER(nama) LIKE '%umum%' AND kode IS NULL;
UPDATE poli SET kode = 'GIGI' WHERE LOWER(nama) LIKE '%gigi%' AND kode IS NULL;
UPDATE poli SET kode = 'ANAK' WHERE LOWER(nama) LIKE '%anak%' AND kode IS NULL;
UPDATE poli SET kode = 'MATA' WHERE LOWER(nama) LIKE '%mata%' AND kode IS NULL;
UPDATE poli SET kode = 'THT' WHERE LOWER(nama) LIKE '%tht%' AND kode IS NULL;
UPDATE poli SET kode = 'KULIT' WHERE LOWER(nama) LIKE '%kulit%' AND kode IS NULL;
UPDATE poli SET kode = 'OBGYN' WHERE LOWER(nama) LIKE '%kandungan%' OR LOWER(nama) LIKE '%obgyn%' AND kode IS NULL;
UPDATE poli SET kode = 'BEDAH' WHERE LOWER(nama) LIKE '%bedah%' AND kode IS NULL;
UPDATE poli SET kode = 'JANTUNG' WHERE LOWER(nama) LIKE '%jantung%' AND kode IS NULL;
UPDATE poli SET kode = 'PARU' WHERE LOWER(nama) LIKE '%paru%' AND kode IS NULL;

-- Set default 'UMUM' for any remaining null kode
UPDATE poli SET kode = 'UMUM' WHERE kode IS NULL;

-- Make kode NOT NULL after setting defaults
ALTER TABLE poli ALTER COLUMN kode SET NOT NULL;

-- Add unique constraint on kode
ALTER TABLE poli ADD CONSTRAINT poli_kode_unique UNIQUE (kode);

-- Add index
CREATE INDEX IF NOT EXISTS idx_poli_kode ON poli(kode);

-- Display current poli codes
SELECT id, nama, kode FROM poli ORDER BY nama;
