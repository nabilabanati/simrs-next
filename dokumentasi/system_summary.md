# Summary Sistem Antrian dan Loket SIMRS

## 📌 Informasi Umum

**Nama Sistem:** Sistem Informasi Manajemen Rumah Sakit (SIMRS) - Modul Antrian dan Loket Pendaftaran

**Tujuan:** Mengelola alur pendaftaran pasien dari pengambilan nomor antrian hingga registrasi kunjungan ke poliklinik secara digital dan terstruktur.

**Ruang Lingkup:** Front-office rumah sakit, khususnya bagian pendaftaran pasien rawat jalan.

---

## 🎯 Latar Belakang

Sistem ini dikembangkan untuk mengatasi permasalahan dalam proses pendaftaran pasien di rumah sakit, yaitu:
- Antrian manual yang tidak terorganisir
- Waktu tunggu yang tidak jelas
- Proses pencatatan data yang masih manual
- Kesulitan monitoring dan pelaporan
- Duplikasi data pasien
- Tidak ada validasi kuota poli dan dokter

---

## 👥 Pengguna Sistem

### 1. **Pasien**
- Mengambil nomor antrian dari mesin/kiosk
- Menunggu dipanggil oleh petugas loket
- Tidak memerlukan login

### 2. **Petugas Loket** (Role: `loket`)
- Staff administrasi yang bertugas di loket 1-5
- Memanggil antrian, mendaftarkan pasien, membuat registrasi kunjungan
- Assigned ke loket tertentu

### 3. **Admin Loket** (Role: `admin_loket`)
- Supervisor yang mengawasi semua loket
- Monitoring, analisis, dan pelaporan
- Akses ke semua loket

---

## ⚙️ Fitur Utama

### A. Fitur Manajemen Antrian
1. **Generate Nomor Antrian**
   - Nomor sequential dimulai dari 001 setiap hari
   - Auto-reset jam 00:00
   - Cetak tiket antrian

2. **Panggil Antrian**
   - Panggil antrian berikutnya dengan 1 klik
   - Pengumuman via Text-to-Speech (Bahasa Indonesia)
   - Broadcast ke display publik
   - Ulangi panggilan jika diperlukan

3. **Monitor Antrian**
   - Lihat antrian yang sedang aktif
   - Lihat jumlah antrian menunggu
   - Lihat 5 antrian selanjutnya

### B. Fitur Manajemen Pasien
4. **Pencarian Pasien**
   - Cari berdasarkan NRM (Nomor Rekam Medis)
   - Cari berdasarkan Nama
   - Cari berdasarkan NIK

5. **Pendaftaran Pasien Baru**
   - Input data personal (Nama, NIK, TTL, Jenis Kelamin)
   - Input data penanggung jawab
   - Input alamat lengkap (Provinsi, Kota, Kecamatan, Kelurahan)
   - Pilih penjamin/cara bayar
   - Generate NRM otomatis (Format: YYYYMMDD-XXXX)

### C. Fitur Registrasi Kunjungan
6. **Buat Registrasi Kunjungan**
   - Pilih poliklinik
   - Pilih dokter (terfilter per poli)
   - Validasi kuota poli dan dokter
   - Input keluhan pasien
   - Pilih cara bayar (default dari data pasien)
   - Hitung harga otomatis
   - Generate nomor registrasi (Format: REG-YYYYMMDD-XXXX)
   - Hitung "Kunjungan Ke-" otomatis

7. **Validasi Kuota**
   - Cek kuota harian per poli
   - Cek kuota harian per dokter
   - Tolak registrasi jika kuota penuh
   - Update kuota setelah registrasi berhasil

### D. Fitur Pelaporan & Monitoring
8. **Filter dan Pencarian Data**
   - Filter berdasarkan tanggal registrasi
   - Filter berdasarkan cara bayar
   - Filter berdasarkan poliklinik
   - Filter berdasarkan dokter
   - Pencarian berdasarkan NRM/Nama/NIK

9. **Dashboard Statistik**
   - Total pasien terdaftar
   - Total pasien selesai penanganan
   - Total antrian menunggu
   - Breakdown per loket (untuk admin)

10. **Export Data**
    - Export ke Excel
    - Export sesuai filter yang aktif

---

## 🏗️ Arsitektur Sistem

### Teknologi Stack
- **Frontend:** Next.js 14 (React 18), TypeScript
- **Styling:** TailwindCSS, Shadcn UI Components
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Custom auth dengan localStorage
- **Text-to-Speech:** Web Speech API
- **Real-time:** Polling (5 detik interval) + LocalStorage Events

### Database Schema (Tabel Utama)
1. **`queue`** - Data antrian
   - queue_number, status, loket_id, created_at, called_at

2. **`patients`** - Data pasien
   - nrm, nama, nik, tanggal_lahir, jenis_kelamin, alamat, dll

3. **`patient_penjamin`** - Relasi pasien dengan penjamin
   - patient_id, penjamin_id

4. **`visits`** - Data kunjungan/registrasi
   - no_reg, patient_id, poli_id, dokter_id, penjamin_id, queue_id, loket_id, keluhan, harga, kunjungan_ke

5. **`poli`** - Data poliklinik
   - nama, kuota_harian

6. **`doctors`** - Data dokter
   - nama, poli_id, kuota_harian

7. **`penjamin`** - Data cara bayar
   - nama (UMUM, BPJS, Asuransi)

8. **`users`** - Data user sistem
   - username, password, role

9. **`user_loket_assignment`** - Assignment user ke loket
   - user_id, loket_id

---

## 🔄 Alur Proses Utama

