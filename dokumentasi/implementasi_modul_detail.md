# Implementasi Modul Sistem Antrian dan Pendaftaran Pasien

Pada bab ini akan dijelaskan bagaimana sistem antrian dan pendaftaran pasien dibangun dari sisi teknis implementasinya. Pembahasan dimulai dari halaman login sebagai gerbang masuk sistem, dilanjutkan dengan proses pengambilan nomor antrian oleh pasien, sistem pemanggilan antrian oleh petugas loket, hingga proses pendaftaran kunjungan pasien ke poli dan dokter. Selain itu, juga akan dibahas fitur monitoring untuk admin yang dapat melihat rekap kunjungan seluruh loket, serta modul pengelolaan data pasien yang mencakup tambah, edit, dan lihat detail pasien. Setiap bagian dilengkapi dengan potongan kode yang menunjukkan implementasi utama, penjelasan cara kerjanya, serta screenshot tampilan interface untuk memberikan gambaran visual hasil implementasi.

---

## 1. Implementasi Halaman Login dan Hak Akses Pengguna

### Deskripsi Fitur
Halaman login berfungsi sebagai gerbang utama untuk mengakses sistem dengan validasi username dan password yang aman menggunakan enkripsi bcrypt. Setelah login berhasil, sistem akan menyimpan informasi user di session untuk keperluan autentikasi di halaman-halaman selanjutnya. Implementasi role-based access control memastikan setiap user hanya dapat mengakses menu dan fitur sesuai dengan perannya, baik sebagai petugas loket maupun admin. Untuk user loket, sistem juga melakukan pengecekan assignment agar hanya dapat mengakses loket yang ditugaskan kepadanya.

### Cuplikan Kode
```typescript
// File: pages/api/auth/login.ts
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('username', username)
  .single();

const isValid = await bcrypt.compare(password, user.password);

const { data: assignments } = await supabase
  .from('user_loket_assignment')
  .select('loket_id')
  .eq('user_id', user.id);
```

### Penjelasan Kode
Kode mengimplementasikan proses autentikasi dengan query ke tabel users untuk validasi username dan password menggunakan bcrypt. Setelah validasi berhasil, sistem melakukan query tambahan ke tabel user_loket_assignment untuk mendapatkan daftar loket yang di-assign. Data user dan assignment dikembalikan untuk disimpan di session dan digunakan untuk routing halaman.

### Screenshot UI
**📸 Gambar 5.1** - Halaman Login Sistem

### Penjelasan Gambar 5.1
Gambar 5.1 menampilkan halaman login yang menjadi pintu masuk pertama bagi semua pengguna sistem antrian dan pendaftaran pasien. Interface menyediakan form sederhana dengan input username dan password serta tombol login untuk masuk ke sistem. Desain halaman dibuat minimalis dengan fokus pada keamanan dan kemudahan penggunaan agar petugas dapat login dengan cepat. Setelah berhasil login, sistem akan mengarahkan user ke halaman dashboard sesuai dengan role dan loket yang ditugaskan.

---

## 2. Implementasi Pengambilan Nomor Antrian

### Deskripsi Fitur
Fitur pengambilan nomor antrian memungkinkan pasien untuk mendapatkan nomor antrian secara otomatis dengan sekali klik tanpa perlu input data apapun. Sistem akan generate nomor antrian sequential yang dimulai dari 001 setiap hari dan otomatis reset di hari berikutnya. Algoritma load balancing diterapkan untuk mendistribusikan antrian secara merata ke loket yang memiliki beban kerja paling sedikit. Setelah berhasil mengambil antrian, sistem menampilkan popup konfirmasi yang berisi nomor antrian dan informasi loket tujuan yang harus dituju pasien.

### Cuplikan Kode
```typescript
// File: pages/api/queue/generate.ts
const { data: newTicket } = await supabase
  .from('queue_tickets')
  .insert({
    queue_number: await getNextQueueNumber(),
    loket_id: await getLeastBusyLoket(),
    status: 'waiting'
  })
  .select()
  .single();
```

