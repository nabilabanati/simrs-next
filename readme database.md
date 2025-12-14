#### Database: Supabase
Struktur Supabase:
1. Users - Untuk nyimpen akun
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE,
  password text,
  nama text NOT NULL,
  role text NOT NULL CHECK (role IN ('superadmin', 'admin', 'dokter', 'nurse', 'loket', 'farmasi', 'kasir')),created_at timestamptz DEFAULT now()
);
```

2. doctors - untuk list dokter yang ada di rs
```sql
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  spesialis text,
  sip text,
  created_at timestamptz DEFAULT now()
);
```

3. poli - master data poli di RS
```sql
CREATE TABLE IF NOT EXISTS public.poli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  kode varchar(10),
  harga_daftar numeric,
  created_at timestamptz DEFAULT now()
);
```

4. doctor_poli - relasi n:n, untuk poli menyimpan dokter siapa aja yg ada di poli tersebut. 
```sql
CREATE TABLE IF NOT EXISTS public.doctor_poli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dokter_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  poli_id uuid REFERENCES public.poli(id) ON DELETE CASCADE
);
```

5. patiens - list pasien yang terdaftar di rs
```sql
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nrm varchar(20) UNIQUE,
  nik varchar(20),
  nama text NOT NULL,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin text,
  pekerjaan text,
  golongan_darah text,

  penanggung_jawab text,
  nama_pj text,
  pekerjaan_pj text,
  no_telp_pj text,

  province_id varchar,
  regency_id varchar,
  district_id varchar,
  village_id varchar,

  alamat text, 
  kode_pos text,

  catatan_khusus text,
  created_at timestamptz DEFAULT now()
);

```
**trigger nrm**
```sql
-- no_reg generator for visits: YYYYMMDD-0001
CREATE OR REPLACE FUNCTION generate_no_reg()
RETURNS trigger AS $$
DECLARE
  today TEXT := to_char(NOW(), 'YYYYMMDD');
  last_reg TEXT;
  last_number INT;
BEGIN
  SELECT no_reg INTO last_reg
  FROM visits
  WHERE no_reg LIKE today || '%'
  ORDER BY no_reg DESC
  LIMIT 1;

  IF last_reg IS NULL THEN
    last_number := 1;
  ELSE
    last_number := (RIGHT(last_reg, 4))::INT + 1;
  END IF;

  NEW.no_reg := today || '-' || LPAD(last_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS before_insert_no_reg ON visits;
CREATE TRIGGER before_insert_no_reg
BEFORE INSERT ON visits
FOR EACH ROW
WHEN (NEW.no_reg IS NULL)
EXECUTE FUNCTION generate_no_reg();
```

6. penjamin - list jenis penjamin yang terdaftar ke rs
```sql
CREATE TABLE IF NOT EXISTS public.penjamin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text UNIQUE NOT NULL,
  tipe text, -- bpjs / umum / swasta / perusahaan
  created_at timestamptz DEFAULT now()
);
```

7. patient_penjamin - penjamin per-pasien
```sql
CREATE TABLE IF NOT EXISTS public.patient_penjamin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  penjamin_id uuid REFERENCES public.penjamin(id) ON DELETE SET NULL,
  nomor_bpjs text,
  nama_asuransi text,
  nomor_polis text,
  created_at timestamptz DEFAULT now()
);
```

8. visits - data kunjungan pasien, mengambil data status ttv juga. klo di dokter dia cuma nampilini yg ke dokter itu. klo di perawat selagi itu adalah poli yg tempati semua data visit muncul.
```sql
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  poli_id uuid REFERENCES public.poli(id) ON DELETE SET NULL,
  dokter_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  no_reg text UNIQUE,
  status text DEFAULT 'menunggu', -- menunggu, dipanggil, sedang_diperiksa, selesai
  ttv_status text DEFAULT 'belum', -- belum, sedang_dikerjakan, selesai
  ttv_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

9. visit_history - menyimpan semua history status visit
```sql
CREATE TABLE IF NOT EXISTS public.visit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  changed_by uuid, -- users.id
  note text,
  created_at timestamptz DEFAULT now()
);
```
**trigger visit history**
```sql
-- visit_history: log perubahan status (insert on update)
CREATE OR REPLACE FUNCTION log_visit_status_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO visit_history (visit_id, old_status, new_status, changed_by, note, created_at)
    VALUES (OLD.id, OLD.status, NEW.status, current_setting('app.user_id', true)::uuid, NULL, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_update_visit_history ON visits;
CREATE TRIGGER after_update_visit_history
AFTER UPDATE ON visits
FOR EACH ROW
EXECUTE FUNCTION log_visit_status_change();
```

10. medical_records - catatan rekam medis oleh dokter, relasi ke triase dan visit juga. dokter yg bisa input
```sql
CREATE TABLE IF NOT EXISTS public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid UNIQUE REFERENCES public.visits(id) ON DELETE CASCADE,
  anamnesis text,
  pemeriksaan_fisik text,
  assessment text,
  plan text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

11. prescriptions - resep obat, relasi ke tabel visits. dokter yg bisa input
```sql
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES public.visits(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  no_order text UNIQUE,
  status text DEFAULT 'pending', -- pending, ready, dispensed
  created_at timestamptz DEFAULT now()
);
```

12. prescription_items - detail obat per resep. 
```sql
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE SET NULL,
  nama_obat text,
  qty integer,
  satuan text,
  instruksi text
);
```

13. medicines - master obat
```sql
CREATE TABLE IF NOT EXISTS public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text,
  nama text,
  harga numeric,
  created_at timestamptz DEFAULT now()
);
```

14. medicine_stock - stok obat
```sql
CREATE TABLE IF NOT EXISTS public.medicine_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE,
  lokasi text,
  qty integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
