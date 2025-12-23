-- Add unique constraint to NIK field in patients table
-- NIK (Nomor Induk Kependudukan) should be unique for each patient

-- First, check and remove any duplicate NIKs if they exist
-- Keep the oldest record (earliest created_at) for each NIK
WITH duplicates AS (
  SELECT id, nik, 
    ROW_NUMBER() OVER (PARTITION BY nik ORDER BY created_at ASC) as rn
  FROM patients
  WHERE nik IS NOT NULL AND nik != ''
)
DELETE FROM patients
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now add the unique constraint
ALTER TABLE patients
ADD CONSTRAINT patients_nik_unique UNIQUE (nik);

-- Add index for better performance on NIK searches
CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik);

-- Add index for NRM searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_patients_nrm_lower ON patients(LOWER(nrm));

-- Add index for name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_patients_nama_lower ON patients(LOWER(nama));