### Penjelasan Kode
Kode mengimplementasikan proses generate nomor antrian dengan memanggil fungsi untuk mendapatkan nomor sequential dan loket optimal berdasarkan load balancing. Data antrian disimpan ke database dengan status waiting untuk menandakan siap dipanggil. Sistem mengembalikan data ticket yang baru dibuat untuk ditampilkan ke user.

### Screenshot UI
**📸 Gambar 5.2a** - Halaman Ambil Antrian  
**📸 Gambar 5.2b** - Popup Sukses Ambil Antrian

### Penjelasan Gambar 5.2a
Gambar 5.2a menampilkan halaman ambil antrian yang digunakan oleh pasien untuk mendapatkan nomor antrian secara mandiri. Interface dirancang sangat sederhana dengan hanya menampilkan tombol besar bertuliskan "Ambil Antrian" yang mudah ditekan. Desain minimalis ini bertujuan agar pasien dari berbagai kalangan dapat dengan mudah mengambil nomor tanpa kebingungan. Halaman ini biasanya ditampilkan di layar touchscreen yang ditempatkan di area pendaftaran rumah sakit.

### Penjelasan Gambar 5.2b
Gambar 5.2b menampilkan popup konfirmasi yang muncul setelah pasien berhasil mengambil nomor antrian dari sistem. Popup menampilkan nomor antrian dalam ukuran besar dengan format tiga digit agar mudah dibaca dan diingat oleh pasien. Informasi loket tujuan juga ditampilkan dengan jelas sehingga pasien tahu harus menunggu di area loket mana. Interface dilengkapi dengan tombol tutup dan opsi cetak tiket jika pasien ingin membawa bukti fisik nomor antrian.

---

## 3. Implementasi Pemanggilan dan Display Antrian

### Deskripsi Fitur
Dashboard loket menyediakan interface lengkap bagi petugas untuk memanggil antrian, memonitor daftar antrian yang menunggu, dan melihat statistik real-time. Sistem menggunakan mekanisme FIFO (First In First Out) untuk memastikan antrian dipanggil sesuai urutan kedatangan pasien secara adil. Fitur auto-refresh dengan interval 5 detik memastikan data antrian selalu update tanpa perlu reload halaman manual. Halaman display antrian terpisah menampilkan nomor yang sedang dipanggil dengan ukuran sangat besar agar mudah dilihat pasien di ruang tunggu, dilengkapi dengan informasi jadwal dokter untuk referensi pasien.

### Cuplikan Kode
```typescript
// File: pages/api/counter/call-next.ts
const { data: nextTicket } = await supabase
  .from('queue_tickets')
  .select('*')
  .eq('loket_id', loket_id)
  .eq('status', 'waiting')
  .order('created_at', { ascending: true })
  .limit(1)
  .single();

await supabase
  .from('queue_tickets')
  .update({ status: 'called', called_at: new Date() })
  .eq('id', nextTicket.id);
```

### Penjelasan Kode
Kode mengimplementasikan logic pemanggilan antrian dengan query untuk mengambil antrian tertua yang berstatus waiting menggunakan pengurutan berdasarkan waktu pembuatan. Sistem kemudian mengupdate status antrian menjadi called dan menyimpan timestamp pemanggilan. Data antrian yang dipanggil di-broadcast ke halaman display untuk ditampilkan secara real-time.

### Screenshot UI
**📸 Gambar 5.3a** - Halaman Dashboard Per Loket  
**📸 Gambar 5.3b** - Halaman Display Antrian  
**📸 Gambar 5.3c** - Jadwal Dokter

