-- Multiple Time Slots Support
-- Migration: Allow multiple schedules per day with break times

-- Drop the unique constraint that prevents multiple schedules per day
ALTER TABLE doctor_schedules 
DROP CONSTRAINT IF EXISTS unique_doctor_day;

-- Add session name/label for clarity
ALTER TABLE doctor_schedules 
ADD COLUMN IF NOT EXISTS session_name VARCHAR(50);

-- Add function to check for overlapping time slots
CREATE OR REPLACE FUNCTION check_schedule_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's an overlapping schedule for the same doctor on the same day
    IF EXISTS (
        SELECT 1 
        FROM doctor_schedules 
        WHERE dokter_id = NEW.dokter_id 
        AND hari = NEW.hari 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND is_active = true
        AND (
            -- New schedule starts during existing schedule
            (NEW.jam_mulai >= jam_mulai AND NEW.jam_mulai < jam_selesai)
            OR
            -- New schedule ends during existing schedule
            (NEW.jam_selesai > jam_mulai AND NEW.jam_selesai <= jam_selesai)
            OR
            -- New schedule completely contains existing schedule
            (NEW.jam_mulai <= jam_mulai AND NEW.jam_selesai >= jam_selesai)
        )
    ) THEN
        RAISE EXCEPTION 'Schedule overlaps with existing schedule for this day';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent overlapping schedules
DROP TRIGGER IF EXISTS prevent_schedule_overlap ON doctor_schedules;
CREATE TRIGGER prevent_schedule_overlap
    BEFORE INSERT OR UPDATE ON doctor_schedules
    FOR EACH ROW
    EXECUTE FUNCTION check_schedule_overlap();

-- Comments
COMMENT ON COLUMN doctor_schedules.session_name IS 'Optional label for the session (e.g., "Sesi Pagi", "Sesi Siang")';
COMMENT ON FUNCTION check_schedule_overlap() IS 'Prevents overlapping time slots for the same doctor on the same day';

-- Example: Doctor with morning and afternoon sessions
-- INSERT INTO doctor_schedules (dokter_id, hari, jam_mulai, jam_selesai, session_name, max_patients_per_day)
-- VALUES 
--   ('doctor-uuid', 'senin', '08:00', '12:00', 'Sesi Pagi', 10),
--   ('doctor-uuid', 'senin', '13:00', '17:00', 'Sesi Siang', 10);
