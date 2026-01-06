-- SQL untuk menambahkan data penjamin (cara bayar)
-- Jalankan di Supabase SQL Editor jika data belum ada

-- Cek data yang sudah ada
SELECT * FROM penjamin;

-- Insert data penjamin jika belum ada
INSERT INTO penjamin (nama, tipe) VALUES
  ('BPJS', 'asuransi'),
  ('Umum', 'umum'),
  ('Asuransi', 'asuransi')
ON CONFLICT (nama) DO NOTHING;

-- Verifikasi data
SELECT * FROM penjamin WHERE nama IN ('BPJS', 'Umum', 'Asuransi');