### Penjelasan Gambar 5.3a
Gambar 5.3a menampilkan dashboard loket yang menjadi workspace utama petugas dalam mengelola antrian dan pendaftaran pasien. Bagian atas dashboard menampilkan nomor antrian yang sedang aktif dalam ukuran besar, dilengkapi tombol panggil untuk memanggil antrian berikutnya dan tombol ulangi untuk mengulang panggilan. Di bagian tengah terdapat preview daftar 5 antrian selanjutnya yang sedang menunggu sehingga petugas dapat memperkirakan beban kerja. Bagian bawah menampilkan card statistik yang menunjukkan jumlah pasien terdaftar dan menunggu secara real-time untuk membantu monitoring.

### Penjelasan Gambar 5.3b
Gambar 5.3b menampilkan halaman display antrian yang ditampilkan di layar besar di ruang tunggu untuk dilihat oleh semua pasien. Nomor antrian yang sedang dipanggil ditampilkan dalam ukuran sangat besar dengan warna kontras agar mudah dilihat dari jarak jauh. Informasi loket tujuan juga ditampilkan dengan jelas sehingga pasien tahu harus menuju ke loket mana setelah nomornya dipanggil. Display ini update secara otomatis setiap kali petugas memanggil antrian baru tanpa perlu refresh manual.

### Penjelasan Gambar 5.3c
Gambar 5.3c menampilkan jadwal dokter yang memberikan informasi lengkap mengenai dokter-dokter yang praktik pada hari tersebut. Jadwal menampilkan nama dokter, spesialisasi keahlian, poliklinik tempat praktik, dan jam praktik yang dapat membantu pasien merencanakan kunjungan. Interface ini biasanya ditampilkan di area pendaftaran atau ruang tunggu agar pasien dapat melihat ketersediaan dokter sebelum mengambil antrian. Informasi jadwal ini sangat membantu pasien dalam memutuskan apakah akan mengambil antrian atau datang di waktu lain.

---

## 4. Implementasi Pendaftaran Kunjungan Pasien

### Deskripsi Fitur
Fitur pendaftaran kunjungan memfasilitasi proses pencarian data pasien existing dan registrasi kunjungan ke poli dan dokter setelah antrian dipanggil. Sistem menyediakan pencarian pasien dengan multi-kriteria yang dapat mencari berdasarkan NRM, nama, atau NIK secara fleksibel. Setelah pasien ditemukan, petugas dapat langsung mendaftarkan kunjungan dengan memilih poli dan dokter, dimana sistem akan otomatis validasi kuota yang tersedia. Sistem juga auto-calculate nomor kunjungan pasien dan generate nomor registrasi secara otomatis, kemudian menampilkan bukti pendaftaran yang dapat dicetak sebagai referensi pasien.

### Cuplikan Kode
```typescript
// File: components/modals/patient-search-modal.tsx
const { data } = await supabase
  .from('patients')
  .select(`*, patient_penjamin(penjamin(nama))`)
  .or(`nrm.ilike.%${search}%,nama.ilike.%${search}%,nik.ilike.%${search}%`)
  .limit(10);

// File: pages/api/counter/register-patient.ts
const poliQuota = await supabase.rpc('check_poli_quota', { p_poli_id: poli_id });
const doctorQuota = await supabase.rpc('check_doctor_quota', { p_dokter_id: dokter_id });

const { data: visit } = await supabase
  .from('visits')
  .insert({ patient_id, poli_id, dokter_id, penjamin_id, queue_ticket_id, keluhan })
  .select()
  .single();

await supabase
  .from('queue_tickets')
  .update({ status: 'completed' })
  .eq('id', ticket_id);
```

### Penjelasan Kode
Kode pencarian menggunakan query dengan operator OR untuk mencari di kolom NRM, nama, dan NIK secara case-insensitive dengan join ke tabel penjamin. Kode registrasi melakukan validasi kuota poli dan dokter menggunakan database functions sebelum menyimpan data kunjungan. Setelah insert visit berhasil, sistem mengupdate status antrian menjadi completed untuk menandakan proses registrasi selesai.

