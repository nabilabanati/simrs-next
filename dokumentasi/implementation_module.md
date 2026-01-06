# Implementasi Modul Antrian dan Pendaftaran Pasien

## 1. Arsitektur Sistem

Modul antrian dan pendaftaran pasien diimplementasikan menggunakan arsitektur **full-stack web application** dengan pemisahan yang jelas antara frontend, backend, dan database.

### 1.1 Technology Stack
- **Frontend**: Next.js 14 (React 18) dengan TypeScript
- **Styling**: TailwindCSS dan Shadcn UI Components
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication dengan localStorage
- **Real-time Updates**: Polling mechanism (5 detik interval)
- **Text-to-Speech**: Web Speech API

### 1.2 Struktur Database
Database menggunakan **9 tabel utama** yang saling berelasi:
- `queue_tickets` - Manajemen antrian
- `visits` - Registrasi kunjungan
- `patients` - Data pasien
- `poli` - Master poliklinik
- `doctors` - Master dokter
- `penjamin` - Metode pembayaran
- `patient_penjamin` - Relasi pasien-penjamin
- `users` - Pengguna sistem
- `user_loket_assignment` - Assignment user ke loket

---

## 2. Implementasi Fitur Utama

### 2.1 Fitur Manajemen Antrian

#### a. Generate Nomor Antrian
**Implementasi:**
```typescript
// API: /api/queue/generate
// Method: POST
// Function: get_next_queue_number()

INSERT INTO queue_tickets (queue_number, loket_id, status)
VALUES (
  get_next_queue_number(),  // Auto-increment per hari
  get_least_busy_loket(),   // Load balancing
  'waiting'
);
```

**Fitur:**
- Nomor antrian sequential (001, 002, 003, ...)
- Auto-reset setiap jam 00:00
- Load balancing otomatis ke loket dengan antrian paling sedikit
- Cetak tiket antrian (opsional)

#### b. Panggil Antrian
**Implementasi:**
```typescript
// API: /api/counter/call-next
// Method: POST
// Component: LoketInterface.tsx

1. Query antrian tertua dengan status 'waiting'
2. Update status menjadi 'called'
3. Simpan timestamp called_at
4. Broadcast ke display publik
5. Trigger Text-to-Speech announcement
```

**Fitur:**
- FIFO (First In First Out) queue ordering
- Pengumuman suara dalam Bahasa Indonesia
- Update real-time ke display publik
- Tombol ulangi panggilan
- Auto-mark previous ticket sebagai 'no_show'

#### c. Monitor Antrian
**Implementasi:**
```typescript
// Auto-refresh setiap 5 detik
useEffect(() => {
  fetchQueue();
  const interval = setInterval(fetchQueue, 5000);
  return () => clearInterval(interval);
}, [loketId]);
```

**Fitur:**
- Tampilan nomor antrian aktif
- Jumlah antrian menunggu
- Preview 5 antrian selanjutnya
- Statistik real-time per loket

---

### 2.2 Fitur Manajemen Pasien

#### a. Pencarian Pasien
**Implementasi:**
```typescript
// Component: PatientSearchModal.tsx
// Search by: NRM, Nama, NIK

SELECT p.*, pp.penjamin_id, pj.nama as penjamin_nama
FROM patients p
LEFT JOIN patient_penjamin pp ON p.id = pp.patient_id
LEFT JOIN penjamin pj ON pp.penjamin_id = pj.id
WHERE p.nrm ILIKE '%search%' 
   OR p.nama ILIKE '%search%' 
   OR p.nik ILIKE '%search%';
```

**Fitur:**
- Pencarian multi-kriteria (NRM/Nama/NIK)
- Case-insensitive search
- Partial match support
- Tampilan data penjamin default

#### b. Pendaftaran Pasien Baru
**Implementasi:**
```typescript
// Page: /counter/patients/create
// Form dengan validasi lengkap

1. Input data personal (Nama, NIK, TTL, JK)
2. Input data penanggung jawab
3. Input alamat (Provinsi, Kota, Kecamatan, Kelurahan)
4. Pilih penjamin default
5. Generate NRM otomatis (YYYYMMDD-XXXX)
6. Simpan ke database
```

**Fitur:**
- Form multi-section (Personal, PJ, Alamat, Penjamin)
- Auto-generate NRM dengan format YYYYMMDD-XXXX
- Validasi NIK 16 digit
- Dropdown wilayah (Provinsi → Kota → Kecamatan → Kelurahan)
- Redirect otomatis kembali ke loket setelah simpan

---

### 2.3 Fitur Registrasi Kunjungan

#### a. Buat Registrasi
**Implementasi:**
```typescript
// API: /api/counter/register-patient
// Method: POST
// Component: AddVisitModal.tsx

1. Verify queue_ticket status = 'called'
2. Check poli quota (RPC: check_poli_quota)
3. Check doctor quota (RPC: check_doctor_quota)
4. INSERT new visit record
5. UPDATE queue_ticket status = 'completed'
6. Generate no_reg via trigger
```

**Fitur:**
- Modal form dengan data pasien pre-filled
- Dropdown poli dengan kuota real-time
- Dropdown dokter terfilter per poli
- Auto-fill penjamin dari data pasien
- Auto-calculate "Kunjungan Ke-N"
- Validasi kuota sebelum simpan
- Generate nomor registrasi (REG-YYYYMMDD-XXXX)

