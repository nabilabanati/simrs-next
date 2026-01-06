# Penjelasan Entitas Utama ERD Sistem Antrian dan Pendaftaran

## Overview

Entity Relationship Diagram (ERD) digunakan untuk memodelkan struktur basis data pada modul antrian dan pendaftaran pasien secara konseptual. ERD menggambarkan entitas utama seperti pasien, kunjungan, antrian, poli, dokter, penjamin, dan pengguna sistem beserta atribut penting dan relasi di antaranya, sehingga keterkaitan data yang diperlukan dalam proses pelayanan dapat terlihat dengan jelas dan terstruktur.

---

## Entitas Utama

Penjelasan berikut menguraikan fungsi masing-masing entitas utama dalam sistem serta perannya dalam mendukung alur antrian dan pendaftaran pasien.

### a. Entitas `patients`
Entitas **patients** menyimpan data identitas pasien seperti NRM, NIK, nama, tanggal lahir, alamat, dan data penanggung jawab. Data ini digunakan sebagai referensi utama untuk pencarian pasien lama, pendaftaran pasien baru, dan pencatatan riwayat kunjungan.

---

### b. Entitas `queue_tickets`
Entitas **queue_tickets** mengelola data antrian pasien dengan menyimpan nomor antrian, loket tujuan, dan status (waiting, called, completed, no_show). Entitas ini mendukung mekanisme pemanggilan antrian secara real-time dan load balancing otomatis ke loket.

**Relasi:** `queue_tickets` → `visits` (1:0..1) - Satu antrian dapat menghasilkan 0 atau 1 kunjungan.

---

### c. Entitas `visits`
Entitas **visits** mencatat setiap kunjungan pasien dengan menghubungkan data pasien, poli, dokter, dan penjamin. Entitas ini menyimpan nomor registrasi, keluhan, biaya, dan memiliki foreign key `queue_ticket_id` untuk melacak antrian yang menghasilkan kunjungan tersebut.

**Relasi:** `visits` → `queue_tickets` (N:1) - Banyak visit dapat berasal dari berbagai antrian.

---

### d. Entitas `poli`
Entitas **poli** menyimpan data poliklinik yang tersedia, termasuk nama, kode, harga pendaftaran, dan kuota harian. Data ini digunakan saat pendaftaran untuk menentukan tujuan layanan dan validasi ketersediaan kuota.

---

### e. Entitas `doctors`
Entitas **doctors** menyimpan data dokter yang meliputi nama, spesialisasi, SIP, poli utama, dan kuota harian. Sistem memfilter dokter berdasarkan poli yang dipilih saat pendaftaran kunjungan.

---

### f. Entitas `penjamin`
Entitas **penjamin** menyimpan data metode pembayaran seperti BPJS, asuransi, atau umum. Data ini digunakan untuk verifikasi cara bayar dan perhitungan biaya layanan saat pendaftaran.

---

### g. Entitas `patient_penjamin`
Entitas **patient_penjamin** menghubungkan pasien dengan penjamin dan menyimpan detail seperti nomor BPJS atau polis asuransi. Data ini digunakan untuk auto-fill penjamin default saat registrasi.

---

### h. Entitas `users`
Entitas **users** menyimpan data akun pengguna sistem (petugas loket dan admin) untuk autentikasi dan otorisasi. Sistem menggunakan role-based access control (RBAC) berdasarkan role user.

---

### i. Entitas `user_loket_assignment`
Entitas **user_loket_assignment** menyimpan penugasan user ke loket tertentu (1-5). Entitas ini digunakan untuk validasi akses saat user mencoba mengakses halaman loket tertentu.

---

## Relasi Antar Entitas

### Relasi Utama:
1. **patients → visits** (1:N) - Satu pasien dapat memiliki banyak kunjungan
2. **queue_tickets → visits** (1:0..1) - Satu antrian dapat menghasilkan 0 atau 1 kunjungan
3. **poli → visits** (1:N) - Satu poli melayani banyak kunjungan
4. **doctors → visits** (1:N) - Satu dokter menangani banyak kunjungan
5. **penjamin → visits** (1:N) - Satu penjamin digunakan untuk banyak kunjungan
6. **patients → patient_penjamin** (1:N) - Satu pasien dapat memiliki banyak penjamin
7. **users → user_loket_assignment** (1:N) - Satu user dapat ditugaskan ke banyak loket

---

## Kesimpulan

Struktur ERD ini dirancang untuk mendukung alur antrian dan pendaftaran pasien secara efisien dengan pemisahan yang jelas antara data antrian (`queue_tickets`) dan data kunjungan (`visits`). Pemisahan ini memungkinkan sistem untuk mengelola antrian secara independen dan hanya membuat record kunjungan ketika pasien benar-benar menyelesaikan proses registrasi, sehingga data lebih akurat dan terstruktur.
