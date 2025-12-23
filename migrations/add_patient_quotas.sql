-- Patient Quota System
-- Migration: Add quota limits to poli and doctor_schedules

-- Add quota column to poli table
ALTER TABLE poli 
ADD COLUMN IF NOT EXISTS max_patients_per_day INTEGER DEFAULT NULL;

-- Add quota column to doctor_schedules table
ALTER TABLE doctor_schedules 
ADD COLUMN IF NOT EXISTS max_patients_per_day INTEGER DEFAULT NULL;

-- Comments
COMMENT ON COLUMN poli.max_patients_per_day IS 'Maximum number of patients that can be registered to this poli per day. NULL means unlimited.';
COMMENT ON COLUMN doctor_schedules.max_patients_per_day IS 'Maximum number of patients that can be registered to this doctor per day. NULL means unlimited.';

-- Example: Set default quotas for common polis
-- You can adjust these values as needed
UPDATE poli SET max_patients_per_day = 30 WHERE nama ILIKE '%gigi%';
UPDATE poli SET max_patients_per_day = 50 WHERE nama ILIKE '%penyakit dalam%';
UPDATE poli SET max_patients_per_day = 40 WHERE nama ILIKE '%umum%';

-- Note: Doctor-specific quotas should be set individually via the schedule management UI
-- or can be set here if you know the doctor IDs
