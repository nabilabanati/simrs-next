-- Migration 017: Set default quota for all poli based on service duration
-- Updated configuration:
-- - Poli Cepat & Sedang: 2 doctors @ 4 hours = higher quota
-- - Poli Lama: 1 doctor @ 4 hours = lower quota
-- Formula: Quota per doctor = (240 minutes) / (Service duration per patient)
--          Quota poli = Number of doctors × Quota per doctor

-- ============================================
-- Kategori 1: Cepat (10-15 menit) → 2 dokter × 16 = 32 pasien/hari
-- ============================================
UPDATE poli SET kuota_harian = 32
WHERE UPPER(nama) IN (
  'POLI UMUM',
  'POLI ANAK', 
  'POLI KB',
  'POLI KULIT & KELAMIN',
  'POLI THT'
);

-- ============================================
-- Kategori 2: Sedang (15-20 menit) → 2 dokter × 14 = 28 pasien/hari
-- ============================================
UPDATE poli SET kuota_harian = 28
WHERE UPPER(nama) IN (
  'POLI BEDAH ORTHOPEDI',
  'POLI BEDAH UMUM',
  'POLI BEDAH UROLOGI',
  'POLI JANTUNG',
  'POLI KEBIDANAN & KANDUNGAN',
  'POLI MATA',
  'POLI PARU',
  'POLI PENYAKIT DALAM'
);

-- ============================================
-- Kategori 3: Lama (20-30 menit) → 1 dokter × 10 = 10 pasien/hari
-- ============================================
UPDATE poli SET kuota_harian = 10
WHERE UPPER(nama) IN (
  'POLI GIGI',
  'POLI GIZI',
  'POLI KESEHATAN JIWA',
  'POLI REHABILITASI MEDIK'
);

-- ============================================
-- Kategori 4: Sangat Lama (15-25 menit) → 1 dokter × 12 = 12 pasien/hari
-- ============================================
UPDATE poli SET kuota_harian = 12
WHERE UPPER(nama) = 'POLI SARAF';

-- ============================================
-- Kategori 5: Konseling Intensif (30-45 menit) → 1 dokter × 6 = 6 pasien/hari
-- ============================================
UPDATE poli SET kuota_harian = 6
WHERE UPPER(nama) = 'POLI VCT';

-- ============================================
-- NOTE: Doctor quotas should be set manually via UI
-- because doctors can work in multiple poli (many-to-many relationship)
-- ============================================

-- ============================================
-- Display results
-- ============================================
SELECT 
  nama as poli_name,
  kuota_harian as daily_quota,
  CASE 
    WHEN kuota_harian = 32 THEN '2 dokter × 16 (Cepat: 10-15 min)'
    WHEN kuota_harian = 28 THEN '2 dokter × 14 (Sedang: 15-20 min)'
    WHEN kuota_harian = 12 THEN '1 dokter × 12 (Saraf: 15-25 min)'
    WHEN kuota_harian = 10 THEN '1 dokter × 10 (Lama: 20-30 min)'
    WHEN kuota_harian = 6 THEN '1 dokter × 6 (VCT: 30-45 min)'
    ELSE 'Not Set'
  END as configuration
FROM poli
ORDER BY kuota_harian DESC, nama;

-- Summary
SELECT 
  'Total Poli Capacity' as metric,
  SUM(kuota_harian) as value
FROM poli
WHERE kuota_harian IS NOT NULL;

-- Success message
SELECT 'Migration 017 completed: Poli quotas set. Please set doctor quotas manually via UI.' AS status;
