# Identifikasi Pengguna dan Kebutuhan Sistem - SIMRS Antrian & Loket

## 1. IDENTIFIKASI PENGGUNA

### 1.1 Pasien
**Karakteristik:**
- Individu yang datang ke rumah sakit untuk mendapatkan pelayanan kesehatan
- Bisa pasien baru (belum pernah terdaftar) atau pasien lama (sudah memiliki NRM)
- Usia bervariasi dari bayi hingga lansia
- Tingkat literasi teknologi beragam

**Akses Sistem:**
- Menggunakan mesin antrian (kiosk) untuk mengambil nomor
- Melihat display publik untuk monitor antrian
- Tidak memerlukan login/autentikasi

**Frekuensi Penggunaan:**
- Setiap kali berkunjung ke rumah sakit
- Bisa harian, mingguan, atau tidak teratur

---

### 1.2 Petugas Loket
**Karakteristik:**
- Staff administrasi front-office rumah sakit
- Bertugas di loket pendaftaran (Loket 1-5)
- Memiliki pengetahuan dasar tentang prosedur pendaftaran
- Familiar dengan sistem komputer

**Akses Sistem:**
- Login dengan username dan password
- Role: `loket`
- Assigned ke loket tertentu (1-5)
- Akses penuh ke fitur loket yang ditugaskan

**Frekuensi Penggunaan:**
- Setiap hari kerja (shift pagi/siang/sore)
- Intensif selama jam operasional
- Rata-rata 50-100 transaksi per hari

**Tanggung Jawab:**
- Memanggil antrian
- Mencari/mendaftarkan pasien
- Membuat registrasi kunjungan
- Mencetak bukti registrasi

---

### 1.3 Admin Loket
**Karakteristik:**
- Supervisor atau kepala bagian pendaftaran
- Memiliki wewenang lebih tinggi dari petugas loket
- Bertanggung jawab atas operasional semua loket
- Memiliki kemampuan analisis data

**Akses Sistem:**
- Login dengan username dan password
- Role: `admin_loket`
- Akses ke semua loket (1-5)
- Akses dashboard monitoring dan reporting

**Frekuensi Penggunaan:**
- Setiap hari kerja
- Monitoring berkala (per jam/per shift)
- Review laporan harian/mingguan/bulanan

**Tanggung Jawab:**
- Monitoring kinerja semua loket
- Analisis statistik pendaftaran
- Export dan pelaporan data
- Supervisi petugas loket

---

### 1.4 Sistem (Actor Non-Human)
**Karakteristik:**
- Automated system processes
- Background jobs dan scheduled tasks
- Integration services

**Fungsi:**
- Auto-reset antrian setiap jam 00:00
- Generate nomor antrian otomatis
- Validasi data dan business rules
- Text-to-Speech announcement
- Real-time broadcast ke display

---

## 2. KEBUTUHAN PENGGUNA PER PENGGUNA

### 2.1 Kebutuhan Pasien

#### Fungsional:
1. **Mengambil Nomor Antrian**
   - Dapat mengambil nomor antrian dengan mudah
   - Menerima tiket fisik dengan nomor antrian
   - Melihat nomor antrian di layar

2. **Monitor Status Antrian**
   - Melihat nomor antrian yang sedang dipanggil
   - Melihat loket yang memanggil
   - Mengetahui estimasi waktu tunggu

3. **Mendengar Panggilan**
   - Mendengar pengumuman nomor antrian via speaker
   - Pengumuman dalam bahasa Indonesia yang jelas
   - Dapat mendengar dari area tunggu

#### Non-Fungsional:
- **Kemudahan**: Interface sederhana, tidak perlu instruksi
- **Kecepatan**: Proses ambil antrian < 5 detik
- **Aksesibilitas**: Layar besar, font besar, suara jelas
- **Keandalan**: Sistem tersedia 24/7

---

### 2.2 Kebutuhan Petugas Loket

#### Fungsional:

**A. Manajemen Antrian**
1. **Memanggil Antrian**
   - Memanggil antrian berikutnya dengan 1 klik
   - Melihat nomor antrian yang sedang aktif
   - Mengulangi panggilan jika pasien tidak datang
   - Melihat daftar antrian yang menunggu

2. **Monitor Antrian**
   - Melihat jumlah antrian menunggu
   - Melihat waktu panggilan antrian
   - Melihat 5 antrian selanjutnya

