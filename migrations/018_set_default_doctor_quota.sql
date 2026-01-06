-- Migration 018: Set default quota for doctors based on their primary poli
-- Since doctors can work in multiple poli (via doctor_poli junction table),
-- we set doctor quota based on their first assigned poli

-- ============================================
-- Set doctor quota based on their primary poli
-- ============================================

-- Doctors in Poli Cepat (10-15 min) → 16 pasien/hari
UPDATE doctors d
SET kuota_harian = 16
WHERE d.id IN (
  SELECT DISTINCT dp.dokter_id
  FROM doctor_poli dp
  JOIN poli p ON p.id = dp.poli_id
  WHERE p.kuota_harian = 32
);

-- Doctors in Poli Sedang (15-20 min) → 14 pasien/hari
UPDATE doctors d
SET kuota_harian = 14
WHERE d.id IN (
  SELECT DISTINCT dp.dokter_id
  FROM doctor_poli dp
  JOIN poli p ON p.id = dp.poli_id
  WHERE p.kuota_harian = 28
)
AND d.kuota_harian IS NULL; -- Only if not already set

-- Doctors in Poli Lama (20-30 min) → 10 pasien/hari
UPDATE doctors d
SET kuota_harian = 10
WHERE d.id IN (
  SELECT DISTINCT dp.dokter_id
  FROM doctor_poli dp
  JOIN poli p ON p.id = dp.poli_id
  WHERE p.kuota_harian = 10
)
AND d.kuota_harian IS NULL;

-- Doctors in Poli Saraf (15-25 min) → 12 pasien/hari
UPDATE doctors d
SET kuota_harian = 12
WHERE d.id IN (
  SELECT DISTINCT dp.dokter_id
  FROM doctor_poli dp
  JOIN poli p ON p.id = dp.poli_id
  WHERE p.kuota_harian = 12
)
AND d.kuota_harian IS NULL;

-- Doctors in Poli VCT (30-45 min) → 6 pasien/hari
UPDATE doctors d
SET kuota_harian = 6
WHERE d.id IN (
  SELECT DISTINCT dp.dokter_id
  FROM doctor_poli dp
  JOIN poli p ON p.id = dp.poli_id
  WHERE p.kuota_harian = 6
)
AND d.kuota_harian IS NULL;

-- ============================================
-- Display results
-- ============================================
SELECT 
  u.nama as doctor_name,
  d.kuota_harian as daily_quota,
  STRING_AGG(p.nama, ', ') as assigned_poli
FROM doctors d
JOIN users u ON u.id = d.user_id
LEFT JOIN doctor_poli dp ON dp.dokter_id = d.id
LEFT JOIN poli p ON p.id = dp.poli_id
GROUP BY d.id, u.nama, d.kuota_harian
ORDER BY d.kuota_harian DESC NULLS LAST, u.nama;

-- Summary
SELECT 
  'Doctors with Quota Set' as metric,
  COUNT(*) as value
FROM doctors
WHERE kuota_harian IS NOT NULL;

SELECT 
  'Doctors without Quota' as metric,
  COUNT(*) as value
FROM doctors
WHERE kuota_harian IS NULL;

-- Success message
SELECT 'Migration 018 completed: Doctor quotas set based on their assigned poli' AS status;
