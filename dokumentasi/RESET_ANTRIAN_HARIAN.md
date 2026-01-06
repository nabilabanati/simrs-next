# Reset Antrian Per Hari - Dokumentasi

## Ringkasan Perubahan

Sistem antrian telah diupdate untuk **otomatis reset setiap hari** dan hanya menampilkan antrian hari berjalan.

## File yang Dimodifikasi

### 1. **`pages/api/counter/get-queue.ts`**
- ✅ Menambahkan filter `created_at >= TODAY` dan `created_at < TOMORROW`
- ✅ Hanya menampilkan antrian yang dibuat hari ini
- ✅ Berlaku untuk: current ticket, waiting queue, dan count waiting

### 2. **`pages/api/counter/call-next.ts`**
- ✅ Menambahkan filter `created_at >= TODAY` dan `created_at < TOMORROW`
- ✅ Hanya memanggil antrian yang dibuat hari ini
- ✅ Mencegah pemanggilan antrian dari hari sebelumnya

### 3. **`pages/queue/display/index.tsx`**
- ✅ Menambahkan filter `created_at >= TODAY` dan `created_at < TOMORROW`
- ✅ Display hanya menampilkan antrian hari ini
- ✅ Auto-reset display ke 000 jika tidak ada antrian hari ini

## Cara Kerja

### Reset Otomatis
Antrian akan **otomatis reset setiap hari** pada jam **00:00** (tengah malam) karena:

1. **Filter Tanggal**: Semua query menggunakan filter `created_at >= TODAY 00:00:00` dan `created_at < TOMORROW 00:00:00`
2. **Nomor Antrian Baru**: Fungsi database `get_next_queue_number()` sudah menggunakan `DATE(created_at) = CURRENT_DATE`
3. **Load Balancing**: Fungsi `get_least_busy_loket()` juga sudah filter per hari

### Contoh Skenario

#### Skenario 1: Hari Senin
- Jam 08:00 - Pasien ambil nomor antrian → Nomor 001
- Jam 09:00 - Pasien ambil nomor antrian → Nomor 002
- Jam 10:00 - Loket memanggil → Nomor 001, 002 (hari ini)

#### Skenario 2: Ganti Hari (Selasa)
- Jam 00:00 - **Sistem otomatis reset**
- Jam 08:00 - Pasien ambil nomor antrian → Nomor 001 (mulai dari awal)
- Jam 09:00 - Loket hanya melihat antrian hari Selasa
- Antrian hari Senin **tidak ditampilkan** di loket maupun display

## Keuntungan

✅ **Tidak perlu manual reset** - Otomatis setiap hari
✅ **Data historis tetap tersimpan** - Antrian lama masih ada di database
✅ **Nomor antrian mulai dari 001** setiap hari
✅ **Loket hanya melihat antrian hari ini** - Tidak ada kebingungan
✅ **Display publik hanya menampilkan hari ini** - Lebih jelas untuk pasien

## Catatan Penting

⚠️ **Timezone**: Sistem menggunakan timezone lokal server
⚠️ **Database**: Data antrian lama tetap tersimpan dengan status masing-masing
⚠️ **Realtime**: Perubahan langsung terlihat di semua loket dan display

## Testing

Untuk testing reset harian, Anda bisa:

1. **Simulasi Ganti Hari**:
   - Ubah tanggal sistem komputer
   - Atau tunggu hingga jam 00:00

2. **Verifikasi**:
   - Cek nomor antrian baru dimulai dari 001
   - Cek loket tidak menampilkan antrian kemarin
   - Cek display publik reset ke 000

---

**Tanggal Update**: 2026-01-06
**Versi**: 1.0