#### b. Validasi Kuota
**Implementasi:**
```sql
-- Database Function
CREATE FUNCTION check_poli_quota(p_poli_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COUNT(*) < (SELECT kuota_harian FROM poli WHERE id = p_poli_id)
  FROM visits
  WHERE poli_id = p_poli_id
    AND DATE(created_at) = CURRENT_DATE;
$$;
```

**Fitur:**
- Validasi kuota poli per hari
- Validasi kuota dokter per hari
- Tolak registrasi jika kuota penuh
- Update kuota real-time setelah registrasi

---

### 2.4 Fitur Pelaporan & Monitoring

#### a. Filter dan Pencarian
**Implementasi:**
```typescript
// Component: LoketInterface.tsx
// Multiple filter support

const params = new URLSearchParams({
  date_from: dateFrom,
  date_to: dateTo,
  poli_id: filterPoli,
  dokter_id: filterDokter,
  penjamin_id: filterPenjamin,
  search: searchInput
});
```

**Fitur:**
- Filter tanggal (dari-sampai)
- Filter poli, dokter, penjamin
- Search NRM/Nama/NIK
- Tab "Hari Ini" dan "Semua"
- Reset filter

#### b. Dashboard Statistik
**Implementasi:**
```typescript
// Real-time statistics
- Total pasien terdaftar
- Total pasien selesai
- Total antrian menunggu
- Breakdown per loket (admin only)
```

**Fitur:**
- Card statistik dengan icon
- Auto-refresh setiap 5 detik
- Visualisasi per status
- Dashboard admin untuk semua loket

#### c. Export Data
**Implementasi:**
```typescript
// Export to Excel (.xls)
const exportToExcel = () => {
  // Generate HTML table
  // Convert to Excel format
  // Auto-download file
};
```

**Fitur:**
- Export sesuai filter aktif
- Format .xls (Excel)
- Include headers
- Auto-download

---

## 3. Integrasi Antrian dan Registrasi

### 3.1 Alur Integrasi
```
1. Pasien ambil antrian
   ↓ INSERT queue_tickets
   
2. Loket panggil antrian
   ↓ UPDATE queue_tickets (status: called)
   
3. Petugas cari/daftar pasien
   ↓ SELECT/INSERT patients
   
4. Petugas registrasi kunjungan
   ↓ INSERT visits + UPDATE queue_tickets (status: completed)
```

### 3.2 Relasi Data
- **queue_tickets.id** → **visits.queue_ticket_id** (Foreign Key)
- Relasi: 1 antrian → 0 atau 1 kunjungan
- Jika pasien tidak jadi daftar: ticket status = 'no_show', tidak ada visit
- Jika pasien selesai daftar: ticket status = 'completed', ada visit

---

## 4. Autentikasi dan Autorisasi

### 4.1 Role-Based Access Control (RBAC)
**Implementasi:**
```typescript
// Client-side auth check
const user = JSON.parse(localStorage.getItem('user'));

if (user.role === 'loket') {
  // Check assignment
  const assignments = await supabase
    .from('user_loket_assignment')
    .select('loket_id')
    .eq('user_id', user.id);
    
  if (!assignments.includes(loketId)) {
    router.push('/unauthorized');
  }
}
```

**Role:**
- `loket` - Akses hanya ke loket yang di-assign
- `admin_loket` - Akses ke semua loket + dashboard admin

### 4.2 Assignment Loket
**Implementasi:**
- Tabel `user_loket_assignment` menyimpan mapping user → loket
- Satu user bisa di-assign ke multiple loket
- Validasi dilakukan di client dan server

---

## 5. User Interface

### 5.1 Design System
- **Primary Color**: Blue (#2563eb)
- **Components**: Shadcn UI (Card, Table, Button, Modal)
- **Layout**: Responsive desktop (minimum 1366x768)
- **Typography**: System default, readable
- **Feedback**: Toast notifications (Sonner)

### 5.2 Key Pages
1. **`/counter/loket-[1-5]`** - Interface loket individual
   - Header dengan jam real-time
   - Display nomor antrian besar
   - Tombol panggil dan ulangi
   - Filter dan tabel data pasien
   - Statistik loket

2. **`/admin/loket`** - Dashboard admin semua loket
   - Statistik total dan per loket
   - Filter lanjutan
   - Tabel data semua loket
   - Export Excel

3. **`/counter/patients/create`** - Form pasien baru
   - Multi-section form
   - Dropdown wilayah cascade
   - Auto-generate NRM

---

## 6. Optimasi dan Performance

### 6.1 Database Optimization
- **Indexes** untuk query antrian dan kuota
- **Database Functions** untuk logic kompleks
- **Triggers** untuk auto-generate nomor
- **Constraints** untuk data integrity

### 6.2 Frontend Optimization
- **Auto-refresh** dengan interval 5 detik
- **Polling** untuk real-time updates
- **Client-side filtering** untuk search
- **Lazy loading** untuk data besar

---

## 7. Kesimpulan

Implementasi modul antrian dan pendaftaran pasien menggunakan arsitektur modern dengan pemisahan concern yang jelas antara antrian (`queue_tickets`) dan registrasi (`visits`). Sistem ini mendukung:

✅ Manajemen antrian real-time dengan load balancing  
✅ Pendaftaran pasien baru dan pencarian pasien lama  
✅ Registrasi kunjungan dengan validasi kuota  
✅ Monitoring dan pelaporan komprehensif  
✅ Role-based access control untuk keamanan  
✅ User interface yang intuitif dan responsif  

Implementasi ini memastikan proses pendaftaran pasien berjalan efisien, terstruktur, dan dapat diandalkan.
