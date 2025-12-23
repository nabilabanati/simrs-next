-- Doctor Schedule Management System
-- Migration: Add doctor_schedules and doctor_schedule_overrides tables

-- Table 1: Regular weekly schedules
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dokter_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hari VARCHAR(10) NOT NULL CHECK (hari IN ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu')),
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (jam_selesai > jam_mulai),
  CONSTRAINT unique_doctor_day UNIQUE (dokter_id, hari)
);

-- Table 2: Schedule overrides for specific dates (emergency cases)
CREATE TABLE IF NOT EXISTS doctor_schedule_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dokter_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  jam_mulai TIME,
  jam_selesai TIME,
  is_cancelled BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT override_valid_time_range CHECK (
    is_cancelled = true OR (jam_selesai > jam_mulai)
  ),
  CONSTRAINT unique_doctor_date UNIQUE (dokter_id, tanggal)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_dokter_id ON doctor_schedules(dokter_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_hari ON doctor_schedules(hari);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_active ON doctor_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_doctor_schedule_overrides_dokter_id ON doctor_schedule_overrides(dokter_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedule_overrides_tanggal ON doctor_schedule_overrides(tanggal);

-- Comments
COMMENT ON TABLE doctor_schedules IS 'Regular weekly practice schedules for doctors';
COMMENT ON TABLE doctor_schedule_overrides IS 'Temporary schedule overrides for specific dates (emergency, leave, etc)';
COMMENT ON COLUMN doctor_schedule_overrides.is_cancelled IS 'If true, doctor is completely unavailable on this date';
COMMENT ON COLUMN doctor_schedule_overrides.reason IS 'Reason for override (e.g., "Darurat di RS lain", "Cuti")';