**B. Manajemen Pasien**
3. **Pencarian Pasien**
   - Mencari pasien berdasarkan NRM
   - Mencari pasien berdasarkan Nama
   - Mencari pasien berdasarkan NIK
   - Melihat hasil pencarian dengan data lengkap

4. **Pendaftaran Pasien Baru**
   - Input data personal pasien
   - Input data penanggung jawab
   - Input alamat lengkap
   - Pilih penjamin default
   - Generate NRM otomatis
   - Validasi data sebelum simpan

**C. Registrasi Kunjungan**
5. **Membuat Registrasi**
   - Melihat data pasien yang dipilih
   - Melihat nomor kunjungan otomatis
   - Memilih poliklinik dari dropdown
   - Memilih dokter (terfilter per poli)
   - Melihat status kuota poli dan dokter
   - Memilih cara bayar (default dari pasien)
   - Input keluhan pasien
   - Melihat harga otomatis
   - Simpan registrasi
   - Cetak bukti registrasi

**D. Data dan Laporan**
6. **Filter dan Pencarian Data**
   - Filter berdasarkan tanggal registrasi
   - Filter berdasarkan cara bayar
   - Filter berdasarkan poliklinik
   - Filter berdasarkan dokter
   - Pencarian berdasarkan NRM/Nama/NIK
   - Reset filter

7. **Melihat Data Pasien Terdaftar**
   - Melihat data hari ini
   - Melihat semua data
   - Melihat detail per pasien
   - Melihat status kunjungan

8. **Export Data**
   - Export data ke Excel
   - Export sesuai filter yang aktif

**E. Statistik**
9. **Melihat Statistik Loket**
   - Jumlah pasien terdaftar
   - Jumlah pasien selesai
   - Jumlah antrian menunggu

#### Non-Fungsional:
- **Kecepatan**: Response time < 2 detik
- **Kemudahan**: Interface intuitif, minimal training
- **Akurasi**: Validasi data real-time
- **Produktivitas**: Workflow efisien, minimal klik
- **Keandalan**: Uptime 99.9% selama jam kerja

---

### 2.3 Kebutuhan Admin Loket

#### Fungsional:

**A. Monitoring**
1. **Dashboard Statistik**
   - Melihat total antrian semua loket
   - Melihat breakdown per loket (1-5)
   - Melihat statistik real-time
   - Melihat trend harian/mingguan/bulanan

2. **Monitoring Semua Loket**
   - Melihat data pendaftaran semua loket
   - Melihat status antrian per loket
   - Melihat kinerja petugas per loket

**B. Filter dan Pencarian**
3. **Filter Lanjutan**
   - Filter berdasarkan tanggal (dari-sampai)
   - Filter berdasarkan loket tertentu
   - Filter berdasarkan poli
   - Filter berdasarkan dokter
   - Filter berdasarkan status antrian
   - Kombinasi multiple filter

**C. Pelaporan**
4. **Export dan Laporan**
   - Export data ke Excel
   - Export dengan filter custom
   - Generate laporan harian
   - Generate laporan periodik

5. **Analisis Data**
   - Melihat distribusi pasien per poli
   - Melihat distribusi pasien per dokter
   - Melihat distribusi pasien per penjamin
   - Melihat waktu rata-rata pelayanan

**D. Manajemen**
6. **Supervisi**
   - Melihat aktivitas semua petugas
   - Melihat jumlah registrasi per petugas
   - Identifikasi bottleneck

#### Non-Fungsional:
- **Kecepatan**: Load dashboard < 3 detik
- **Akurasi**: Data real-time, update otomatis
- **Skalabilitas**: Handle data ribuan record
- **Visualisasi**: Chart dan grafik yang informatif
- **Keamanan**: Akses terbatas, audit trail

---

## 3. KEBUTUHAN SISTEM

### 3.1 Kebutuhan Fungsional

#### F-01: Manajemen Antrian
1. **Generate Nomor Antrian**
   - Sistem dapat generate nomor antrian sequential
   - Nomor dimulai dari 1 setiap hari
   - Format: 001, 002, 003, dst
   - Auto-increment otomatis

2. **Simpan Data Antrian**
   - Menyimpan queue_number
   - Menyimpan status (menunggu_loket, dipanggil, terdaftar, batal, no_show)
   - Menyimpan loket_id
   - Menyimpan timestamp (created_at, called_at)