### Screenshot UI
**📸 Gambar 5.4a** - Popup Cari Data Pasien  
**📸 Gambar 5.4b** - Popup Data Pasien Ditemukan  
**📸 Gambar 5.4c** - Popup Tambah Kunjungan Rawat Jalan Baru  
**📸 Gambar 5.4d** - Bukti Pendaftaran

### Penjelasan Gambar 5.4a
Gambar 5.4a menampilkan popup pencarian pasien yang digunakan petugas untuk mencari data pasien yang sudah pernah terdaftar di sistem sebelumnya. Interface menyediakan satu input field yang dapat menerima NRM, nama, atau NIK pasien sehingga pencarian menjadi lebih fleksibel. Petugas cukup mengetikkan salah satu kriteria pencarian dan sistem akan menampilkan hasil yang cocok. Popup juga dilengkapi tombol untuk membuat pasien baru jika data yang dicari tidak ditemukan di database.

### Penjelasan Gambar 5.4b
Gambar 5.4b menampilkan popup hasil pencarian yang menampilkan daftar pasien yang cocok dengan kriteria pencarian yang dimasukkan. Hasil ditampilkan dalam bentuk tabel dengan kolom NRM, nama lengkap, tanggal lahir, jenis kelamin, dan penjamin default yang terdaftar. Setiap baris hasil pencarian dilengkapi dengan tombol pilih yang dapat diklik petugas untuk memilih pasien yang akan didaftarkan. Interface memudahkan petugas dalam mengidentifikasi pasien yang tepat terutama jika ada beberapa pasien dengan nama yang mirip.

### Penjelasan Gambar 5.4c
Gambar 5.4c menampilkan popup form registrasi kunjungan rawat jalan yang digunakan untuk mendaftarkan pasien ke poli dan dokter tujuan. Form menyediakan dropdown pemilihan poliklinik dan dokter yang menampilkan informasi kuota tersisa hari ini sehingga petugas dapat memastikan kuota masih tersedia. Dropdown cara bayar otomatis terisi dengan penjamin default pasien namun masih bisa diubah jika pasien ingin menggunakan cara bayar yang berbeda. Interface juga menampilkan input keluhan pasien, harga layanan yang dihitung otomatis, dan informasi ini merupakan kunjungan ke berapa untuk pasien tersebut.

### Penjelasan Gambar 5.4d
Gambar 5.4d menampilkan bukti pendaftaran yang diberikan kepada pasien sebagai konfirmasi bahwa proses registrasi kunjungan telah berhasil dilakukan. Bukti menampilkan informasi lengkap seperti nomor registrasi, NRM pasien, nama lengkap, poliklinik tujuan, nama dokter, cara bayar yang digunakan, dan informasi penting lainnya. Interface menyediakan tombol cetak yang memungkinkan petugas mencetak bukti pendaftaran untuk diberikan kepada pasien. Bukti ini nantinya akan dibawa pasien sebagai referensi saat dipanggil untuk pemeriksaan di poli.

---

## 5. Implementasi Monitoring & Rekap Kunjungan (Admin)

### Deskripsi Fitur
Dashboard admin menyediakan fitur monitoring dan rekap kunjungan seluruh loket secara terpusat dengan berbagai opsi filter untuk memudahkan pencarian data. Filter yang tersedia mencakup rentang tanggal, poliklinik, dokter, penjamin, dan pencarian teks bebas untuk NRM atau nama pasien. Dashboard menampilkan statistik real-time yang menunjukkan total pasien terdaftar, selesai, dan menunggu dengan breakdown per loket untuk monitoring beban kerja. Fitur export ke Excel memungkinkan admin mengunduh data sesuai filter yang aktif untuk keperluan pelaporan dan analisis lebih lanjut.

### Cuplikan Kode
```typescript
// File: pages/admin/loket/index.tsx
const fetchVisits = async () => {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  if (dateFrom) params.append('date_from', dateFrom);
  if (filterPoli) params.append('poli_id', filterPoli);
  
  const response = await fetch(`/api/admin/loket/dashboard?${params}`);
  const data = await response.json();
  setVisits(data);
};

const exportToExcel = () => {
  const html = generateTableHTML(visits);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  downloadFile(blob, `dashboard_${Date.now()}.xls`);
};
```

