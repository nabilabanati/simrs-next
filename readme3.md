# URS Dokter - Prioritas Implementasi

## Tabel Prioritas URS

| Kode | Deskripsi | Prioritas | Alasan |
|------|-----------|-----------|--------|
| URS-D-001 | Dokter dapat login ke sistem menggunakan kredensial yang valid | 🔴 Tinggi | Foundational - harus ada untuk akses sistem |
| URS-D-002 | Dokter hanya dapat melihat daftar pasien yang didaftarkan ke dokter tersebut | 🔴 Tinggi | Data isolation - prevent data leak antar dokter |
| URS-D-013 | Dokter baru bisa melakukan SOAP setelah perawat selesai melakukan TTV | 🔴 Tinggi | Workflow gate - enforce alur nurse → doctor |
| URS-D-003 | Dokter dapat melihat data pasien dan riwayat kunjungan sebelumnya | 🔴 Tinggi | Core functionality - butuh context pasien |
| URS-D-005 | Dokter dapat melihat data TTV yang diinput oleh perawat dalam mode read-only | 🔴 Tinggi | Core data - TTV adalah input wajib untuk SOAP |
| URS-D-006 | Dokter dapat melakukan pemeriksaan medis menggunakan metode SOAP | 🔴 Tinggi | Core functionality - inti dari modul dokter |
| URS-D-010 | Dokter dapat menyimpan hasil pemeriksaan dan resep ke dalam sistem | 🔴 Tinggi | Core functionality - persist data pemeriksaan |
| URS-D-011 | Sistem secara otomatis mengirimkan data resep ke modul farmasi setelah pemeriksaan disimpan | 🔴 Tinggi | Critical integration - hubungkan doctor-pharmacy |
| URS-D-007 | Dokter dapat membuat resep elektronik (e-prescription) dengan fitur autocomplete | 🔴 Tinggi | Core functionality - resep adalah output utama |
| URS-D-008 | Dokter dapat menambahkan lebih dari satu item obat dalam satu resep | 🔴 Tinggi | Core functionality - real-world use case |
| URS-D-009 | Resep hanya dapat memilih obat yang tersedia di stok farmasi, obat tidak tersedia masuk catatan | 🔴 Tinggi | Data validation - prevent error di farmasi |
| URS-D-017 | Dokter dapat mengakhiri/menyelesaikan kunjungan pasien | 🔴 Tinggi | Workflow completion - mark kunjungan done |
| URS-D-014 | Button "Tambah Pemeriksaan" disable setelah pemeriksaan dibuat, button "Selesaikan Kunjungan" aktif | 🔴 Tinggi | UX clarity - prevent duplicate/confusion |
| URS-D-015 | Dokter dapat mengedit pemeriksaan hari itu sebelum kunjungan diakhiri | 🟡 Sedang | Flexibility - allow correction sebelum final |
| URS-D-016 | Dokter tidak dapat mengedit kunjungan yang sudah diakhiri atau kunjungan dari dokter lain | 🟡 Sedang | Data integrity - prevent unauthorized changes |
| URS-D-012 | Dashboard utama hanya menampilkan daftar pasien yang melakukan kunjungan di hari itu | 🟡 Sedang | UX filtering - fokus ke pasien hari ini |
| URS-D-019 | Pasien yang sudah selesai kunjungan otomatis pindah ke bagian bawah list di dashboard | 🟡 Sedang | UX sorting - prioritize pasien belum selesai |
| URS-D-020 | Data pasien yang sudah ganti hari akan masuk ke halaman riwayat kunjungan | 🟡 Sedang | Data management - auto archive old data |
| URS-D-021 | Dokter dapat melihat halaman riwayat kunjungan untuk semua pasien yang pernah masuk | 🟢 Rendah | Reporting - nice to have untuk review |
| URS-D-022 | Dokter dapat melihat status resep yang dipesan ke farmasi (belum diambil/sudah diambil) | 🟢 Rendah | Monitoring - tracking status resep |
| URS-D-018 | Sistem otomatis mencetak struk kunjungan dan resep setelah kunjungan diakhiri | 🟢 Rendah | Automation - bisa manual download dulu |

---

## Urutan Implementasi Berdasarkan Prioritas

### 🔴 Prioritas Tinggi (Must Have - 13 URS)
**Implementasi pertama - Core functionality yang harus ada**

1. **URS-D-001** - Login ke sistem
2. **URS-D-002** - Filter pasien per dokter
3. **URS-D-013** - Gate: SOAP setelah TTV selesai
4. **URS-D-003** - Lihat data pasien & riwayat
5. **URS-D-005** - Lihat TTV read-only
6. **URS-D-006** - Input SOAP
7. **URS-D-010** - Simpan pemeriksaan
8. **URS-D-011** - Auto kirim resep ke farmasi
9. **URS-D-007** - E-prescription autocomplete
10. **URS-D-008** - Multiple items resep
11. **URS-D-009** - Validasi stok obat
12. **URS-D-017** - Selesaikan kunjungan
13. **URS-D-014** - Button state management

**Deliverable**: Full workflow dokter → farmasi berjalan lengkap

---

### 🟡 Prioritas Sedang (Should Have - 5 URS)
**Implementasi kedua - UX improvements & data integrity**

14. **URS-D-015** - Edit sebelum selesai
15. **URS-D-016** - Restrict edit kunjungan lama
16. **URS-D-012** - Dashboard filter hari ini
17. **URS-D-019** - Auto pindah ke bawah setelah selesai
18. **URS-D-020** - Auto pindah ke riwayat setelah ganti hari

**Deliverable**: UX polish & data integrity terjaga

---

### 🟢 Prioritas Rendah (Nice to Have - 3 URS)
**Implementasi ketiga - Enhancement & reporting**

19. **URS-D-021** - Halaman riwayat kunjungan
20. **URS-D-022** - Tracking status resep farmasi
21. **URS-D-018** - Auto print struk & resep

**Deliverable**: Reporting & monitoring lengkap

---

## Catatan Implementasi

### 🔥 Critical Path
```
Login → Filter Pasien → Cek TTV → Lihat Data → Input SOAP → Simpan → Kirim ke Farmasi → Selesaikan Kunjungan
```

### 🔗 Dependencies
- **URS-D-011** bergantung pada modul Farmasi sudah ready
- **URS-D-009** bergantung pada API stok farmasi
- **URS-D-022** bergantung pada status tracking di farmasi
- **URS-D-013** bergantung pada status TTV dari nurse

### ⚠️ Perhatian Khusus
- **URS-D-018** (auto print) → Skip dulu karena "ga ada printer" (README line 12), pakai manual download PDF
- **URS-D-016** → Penting untuk data integrity, jangan di-skip
- **URS-D-002** → Critical untuk multi-dokter environment

### 🎯 Quick Win
Fokus ke **Sprint 1 + Sprint 2** dulu untuk MVP yang bisa demo ke stakeholder.
