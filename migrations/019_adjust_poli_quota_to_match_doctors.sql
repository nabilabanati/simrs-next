-- Migration 019: Adjust Poli Quotas to Match Total Doctor Capacity
-- Fix: Poli quota should equal sum of all doctors assigned to that poli
-- Example: Poli Gigi with 3 doctors @ 10 quota each = 30 total poli quota

-- ============================================
-- Calculate and update poli quota based on assigned doctors
-- ============================================

-- Update each poli's quota to be the sum of its doctors' quotas
UPDATE poli p
SET kuota_harian = (
  SELECT SUM(d.kuota_harian)
  FROM doctors d
  JOIN doctor_poli dp ON dp.dokter_id = d.id
  WHERE dp.poli_id = p.id
    AND d.kuota_harian IS NOT NULL
)
WHERE EXISTS (
  SELECT 1
  FROM doctor_poli dp
  WHERE dp.poli_id = p.id
);

-- ============================================
-- Display results
-- ============================================

-- Show poli quota vs total doctor capacity
SELECT 
  p.nama as poli_name,
  p.kuota_harian as poli_quota,
  COUNT(DISTINCT dp.dokter_id) as num_doctors,
  COALESCE(SUM(d.kuota_harian), 0) as total_doctor_capacity,
  CASE 
    WHEN p.kuota_harian = COALESCE(SUM(d.kuota_harian), 0) THEN '✓ Match'
    WHEN p.kuota_harian < COALESCE(SUM(d.kuota_harian), 0) THEN '⚠ Poli quota too low'
    WHEN p.kuota_harian > COALESCE(SUM(d.kuota_harian), 0) THEN '⚠ Poli quota too high'
    ELSE '✗ No doctors assigned'
  END as status
FROM poli p
LEFT JOIN doctor_poli dp ON dp.poli_id = p.id
LEFT JOIN doctors d ON d.id = dp.dokter_id
GROUP BY p.id, p.nama, p.kuota_harian
ORDER BY p.nama;

-- Summary
SELECT 
  'Total Poli Capacity (After Fix)' as metric,
  SUM(kuota_harian) as value
FROM poli
WHERE kuota_harian IS NOT NULL;

-- Success message
SELECT 'Migration 019 completed: Poli quotas adjusted to match total doctor capacity' AS status;