### Penjelasan Kode
Kode filter membangun query parameters berdasarkan kriteria yang dipilih dan mengirimkannya ke API endpoint untuk mendapatkan data kunjungan. Data hasil query disimpan ke state dan dapat difilter lebih lanjut di client-side untuk pencarian teks. Kode export mengkonversi data menjadi HTML table yang dibungkus dalam Blob untuk didownload sebagai file Excel.

### Screenshot UI
**📸 Gambar 5.5** - Halaman Admin Loket

### Penjelasan Gambar 5.5
Gambar 5.5 menampilkan halaman dashboard admin loket yang menjadi pusat monitoring dan rekap kunjungan untuk semua loket secara terpusat. Bagian atas halaman menampilkan card statistik yang menunjukkan total pasien terdaftar, selesai, dan menunggu dengan breakdown angka per loket untuk memudahkan monitoring beban kerja. Bagian tengah menyediakan filter lengkap berupa input tanggal dari-sampai, dropdown poli-dokter-penjamin, dan input pencarian untuk memfilter data sesuai kebutuhan analisis. Bagian bawah menampilkan tabel data kunjungan lengkap dengan kolom nomor registrasi, NRM, nama pasien, poli, dokter, cara bayar, dan status, dilengkapi tombol Export Excel untuk mengunduh data.

---

## 6. Implementasi Pengelolaan Data Pasien

### Deskripsi Fitur
Modul pengelolaan pasien menyediakan fitur CRUD (Create, Read, Update, Delete) lengkap untuk mengelola data master pasien dalam sistem. Halaman data pasien menampilkan daftar semua pasien yang terdaftar dengan fitur search dan pagination untuk memudahkan navigasi data dalam jumlah besar. Halaman tambah pasien menyediakan form lengkap dengan dropdown cascade untuk wilayah dan auto-generate NRM unik untuk setiap pasien baru. Halaman edit memungkinkan update data pasien existing seperti alamat atau penjamin, sedangkan halaman detail menampilkan informasi lengkap pasien termasuk riwayat kunjungan dalam format read-only.

### Cuplikan Kode
```typescript
// File: pages/counter/patients/index.tsx
const { data } = await supabase
  .from('patients')
  .select(`*, patient_penjamin(penjamin(nama))`)
  .order('created_at', { ascending: false })
  .range((page - 1) * limit, page * limit - 1);

// File: pages/counter/patients/create.tsx
const nrm = await generateNRM();
const { data: patient } = await supabase
  .from('patients')
  .insert({ nrm, ...formData })
  .select()
  .single();

// File: pages/counter/patients/edit/[id].tsx
await supabase
  .from('patients')
  .update(formData)
  .eq('id', patientId);
```

### Penjelasan Kode
Kode halaman data pasien melakukan query dengan join ke tabel penjamin dan menggunakan pagination untuk menampilkan data dalam jumlah besar. Kode tambah pasien generate NRM unik kemudian insert data ke tabel patients dan patient_penjamin secara berurutan. Kode edit pasien mengupdate data existing menggunakan filter berdasarkan id pasien.

### Screenshot UI
**📸 Gambar 5.6a** - Halaman Data Pasien  
**📸 Gambar 5.6b** - Halaman Tambah Pasien  
**📸 Gambar 5.6c** - Halaman Edit Pasien  
**📸 Gambar 5.6d** - Halaman Detail Pasien