### 1. Alur Pengambilan Antrian
```
Pasien Datang → Ambil Nomor Antrian → Sistem Generate Nomor → 
Cetak Tiket → Status: menunggu_loket → Pasien Menunggu
```

### 2. Alur Panggilan Antrian
```
Petugas Klik Panggil → Sistem Ambil Antrian Tertua → 
Update Status: dipanggil → Tampilkan di Layar → 
Umumkan via Speaker → Pasien Menuju Loket
```

### 3. Alur Registrasi Pasien Baru
```
Petugas Klik Tambah Pendaftaran → Cari Pasien → Tidak Ditemukan → 
Buat Pasien Baru → Input Data Lengkap → Generate NRM → 
Simpan Data → Lanjut ke Registrasi Kunjungan
```

### 4. Alur Registrasi Kunjungan
```
Pilih Pasien → Pilih Poli → Pilih Dokter → Cek Kuota → 
Input Keluhan → Pilih Cara Bayar → Hitung Harga → 
Generate No. Reg → Simpan → Update Status Antrian: terdaftar → 
Cetak Bukti Registrasi
```

---

## 📊 Status Antrian

| Status | Deskripsi |
|--------|-----------|
| `menunggu_loket` | Antrian baru, belum dipanggil |
| `dipanggil` | Sedang dipanggil oleh loket |
| `terdaftar` | Pasien berhasil terdaftar |
| `batal` | Antrian dibatalkan |
| `no_show` | Pasien tidak datang saat dipanggil |

---

## 🔐 Autentikasi & Autorisasi

### Role-Based Access Control
- **Role `loket`:** Akses hanya ke loket yang di-assign
- **Role `admin_loket`:** Akses ke semua loket + dashboard admin

### Validasi
- Client-side: Check localStorage user data
- Server-side: Validate role di API routes
- Assignment: Check `user_loket_assignment` table

---

## 📈 Performa & Skalabilitas

### Performance Metrics
- Page load: < 3 detik
- API response: < 2 detik
- Search: < 1 detik
- Auto-refresh: 5 detik interval

### Kapasitas
- Support 100 concurrent users
- Handle 500+ kunjungan/hari
- Support 5 loket simultan
- Database: 100K+ pasien

---

## 🎨 User Interface

### Design System
- **Primary Color:** Blue (#2563eb)
- **Layout:** Responsive desktop (minimum 1366x768)
- **Components:** Shadcn UI (Card, Table, Button, Input, Modal)
- **Typography:** System default, readable
- **Feedback:** Toast notifications (Sonner)

### Key Pages
1. **`/counter/loket-[1-5]`** - Interface loket individual
2. **`/admin/loket`** - Dashboard admin semua loket
3. **`/counter/patients/create`** - Form pendaftaran pasien baru
4. **`/display`** - Display publik untuk pasien

---

## ✅ Keunggulan Sistem

1. **Efisiensi:** Proses pendaftaran lebih cepat dan terstruktur
2. **Transparansi:** Pasien tahu nomor antrian dan estimasi waktu
3. **Akurasi:** Validasi data dan kuota real-time
4. **Monitoring:** Dashboard untuk analisis dan pelaporan
5. **Integrasi:** Satu database terpusat untuk semua loket
6. **User-Friendly:** Interface intuitif, minimal training
7. **Scalable:** Mudah ditambah loket atau fitur baru

---

## 🚀 Implementasi

### Deployment
- **Environment:** Production (Vercel/Self-hosted)
- **Database:** Supabase Cloud
- **Domain:** Custom domain rumah sakit

### Hardware Requirements
- **Loket:** PC/Laptop dengan browser modern
- **Printer:** Untuk cetak tiket dan bukti registrasi
- **Speaker:** Untuk pengumuman antrian
- **Display:** Monitor untuk display publik
- **Internet:** Koneksi stabil minimum 10 Mbps

---

## 📝 Dokumentasi Terkait

1. **Use Case Diagram** - `dokumentasi/use_case_diagram.md`
2. **Activity Diagram** - `dokumentasi/activity_diagram.md`
3. **User & System Requirements** - `dokumentasi/user_system_requirements.md`
4. **Database Schema** - `readme database.md`
5. **System Design** - `dokumentasi/System_Design_Diagrams.md`

---

## 🔮 Pengembangan Selanjutnya

### Fitur yang Bisa Ditambahkan
1. Mobile app untuk pasien (cek antrian dari HP)
2. SMS/WhatsApp notification
3. Online appointment/booking
4. Integration dengan sistem rekam medis elektronik
5. Dashboard analytics yang lebih advanced
6. Multi-language support
7. Biometric authentication untuk pasien
8. QR code untuk tiket antrian

---

## 📞 Support & Maintenance

### Maintenance Schedule
- **Daily:** Database backup otomatis
- **Weekly:** Review logs dan performance
- **Monthly:** Update dependencies
- **Quarterly:** Security audit

### Known Issues & Limitations
1. Tidak support mobile device
2. Memerlukan internet connection
3. Text-to-Speech tergantung browser support
4. Polling-based (bukan WebSocket real-time)

---

## 📄 Lisensi & Credits

**Developed by:** [Nama Developer/Tim]  
**Institution:** [Nama Rumah Sakit/Institusi]  
**Year:** 2024-2025  
**Framework:** Next.js, Supabase, TailwindCSS  

---

**Catatan:** Dokumentasi ini dibuat untuk keperluan akademis dan dokumentasi proyek. Untuk informasi lebih detail, silakan merujuk ke dokumentasi teknis di folder `dokumentasi/`.