```

15. triase - ttv, yg isi adalah orang yg role nya nurse, dokter hanya melihat hasil ttv nya. semua nurse di poli tersebut bisa isi ttv pasien, tapi biar ga bentrok nanti saat 1 nurse, webnya itu emang langsung auto refres, dan status di kolom status itu berubah jadi sedang dikerjakan. yg mana dia otomatis jadi dibawah sendiri gitu. biar nurse lain itu nanti tinggal klik yg paling atas. kemudian data pasien yg masuk itu semua yg masuk ke poli tersebut.
```sql
CREATE TABLE IF NOT EXISTS public.triase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid UNIQUE REFERENCES public.visits(id) ON DELETE CASCADE,
  perawat_id uuid REFERENCES public.nurses(id) ON DELETE SET NULL,
  tensi text,
  nadi integer,
  suhu numeric,
  spo2 integer,
  resp integer,
  catatan text,
  created_at timestamptz DEFAULT now()
);
```

16. nurses - data untuk menyimpan perawat yang ada di rs
```sql
CREATE TABLE IF NOT EXISTS public.nurses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
```

17. nurse_poli - untuk menyimpan seorang perawat itu ada di poli mana, kemudian juga melihat di poli itu perawatnya ada siapa aja,
```sql
CREATE TABLE IF NOT EXISTS public.nurse_poli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nurse_id uuid REFERENCES public.nurses(id) ON DELETE CASCADE,
  poli_id uuid REFERENCES public.poli(id) ON DELETE CASCADE
);
```

18. pharmacy_orders - data resep yg dikirim ke farmasi
```sql
CREATE TABLE IF NOT EXISTS public.pharmacy_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  no_order text UNIQUE,
  status text DEFAULT 'waiting', -- waiting, packing, done
  created_at timestamptz DEFAULT now()
);
```

19. invoices - untuk payment
```sql
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL,
  total numeric DEFAULT 0,
  paid boolean DEFAULT false,
  paid_at timestamptz
);
```

20. Antrian Loket
```sql
CREATE TABLE IF NOT EXISTS public.queue_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loket_nama text UNIQUE, -- Misal 'LOKET-1', 'LOKET-2'
  current_queue integer DEFAULT 0, -- Nomor yg sedang dipanggil
  updated_at timestamptz DEFAULT now()
);
-- Initial Data
INSERT INTO public.queue_counters (loket_nama) VALUES ('LOKET-1');
```

##### trigger tambahan:
1. biar nurse ga bentrok
```sql
CREATE OR REPLACE FUNCTION pick_patient_for_ttv(visit_id_input uuid, nurse_id_input uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  updated_row visits%ROWTYPE;
BEGIN
  -- Coba update HANYA JIKA status masih 'belum'
  UPDATE public.visits
  SET 
    ttv_status = 'sedang_dikerjakan',
    updated_at = now()
    -- Kita bisa simpan siapa yg mengerjakan di tabel triase nanti via trigger/logic frontend
  WHERE id = visit_id_input AND ttv_status = 'belum'
  RETURNING * INTO updated_row;

  IF updated_row.id IS NOT NULL THEN
    -- Jika berhasil di-lock
    RETURN json_build_object('success', true, 'message', 'Pasien berhasil diambil.');
  ELSE
    -- Jika gagal (berarti sudah diambil nurse lain sedetik sebelumnya)
    RETURN json_build_object('success', false, 'message', 'Maaf, pasien sedang dikerjakan perawat lain.');
  END IF;
END;
$$;
```
2. kurangi stok obat farmasi:
```sql
CREATE OR REPLACE FUNCTION decrease_medicine_stock()
RETURNS trigger AS $$
BEGIN
  -- Jika status resep berubah jadi 'dispensed' (sudah diambil/siap)
  IF NEW.status = 'dispensed' AND OLD.status != 'dispensed' THEN
    
    -- Loop item di resep tersebut dan kurangi stok
    UPDATE public.medicine_stock ms
    SET qty = ms.qty - pi.qty
    FROM public.prescription_items pi
    WHERE pi.prescription_id = NEW.id 
    AND ms.medicine_id = pi.medicine_id;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_prescription_dispensed
AFTER UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION decrease_medicine_stock();
```
3. auto invoice 
```sql
CREATE OR REPLACE FUNCTION generate_invoice_on_finish()
RETURNS trigger AS $$
DECLARE
  biaya_poli numeric;
  biaya_obat numeric;
BEGIN
  -- Trigger jalan jika status visit berubah jadi 'selesai' (atau status khusus 'kasir_pending')
  IF NEW.status = 'selesai' AND OLD.status != 'selesai' THEN
    
    -- 1. Ambil harga poli
    SELECT harga_daftar INTO biaya_poli FROM public.poli WHERE id = NEW.poli_id;

    -- 2. Hitung total obat dari resep terkait visit ini
    SELECT COALESCE(SUM(m.harga * pi.qty), 0) INTO biaya_obat
    FROM public.prescriptions p
    JOIN public.prescription_items pi ON pi.prescription_id = p.id
    JOIN public.medicines m ON m.id = pi.medicine_id
    WHERE p.visit_id = NEW.id;

    -- 3. Insert ke Invoices
    INSERT INTO public.invoices (visit_id, total, paid)
    VALUES (NEW.id, (biaya_poli + biaya_obat), false);
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_visit_finished
AFTER UPDATE ON public.visits
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_on_finish();
```