### Penjelasan Gambar 5.6a
Gambar 5.6a menampilkan halaman data pasien yang menampilkan daftar lengkap semua pasien yang pernah terdaftar di sistem rumah sakit. Tabel menampilkan kolom-kolom penting seperti NRM sebagai nomor identitas unik pasien, nama lengkap, tanggal lahir, jenis kelamin, alamat, dan penjamin default yang terdaftar. Interface dilengkapi dengan search box di bagian atas untuk mencari pasien berdasarkan nama atau NRM dengan cepat. Bagian bawah tabel terdapat pagination untuk navigasi data dan tombol tambah pasien baru untuk mendaftarkan pasien yang belum pernah terdaftar.

### Penjelasan Gambar 5.6b
Gambar 5.6b menampilkan halaman form tambah pasien yang digunakan untuk mendaftarkan pasien baru yang belum pernah terdaftar di sistem. Form terbagi dalam beberapa section yaitu data personal (nama, NIK, tanggal lahir, jenis kelamin), data penanggung jawab (nama dan nomor telepon), alamat lengkap dengan dropdown cascade, dan pemilihan penjamin default. Dropdown cascade untuk alamat memudahkan pengisian karena pilihan kota akan muncul setelah provinsi dipilih, begitu juga dengan kecamatan dan kelurahan. Interface dilengkapi validasi input untuk memastikan data yang dimasukkan lengkap dan sesuai format sebelum disimpan ke database.

### Penjelasan Gambar 5.6c
Gambar 5.6c menampilkan halaman edit pasien yang memungkinkan petugas untuk mengupdate data pasien yang sudah terdaftar di sistem jika terjadi perubahan. Form yang ditampilkan sama dengan form tambah pasien namun sudah terisi dengan data existing pasien sehingga petugas tinggal mengubah bagian yang perlu diupdate. Fitur ini berguna ketika pasien pindah alamat, ganti nomor telepon, atau mengubah penjamin default yang digunakan. Interface dilengkapi tombol simpan untuk menyimpan perubahan dan tombol batal untuk membatalkan edit dan kembali ke halaman sebelumnya.

### Penjelasan Gambar 5.6d
Gambar 5.6d menampilkan halaman detail pasien yang menampilkan informasi lengkap pasien dalam format read-only tanpa bisa diedit langsung. Halaman ini menampilkan semua data pasien mulai dari data personal, data penanggung jawab, alamat lengkap, penjamin yang terdaftar, hingga riwayat kunjungan pasien ke rumah sakit. Riwayat kunjungan ditampilkan dalam bentuk tabel yang menunjukkan tanggal kunjungan, poli tujuan, dokter yang menangani, dan status kunjungan. Interface menyediakan tombol edit untuk mengubah data pasien jika diperlukan dan tombol kembali untuk kembali ke halaman daftar pasien.

---

## Catatan Screenshot

### Daftar Screenshot yang Diperlukan (15 Gambar):
1. **Gambar 5.1** - Halaman Login Sistem
2. **Gambar 5.2a** - Halaman Ambil Antrian
3. **Gambar 5.2b** - Popup Sukses Ambil Antrian
4. **Gambar 5.3a** - Halaman Dashboard Per Loket
5. **Gambar 5.3b** - Halaman Display Antrian
6. **Gambar 5.3c** - Jadwal Dokter
7. **Gambar 5.4a** - Popup Cari Data Pasien
8. **Gambar 5.4b** - Popup Data Pasien Ditemukan
9. **Gambar 5.4c** - Popup Tambah Kunjungan Rawat Jalan
10. **Gambar 5.4d** - Bukti Pendaftaran
11. **Gambar 5.5** - Halaman Admin Loket
12. **Gambar 5.6a** - Halaman Data Pasien
13. **Gambar 5.6b** - Halaman Tambah Pasien
14. **Gambar 5.6c** - Halaman Edit Pasien
15. **Gambar 5.6d** - Halaman Detail Pasien

### Tips Screenshot:
- Resolusi 1920x1080 atau 1366x768
- Crop bagian relevan saja
- Pastikan text jelas terbaca
- Gunakan light theme
- Screenshot saat ada data (tidak kosong)
- Untuk popup/modal, screenshot dengan background overlay