3. **Update Status Antrian**
   - Update status saat dipanggil
   - Update status saat terdaftar
   - Update loket_id saat dipanggil

4. **Reset Antrian Harian**
   - Auto-reset setiap jam 00:00
   - Arsip data antrian hari sebelumnya

#### F-02: Manajemen Pasien
5. **Generate NRM**
   - Format: YYYYMMDD-XXXX
   - Unique constraint
   - Auto-increment per hari

6. **Simpan Data Pasien**
   - Data personal (nama, NIK, TTL, JK)
   - Data penanggung jawab
   - Alamat lengkap (provinsi, kota, kecamatan, kelurahan)
   - Data penjamin

7. **Pencarian Pasien**
   - Search by NRM (exact match)
   - Search by Nama (partial match, case-insensitive)
   - Search by NIK (exact match)
   - Return hasil dengan join data penjamin

8. **Validasi Data Pasien**
   - NIK harus 16 digit
   - Tanggal lahir harus valid
   - Nomor telepon format Indonesia
   - Email format valid (jika ada)

#### F-03: Manajemen Kunjungan
9. **Generate Nomor Registrasi**
   - Format: REG-YYYYMMDD-XXXX
   - Unique per kunjungan
   - Auto-increment per hari

10. **Hitung Kunjungan Ke-**
    - COUNT visits WHERE patient_id
    - Auto-increment untuk pasien yang sama

11. **Validasi Kuota**
    - Cek kuota poli per hari
    - Cek kuota dokter per hari
    - Tolak jika kuota penuh
    - Update kuota setelah registrasi

12. **Simpan Data Kunjungan**
    - Link ke patient_id
    - Link ke poli_id
    - Link ke dokter_id
    - Link ke penjamin_id
    - Link ke queue_id
    - Simpan keluhan
    - Simpan harga
    - Simpan kunjungan_ke
    - Simpan no_reg
    - Simpan loket_id

13. **Hitung Harga**
    - Harga berbeda per penjamin
    - Harga 0 untuk BPJS/Asuransi
    - Harga sesuai tarif untuk UMUM

#### F-04: Autentikasi & Autorisasi
14. **Login User**
    - Username dan password
    - Session management
    - Store user data di localStorage

15. **Role-Based Access Control**
    - Role: loket (akses loket assigned)
    - Role: admin_loket (akses semua loket)
    - Validasi role setiap request

16. **Assignment Loket**
    - Mapping user ke loket (1-5)
    - Satu user bisa assigned ke multiple loket
    - Validasi assignment saat akses

#### F-05: Notifikasi & Announcement
17. **Text-to-Speech**
    - Convert nomor ke bahasa Indonesia
    - "Nomor antrian [X], silakan menuju loket [Y]"
    - Gunakan Web Speech API
    - Rate: 0.7, Lang: id-ID

18. **Broadcast Display**
    - Update display publik real-time
    - Tampilkan nomor antrian dan loket
    - Gunakan localStorage + Custom Events

#### F-06: Filter & Pencarian
19. **Filter Data Kunjungan**
    - Filter by date range
    - Filter by loket_id
    - Filter by poli_id
    - Filter by dokter_id
    - Filter by penjamin_id
    - Filter by queue_status
    - Kombinasi multiple filter

20. **Pencarian Data**
    - Search by NRM
    - Search by Nama
    - Search by No. Reg
    - Case-insensitive
    - Partial match

#### F-07: Reporting & Export
21. **Export Excel**
    - Export data sesuai filter
    - Format: .xls
    - Include headers
    - Download otomatis

22. **Statistik Dashboard**
    - Total antrian
    - Breakdown per loket
    - Total pasien terdaftar
    - Total pasien selesai
    - Antrian menunggu

#### F-08: Data Master
23. **Load Data Poli**
    - Fetch dari database
    - Cache di state
    - Refresh saat perlu

24. **Load Data Dokter**
    - Fetch dari database
    - Filter by poli_id
    - Cache di state

25. **Load Data Penjamin**
    - Fetch dari database
    - Cache di state

---

### 3.2 Kebutuhan Non-Fungsional

#### NF-01: Performance
1. **Response Time**
   - Page load: < 3 detik
   - API response: < 2 detik
   - Search: < 1 detik
   - Auto-refresh: 5 detik interval

2. **Throughput**
   - Handle 100 concurrent users
   - Process 50 registrasi/jam per loket
   - Support 5 loket simultan

