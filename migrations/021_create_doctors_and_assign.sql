-- Migration: Create 19 dummy doctors and assign to poli
-- Date: 2025-12-24
-- Uses username field for authentication (not email)

-- Create doctors with realistic names and specialties
INSERT INTO users (username, password, nama, role, kuota_harian) VALUES
('dr.ahmad', 'pass', 'Dr. Ahmad Fauzi, Sp.U', 'doctor', 16),
('dr.siti', 'pass', 'Dr. Siti Nurhaliza, drg', 'doctor', 10),
('dr.budi', 'pass', 'Dr. Budi Santoso, Sp.OG', 'doctor', 10),
('dr.rina', 'pass', 'Dr. Rina Wijaya, Sp.A', 'doctor', 10),
('dr.hendra', 'pass', 'Dr. Hendra Gunawan, Sp.M', 'doctor', 10),
('dr.maya', 'pass', 'Dr. Maya Kusuma, Sp.THT', 'doctor', 10),
('dr.rudi', 'pass', 'Dr. Rudi Hartono, Sp.KK', 'doctor', 10),
('dr.dewi', 'pass', 'Dr. Dewi Lestari, Sp.PD', 'doctor', 10),
('dr.agus', 'pass', 'Dr. Agus Setiawan, Sp.B', 'doctor', 10),
('dr.fitri', 'pass', 'Dr. Fitri Handayani, Sp.KJ', 'doctor', 16),
('dr.yudi', 'pass', 'Dr. Yudi Prasetyo, S.Gz', 'doctor', 16),
('dr.lina', 'pass', 'Dr. Lina Marlina, Sp.PD-KGer', 'doctor', 10),
('dr.eko', 'pass', 'Dr. Eko Wijaya, Sp.P', 'doctor', 6),
('dr.ratna', 'pass', 'Dr. Ratna Sari, Sp.PK', 'doctor', 6),
('dr.bambang', 'pass', 'Dr. Bambang Sutrisno', 'doctor', 16),
('dr.ani', 'pass', 'Dr. Ani Yulianti, Sp.A', 'doctor', 10),
('dr.dian', 'pass', 'Dr. Dian Permata, S.Gz', 'doctor', 16),
('dr.fajar', 'pass', 'Dr. Fajar Nugroho', 'doctor', 16),
('dr.indah', 'pass', 'Dr. Indah Puspita, S.Si', 'doctor', 16)
ON CONFLICT (username) DO NOTHING;

-- Clear existing doctor_poli assignments
DELETE FROM doctor_poli;

-- Assign doctors to poli (1 doctor per poli)
-- Using username to match doctors since we just created them

-- POLI UMUM - Dr. Ahmad Fauzi
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.ahmad' AND p.nama = 'POLI UMUM';

-- POLI GIGI - Dr. Siti Nurhaliza
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.siti' AND p.nama = 'POLI GIGI';

-- POLI KIA/KB - Dr. Budi Santoso
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.budi' AND p.nama = 'POLI KIA/KB';

-- POLI ANAK - Dr. Rina Wijaya
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.rina' AND p.nama = 'POLI ANAK';

-- POLI MATA - Dr. Hendra Gunawan
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.hendra' AND p.nama = 'POLI MATA';

-- POLI THT - Dr. Maya Kusuma
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.maya' AND p.nama = 'POLI THT';

-- POLI KULIT & KELAMIN - Dr. Rudi Hartono
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.rudi' AND p.nama = 'POLI KULIT & KELAMIN';

-- POLI PENYAKIT DALAM - Dr. Dewi Lestari
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.dewi' AND p.nama = 'POLI PENYAKIT DALAM';

-- POLI BEDAH - Dr. Agus Setiawan
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.agus' AND p.nama = 'POLI BEDAH';

-- POLI JIWA - Dr. Fitri Handayani
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.fitri' AND p.nama = 'POLI JIWA';

-- POLI GIZI - Dr. Yudi Prasetyo
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.yudi' AND p.nama = 'POLI GIZI';

-- POLI LANSIA - Dr. Lina Marlina
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.lina' AND p.nama = 'POLI LANSIA';

-- POLI TB DOTS - Dr. Eko Wijaya
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.eko' AND p.nama = 'POLI TB DOTS';

-- POLI VCT - Dr. Ratna Sari
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.ratna' AND p.nama = 'POLI VCT';

-- POLI SANITASI - Dr. Bambang Sutrisno
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.bambang' AND p.nama = 'POLI SANITASI';

-- POLI MTBS - Dr. Ani Yulianti
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.ani' AND p.nama = 'POLI MTBS';

-- POLI KONSELING GIZI - Dr. Dian Permata
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.dian' AND p.nama = 'POLI KONSELING GIZI';

-- POLI IMUNISASI - Dr. Fajar Nugroho
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.fajar' AND p.nama = 'POLI IMUNISASI';

-- POLI LABORATORIUM - Dr. Indah Puspita
INSERT INTO doctor_poli (dokter_id, poli_id)
SELECT u.id, p.id
FROM users u, poli p
WHERE u.username = 'dr.indah' AND p.nama = 'POLI LABORATORIUM';

-- Update poli quotas based on assigned doctors
UPDATE poli p
SET kuota_harian = (
    SELECT COALESCE(SUM(u.kuota_harian), 0)
    FROM doctor_poli dp
    JOIN users u ON dp.dokter_id = u.id
    WHERE dp.poli_id = p.id
);

-- Verification queries
SELECT 
    p.nama as poli_name,
    u.nama as doctor_name,
    u.kuota_harian as doctor_quota,
    p.kuota_harian as poli_quota
FROM doctor_poli dp
JOIN poli p ON dp.poli_id = p.id
JOIN users u ON dp.dokter_id = u.id
ORDER BY p.nama;

-- Summary
SELECT 
    COUNT(DISTINCT dp.poli_id) as poli_with_doctors,
    COUNT(DISTINCT dp.dokter_id) as doctors_assigned,
    COUNT(*) as total_assignments,
    (SELECT COUNT(*) FROM poli) as total_poli,
    (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors
FROM doctor_poli dp;