3. **Scalability**
   - Database: Support 100K+ pasien
   - Antrian: Support 1000+ antrian/hari
   - Kunjungan: Support 500+ kunjungan/hari

#### NF-02: Reliability
4. **Availability**
   - Uptime: 99.9% (8 jam downtime/tahun)
   - Operasional: 24/7
   - Maintenance window: Minggu malam

5. **Data Integrity**
   - ACID compliance (database)
   - Unique constraints (NRM, No. Reg)
   - Foreign key constraints
   - Backup harian

6. **Error Handling**
   - Graceful degradation
   - User-friendly error messages
   - Logging semua error
   - Retry mechanism untuk API

#### NF-03: Usability
7. **User Interface**
   - Responsive design (desktop)
   - Konsisten dengan design system
   - Warna: Blue primary (#2563eb)
   - Font: System default, readable

8. **User Experience**
   - Minimal klik untuk task umum
   - Feedback visual untuk setiap action
   - Loading indicator
   - Toast notification (sukses/error)

9. **Accessibility**
   - Font size minimum: 14px
   - Contrast ratio: 4.5:1
   - Keyboard navigation
   - Screen reader friendly

#### NF-04: Security
10. **Authentication**
    - Password hashing (bcrypt)
    - Session timeout: 8 jam
    - Logout otomatis saat idle

11. **Authorization**
    - Role-based access control
    - Validasi di client dan server
    - Prevent unauthorized access

12. **Data Protection**
    - HTTPS only
    - Encrypt sensitive data
    - Sanitize input (prevent SQL injection)
    - CORS policy

#### NF-05: Maintainability
13. **Code Quality**
    - TypeScript untuk type safety
    - ESLint untuk code style
    - Component-based architecture
    - Reusable components

14. **Documentation**
    - Code comments untuk logic kompleks
    - README untuk setup
    - API documentation
    - User manual

15. **Version Control**
    - Git untuk source control
    - Semantic versioning
    - Migration files untuk database

#### NF-06: Compatibility
16. **Browser Support**
    - Chrome 90+
    - Firefox 88+
    - Edge 90+
    - Safari 14+

17. **Device Support**
    - Desktop: 1366x768 minimum
    - Tablet: 1024x768 minimum
    - Tidak support mobile

18. **Integration**
    - Supabase PostgreSQL
    - Next.js framework
    - React 18+
    - TailwindCSS

#### NF-07: Monitoring & Logging
19. **Application Monitoring**
    - Log setiap API call
    - Log error dan exception
    - Performance metrics

20. **User Activity Tracking**
    - Track login/logout
    - Track registrasi created
    - Track antrian called

---

## 4. PRIORITAS KEBUTUHAN

### High Priority (Must Have)
- F-01: Manajemen Antrian (semua)
- F-02: Manajemen Pasien (semua)
- F-03: Manajemen Kunjungan (semua)
- F-04: Autentikasi & Autorisasi (semua)
- F-05: Notifikasi & Announcement (semua)
- NF-01: Performance (response time, throughput)
- NF-02: Reliability (availability, data integrity)
- NF-04: Security (authentication, authorization)

### Medium Priority (Should Have)
- F-06: Filter & Pencarian (semua)
- F-07: Reporting & Export (statistik, export)
- NF-03: Usability (UI/UX)
- NF-05: Maintainability (code quality)
- NF-06: Compatibility (browser support)

### Low Priority (Nice to Have)
- F-07: Advanced Analytics
- NF-07: Monitoring & Logging (advanced metrics)
- Enhanced reporting features
- Mobile support

---

## 5. CONSTRAINTS & ASSUMPTIONS

### Constraints
1. **Teknologi**: Harus menggunakan Next.js + Supabase
2. **Budget**: Limited budget untuk infrastruktur
3. **Timeline**: Development dalam 3 bulan
4. **Resources**: 1-2 developer
5. **Hardware**: Existing komputer loket

### Assumptions
1. Petugas loket sudah familiar dengan komputer
2. Internet connection stabil di rumah sakit
3. Printer tersedia di setiap loket
4. Speaker tersedia untuk announcement
5. Display publik tersedia di area tunggu
6. Pasien dapat membaca dan mendengar
7. Jam operasional: 08:00 - 20:00 (12 jam/hari)
8. Rata-rata 200-500 pasien/hari
9. Rata-rata waktu registrasi: 3-5 menit/pasien
10. Database backup dilakukan oleh IT team
