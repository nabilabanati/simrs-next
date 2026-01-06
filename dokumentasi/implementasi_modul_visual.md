# Implementasi Modul Sistem Antrian dan Pendaftaran Pasien

Pada bab ini akan dijelaskan bagaimana sistem antrian dan pendaftaran pasien dibangun dari sisi teknis implementasinya. Pembahasan dimulai dari halaman login sebagai gerbang masuk sistem, dilanjutkan dengan proses pengambilan nomor antrian oleh pasien, sistem pemanggilan antrian oleh petugas loket, hingga proses pendaftaran kunjungan pasien ke poli dan dokter. Selain itu, juga akan dibahas fitur monitoring untuk admin yang dapat melihat rekap kunjungan seluruh loket, serta modul pengelolaan data pasien yang mencakup tambah, edit, dan lihat detail pasien. Setiap bagian dilengkapi dengan potongan kode yang menunjukkan implementasi utama, penjelasan cara kerjanya, serta screenshot tampilan interface untuk memberikan gambaran visual hasil implementasi.

---

## 1. Implementasi Halaman Login dan Hak Akses Pengguna

### Deskripsi Fitur
Halaman login berfungsi sebagai gerbang utama untuk mengakses sistem dengan validasi username dan password yang aman. Setelah login berhasil, sistem akan menyimpan informasi user di session untuk keperluan autentikasi di halaman-halaman selanjutnya. Implementasi role-based access control memastikan setiap user hanya dapat mengakses menu dan fitur sesuai dengan perannya, baik sebagai petugas loket maupun admin. Untuk user loket, sistem juga melakukan pengecekan assignment agar hanya dapat mengakses loket yang ditugaskan kepadanya.

### Cuplikan Kode
Berikut potongan kode untuk proses login dan validasi user:

**Kode Program 5.1** - Autentikasi dan Validasi Login
```typescript
// Validasi username dan password
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('username', username)
  .single();

const isValid = await bcrypt.compare(password, user.password);
```

### Penjelasan Kode
Kode ini berfungsi untuk memvalidasi username dan password yang dimasukkan user saat login. Sistem akan mencari data user di database berdasarkan username, kemudian membandingkan password yang diinput dengan password yang tersimpan menggunakan enkripsi bcrypt. Jika validasi berhasil, user akan diarahkan ke halaman sesuai dengan hak aksesnya.

### Screenshot UI
**📸 Gambar 5.1** - Halaman Login Sistem

### Penjelasan Gambar 5.1
Gambar 5.1 menampilkan halaman login yang menjadi pintu masuk pertama bagi semua pengguna sistem antrian dan pendaftaran pasien. Interface menyediakan form sederhana dengan input username dan password serta tombol login untuk masuk ke sistem. Desain halaman dibuat minimalis dengan fokus pada keamanan dan kemudahan penggunaan agar petugas dapat login dengan cepat. Setelah berhasil login, sistem akan mengarahkan user ke halaman dashboard sesuai dengan role dan loket yang ditugaskan.

---

## 2. Implementasi Pengambilan Nomor Antrian

### Deskripsi Fitur
Fitur pengambilan nomor antrian memungkinkan pasien untuk mendapatkan nomor antrian secara otomatis dengan sekali klik tanpa perlu input data apapun. Sistem akan generate nomor antrian sequential yang dimulai dari 001 setiap hari dan otomatis reset di hari berikutnya. Algoritma load balancing diterapkan untuk mendistribusikan antrian secara merata ke loket yang memiliki beban kerja paling sedikit. Setelah berhasil mengambil antrian, sistem menampilkan popup konfirmasi yang berisi nomor antrian dan informasi loket tujuan yang harus dituju pasien.

### Cuplikan Kode
Berikut potongan kode untuk generate nomor antrian otomatis:

**Kode Program 5.2** - Generate Nomor Antrian
```typescript
// Generate nomor antrian dengan load balancing
const { data: newTicket } = await supabase
  .from('queue_tickets')
  .insert({
    queue_number: await getNextQueueNumber(),
    loket_id: await getLeastBusyLoket(),
    status: 'waiting'
  });
```

### Penjelasan Kode
Kode ini berfungsi untuk membuat nomor antrian baru secara otomatis. Sistem akan menentukan nomor antrian berikutnya secara berurutan dan memilih loket yang paling tidak sibuk untuk melayani pasien. Data antrian disimpan dengan status menunggu agar bisa dipanggil oleh petugas loket.

### Screenshot UI
**📸 Gambar 5.2a** - Halaman Ambil Antrian  
**📸 Gambar 5.2b** - Popup Sukses Ambil Antrian

### Penjelasan Gambar 5.2a
Gambar 5.2a menampilkan halaman ambil antrian yang digunakan oleh pasien untuk mendapatkan nomor antrian secara mandiri. Interface dirancang sangat sederhana dengan hanya menampilkan tombol besar bertuliskan "Ambil Antrian" yang mudah ditekan. Desain minimalis ini bertujuan agar pasien dari berbagai kalangan dapat dengan mudah mengambil nomor tanpa kebingungan. Halaman ini biasanya ditampilkan di layar touchscreen yang ditempatkan di area pendaftaran rumah sakit.

### Penjelasan Gambar 5.2b
Gambar 5.2b menampilkan popup konfirmasi yang muncul setelah pasien berhasil mengambil nomor antrian dari sistem. Popup menampilkan nomor antrian dalam ukuran besar dengan format tiga digit agar mudah dibaca dan diingat oleh pasien. Informasi loket tujuan juga ditampilkan dengan jelas sehingga pasien tahu harus menunggu di area loket mana. Interface dilengkapi dengan tombol tutup dan opsi cetak tiket jika pasien ingin membawa bukti fisik nomor antrian.

---

## 3. Implementasi Dashboard Loket dan Pemanggilan Antrian

### Deskripsi Fitur
Dashboard loket menyediakan interface lengkap bagi petugas untuk memanggil antrian, memonitor daftar antrian yang menunggu, dan melihat statistik real-time. Sistem menggunakan mekanisme FIFO (First In First Out) untuk memastikan antrian dipanggil sesuai urutan kedatangan pasien secara adil. Fitur auto-refresh dengan interval 5 detik memastikan data antrian selalu update tanpa perlu reload halaman manual. Petugas dapat mengulang panggilan jika pasien tidak mendengar atau belum datang ke loket.

### Cuplikan Kode
Berikut potongan kode untuk dashboard loket dan pemanggilan antrian:

**Kode Program 5.3a** - Dashboard Loket dan Pemanggilan Antrian
```typescript
// Auto-refresh setiap 5 detik
useEffect(() => {
  fetchQueue();
  const interval = setInterval(fetchQueue, 5000);
  return () => clearInterval(interval);
}, [loketId]);

// Panggil antrian FIFO
const { data: nextTicket } = await supabase
  .from('queue_tickets')
  .select('*')
  .eq('status', 'waiting')
  .order('created_at', { ascending: true })
  .limit(1);

await supabase
  .from('queue_tickets')
  .update({ status: 'called' })
  .eq('id', nextTicket.id);
```

### Penjelasan Kode
Kode ini berfungsi untuk menampilkan dan mengelola antrian di dashboard loket. Sistem akan otomatis memperbarui data antrian setiap 5 detik agar petugas selalu melihat informasi terbaru. Saat petugas menekan tombol panggil, sistem akan mengambil antrian tertua yang masih menunggu dan mengubah statusnya menjadi dipanggil.

### Screenshot UI
**📸 Gambar 5.3a** - Halaman Dashboard Per Loket

### Penjelasan Gambar 5.3a
Gambar 5.3a menampilkan dashboard loket yang menjadi workspace utama petugas dalam mengelola antrian dan pendaftaran pasien. Bagian atas dashboard menampilkan nomor antrian yang sedang aktif dalam ukuran besar, dilengkapi tombol panggil untuk memanggil antrian berikutnya dan tombol ulangi untuk mengulang panggilan. Di bagian tengah terdapat preview daftar 5 antrian selanjutnya yang sedang menunggu sehingga petugas dapat memperkirakan beban kerja. Bagian bawah menampilkan card statistik yang menunjukkan jumlah pasien terdaftar dan menunggu secara real-time untuk membantu monitoring.

---

## 4. Implementasi Display Antrian Publik

### Deskripsi Fitur
Halaman display antrian ditampilkan di layar besar di ruang tunggu untuk dilihat oleh semua pasien yang menunggu. Display menampilkan nomor antrian yang sedang dipanggil dengan ukuran sangat besar agar mudah dilihat dari jarak jauh. Sistem menggunakan event listener untuk menangkap update antrian secara real-time tanpa perlu refresh manual. Display juga dilengkapi dengan informasi jadwal dokter yang praktik pada hari tersebut untuk referensi pasien.

### Cuplikan Kode
Berikut potongan kode untuk display antrian di ruang tunggu:

**Kode Program 5.3b** - Display Antrian Real-time
```typescript
// Event listener untuk update real-time
useEffect(() => {
  const handleQueueUpdate = (event: CustomEvent) => {
    setCurrentQueue(event.detail.currentNumber);
    setCurrentLoket(event.detail.loket);
    playAnnouncement(event.detail.currentNumber, event.detail.loket);
  };
  
  window.addEventListener('queueUpdate', handleQueueUpdate);
  return () => window.removeEventListener('queueUpdate', handleQueueUpdate);
}, []);

// Text-to-Speech dalam Bahasa Indonesia
const speech = new SpeechSynthesisUtterance(
  `Nomor antrian ${queueInIndonesian}, silakan menuju loket ${loketInIndonesian}`
);
speech.lang = 'id-ID';
window.speechSynthesis.speak(speech);
```

### Penjelasan Kode
Kode ini berfungsi untuk menampilkan nomor antrian yang sedang dipanggil di layar display ruang tunggu. Sistem akan otomatis mendengarkan update dari dashboard loket dan langsung menampilkan nomor antrian terbaru. Selain tampilan visual, sistem juga akan mengumumkan nomor antrian menggunakan suara dalam Bahasa Indonesia.

### Screenshot UI
**📸 Gambar 5.4a** - Halaman Display Antrian  
**📸 Gambar 5.4b** - Jadwal Dokter

### Penjelasan Gambar 5.4a
Gambar 5.4a menampilkan halaman display antrian yang ditampilkan di layar besar di ruang tunggu untuk dilihat oleh semua pasien. Nomor antrian yang sedang dipanggil ditampilkan dalam ukuran sangat besar dengan warna kontras agar mudah dilihat dari jarak jauh. Informasi loket tujuan juga ditampilkan dengan jelas sehingga pasien tahu harus menuju ke loket mana setelah nomornya dipanggil. Display ini update secara otomatis setiap kali petugas memanggil antrian baru tanpa perlu refresh manual.

### Penjelasan Gambar 5.4b
Gambar 5.4b menampilkan jadwal dokter yang memberikan informasi lengkap mengenai dokter-dokter yang praktik pada hari tersebut. Jadwal menampilkan nama dokter, spesialisasi keahlian, poliklinik tempat praktik, dan jam praktik yang dapat membantu pasien merencanakan kunjungan. Interface ini biasanya ditampilkan di area pendaftaran atau ruang tunggu agar pasien dapat melihat ketersediaan dokter sebelum mengambil antrian. Informasi jadwal ini sangat membantu pasien dalam memutuskan apakah akan mengambil antrian atau datang di waktu lain.

---

## 5. Implementasi Pendaftaran Kunjungan Pasien

### Deskripsi Fitur
Fitur pendaftaran kunjungan memfasilitasi proses pencarian data pasien existing dan registrasi kunjungan ke poli dan dokter setelah antrian dipanggil. Sistem menyediakan pencarian pasien dengan multi-kriteria yang dapat mencari berdasarkan NRM, nama, atau NIK secara fleksibel. Setelah pasien ditemukan, petugas dapat langsung mendaftarkan kunjungan dengan memilih poli dan dokter, dimana sistem akan otomatis validasi kuota yang tersedia. Sistem juga auto-calculate nomor kunjungan pasien dan generate nomor registrasi secara otomatis, kemudian menampilkan bukti pendaftaran yang dapat dicetak sebagai referensi pasien.

### Cuplikan Kode
Berikut potongan kode untuk pencarian pasien dan registrasi kunjungan:

**Kode Program 5.5** - Pencarian dan Registrasi Pasien
```typescript
// Pencarian multi-kriteria
const { data } = await supabase
  .from('patients')
  .select('*, patient_penjamin(penjamin(nama))')
  .or(`nrm.ilike.%${search}%,nama.ilike.%${search}%,nik.ilike.%${search}%`);

// Validasi kuota
const poliQuota = await supabase.rpc('check_poli_quota', { p_poli_id });

// Insert visit dan update antrian
const { data: visit } = await supabase.from('visits').insert(visitData);
await supabase.from('queue_tickets').update({ status: 'completed' });
```

### Penjelasan Kode
Kode ini berfungsi untuk mencari data pasien dan mendaftarkan kunjungan baru. Pencarian bisa dilakukan menggunakan NRM, nama, atau NIK pasien untuk fleksibilitas. Sebelum menyimpan data kunjungan, sistem akan mengecek apakah kuota poli masih tersedia, kemudian menyimpan data dan mengubah status antrian menjadi selesai.

### Screenshot UI
**📸 Gambar 5.5a** - Popup Cari Data Pasien  
**📸 Gambar 5.5b** - Popup Data Pasien Ditemukan  
**📸 Gambar 5.5c** - Popup Tambah Kunjungan Rawat Jalan Baru  
**📸 Gambar 5.5d** - Bukti Pendaftaran

### Penjelasan Gambar 5.5a
Gambar 5.5a menampilkan popup pencarian pasien yang digunakan petugas untuk mencari data pasien yang sudah pernah terdaftar di sistem sebelumnya. Interface menyediakan satu input field yang dapat menerima NRM, nama, atau NIK pasien sehingga pencarian menjadi lebih fleksibel. Petugas cukup mengetikkan salah satu kriteria pencarian dan sistem akan menampilkan hasil yang cocok. Popup juga dilengkapi tombol untuk membuat pasien baru jika data yang dicari tidak ditemukan di database.

### Penjelasan Gambar 5.5b
Gambar 5.5b menampilkan popup hasil pencarian yang menampilkan daftar pasien yang cocok dengan kriteria pencarian yang dimasukkan. Hasil ditampilkan dalam bentuk tabel dengan kolom NRM, nama lengkap, tanggal lahir, jenis kelamin, dan penjamin default yang terdaftar. Setiap baris hasil pencarian dilengkapi dengan tombol pilih yang dapat diklik petugas untuk memilih pasien yang akan didaftarkan. Interface memudahkan petugas dalam mengidentifikasi pasien yang tepat terutama jika ada beberapa pasien dengan nama yang mirip.

### Penjelasan Gambar 5.5c
Gambar 5.5c menampilkan popup form registrasi kunjungan rawat jalan yang digunakan untuk mendaftarkan pasien ke poli dan dokter tujuan. Form menyediakan dropdown pemilihan poliklinik dan dokter yang menampilkan informasi kuota tersisa hari ini sehingga petugas dapat memastikan kuota masih tersedia. Dropdown cara bayar otomatis terisi dengan penjamin default pasien namun masih bisa diubah jika pasien ingin menggunakan cara bayar yang berbeda. Interface juga menampilkan input keluhan pasien, harga layanan yang dihitung otomatis, dan informasi ini merupakan kunjungan ke berapa untuk pasien tersebut.

### Penjelasan Gambar 5.5d
Gambar 5.5d menampilkan bukti pendaftaran yang diberikan kepada pasien sebagai konfirmasi bahwa proses registrasi kunjungan telah berhasil dilakukan. Bukti menampilkan informasi lengkap seperti nomor registrasi, NRM pasien, nama lengkap, poliklinik tujuan, nama dokter, cara bayar yang digunakan, dan informasi penting lainnya. Interface menyediakan tombol cetak yang memungkinkan petugas mencetak bukti pendaftaran untuk diberikan kepada pasien. Bukti ini nantinya akan dibawa pasien sebagai referensi saat dipanggil untuk pemeriksaan di poli.

---

## 6. Implementasi Monitoring & Rekap Kunjungan (Admin)

### Deskripsi Fitur
Dashboard admin menyediakan fitur monitoring dan rekap kunjungan seluruh loket secara terpusat dengan berbagai opsi filter untuk memudahkan pencarian data. Filter yang tersedia mencakup rentang tanggal, poliklinik, dokter, penjamin, dan pencarian teks bebas untuk NRM atau nama pasien. Dashboard menampilkan statistik real-time yang menunjukkan total pasien terdaftar, selesai, dan menunggu dengan breakdown per loket untuk monitoring beban kerja. Fitur export ke Excel memungkinkan admin mengunduh data sesuai filter yang aktif untuk keperluan pelaporan dan analisis lebih lanjut.

### Cuplikan Kode
Berikut potongan kode untuk monitoring data dari semua loket:

**Kode Program 5.6** - Dashboard Admin dan Filter Data
```typescript
// Fetch data dari semua loket
const response = await fetch('/api/admin/loket/dashboard');
const result = await response.json();
setData(result.data);

// Fetch statistik per loket (1-5)
const statsResponse = await fetch('/api/admin/loket/stats');
const stats = await statsResponse.json();
// stats.per_loket = [{ loket_id: 1, count: 15 }, ...]

// Tampilkan per loket
{stats.per_loket?.map((loket) => (
  <Card>Loket {loket.loket_id}: {loket.count}</Card>
))}
```

### Penjelasan Kode
Kode ini mengambil data dari semua 5 loket secara terpusat. Fungsi pertama mengambil data kunjungan dari semua loket, sedangkan fungsi kedua mengambil statistik jumlah pasien per loket. Data statistik ditampilkan dalam card yang menunjukkan jumlah pasien di masing-masing loket 1 sampai 5.

### Screenshot UI
**📸 Gambar 5.6** - Halaman Admin Loket

### Penjelasan Gambar 5.6
Gambar 5.6 menampilkan halaman dashboard admin loket yang menjadi pusat monitoring dan rekap kunjungan untuk semua loket secara terpusat. Bagian atas halaman menampilkan card statistik yang menunjukkan total pasien terdaftar, selesai, dan menunggu dengan breakdown angka per loket untuk memudahkan monitoring beban kerja. Bagian tengah menyediakan filter lengkap berupa input tanggal dari-sampai, dropdown poli-dokter-penjamin, dan input pencarian untuk memfilter data sesuai kebutuhan analisis. Bagian bawah menampilkan tabel data kunjungan lengkap dengan kolom nomor registrasi, NRM, nama pasien, poli, dokter, cara bayar, dan status, dilengkapi tombol Export Excel untuk mengunduh data.

---

## 7. Implementasi Pengelolaan Data Pasien

### Deskripsi Fitur
Modul pengelolaan pasien menyediakan fitur CRUD (Create, Read, Update, Delete) lengkap untuk mengelola data master pasien dalam sistem. Halaman data pasien menampilkan daftar semua pasien yang terdaftar dengan fitur search dan pagination untuk memudahkan navigasi data dalam jumlah besar. Halaman tambah pasien menyediakan form lengkap dengan dropdown cascade untuk wilayah dan auto-generate NRM unik untuk setiap pasien baru. Halaman edit memungkinkan update data pasien existing seperti alamat atau penjamin, sedangkan halaman detail menampilkan informasi lengkap pasien termasuk riwayat kunjungan dalam format read-only.

### Cuplikan Kode
Berikut potongan kode untuk pengelolaan data pasien:

**Kode Program 5.7** - CRUD Data Pasien
```typescript
// Tampilkan daftar pasien
const { data: patients } = await supabase
  .from('patients')
  .select('*, patient_penjamin(penjamin(nama))')
  .range((page - 1) * 10, page * 10 - 1);

// Tambah pasien baru dengan NRM otomatis
const nrm = `${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString().slice(2,6)}`;
await supabase.from('patients').insert({ nrm, ...formData });

// Edit data pasien
await supabase.from('patients').update(formData).eq('id', patientId);
```

### Penjelasan Kode
Kode ini mengelola data pasien dengan tiga operasi utama. Untuk menampilkan data, sistem menggunakan pagination 10 data per halaman. Saat menambah pasien baru, sistem otomatis membuat NRM unik dengan format tanggal dan angka random. Untuk edit data, sistem mengupdate field yang diubah berdasarkan ID pasien.

### Screenshot UI
**📸 Gambar 5.7a** - Halaman Data Pasien  
**📸 Gambar 5.7b** - Halaman Tambah Pasien  
**📸 Gambar 5.7c** - Halaman Edit Pasien  
**📸 Gambar 5.7d** - Halaman Detail Pasien  
**📸 Gambar 5.7e** - Halaman Print Identitas Pasien

### Penjelasan Gambar 5.7a
Gambar 5.7a menampilkan halaman data pasien yang menampilkan daftar lengkap semua pasien yang pernah terdaftar di sistem rumah sakit. Tabel menampilkan kolom-kolom penting seperti NRM sebagai nomor identitas unik pasien, nama lengkap, tanggal lahir, jenis kelamin, alamat, dan penjamin default yang terdaftar. Interface dilengkapi dengan search box di bagian atas untuk mencari pasien berdasarkan nama atau NRM dengan cepat. Bagian bawah tabel terdapat pagination untuk navigasi data dan tombol tambah pasien baru untuk mendaftarkan pasien yang belum pernah terdaftar.

### Penjelasan Gambar 5.7b
Gambar 5.7b menampilkan halaman form tambah pasien yang digunakan untuk mendaftarkan pasien baru yang belum pernah terdaftar di sistem. Form terbagi dalam beberapa section yaitu data personal (nama, NIK, tanggal lahir, jenis kelamin), data penanggung jawab (nama dan nomor telepon), alamat lengkap dengan dropdown cascade, dan pemilihan penjamin default. Dropdown cascade untuk alamat memudahkan pengisian karena pilihan kota akan muncul setelah provinsi dipilih, begitu juga dengan kecamatan dan kelurahan. Interface dilengkapi validasi input untuk memastikan data yang dimasukkan lengkap dan sesuai format sebelum disimpan ke database.

### Penjelasan Gambar 5.7c
Gambar 5.7c menampilkan halaman edit pasien yang memungkinkan petugas untuk mengupdate data pasien yang sudah terdaftar di sistem jika terjadi perubahan. Form yang ditampilkan sama dengan form tambah pasien namun sudah terisi dengan data existing pasien sehingga petugas tinggal mengubah bagian yang perlu diupdate. Fitur ini berguna ketika pasien pindah alamat, ganti nomor telepon, atau mengubah penjamin default yang digunakan. Interface dilengkapi tombol simpan untuk menyimpan perubahan dan tombol batal untuk membatalkan edit dan kembali ke halaman sebelumnya.

### Penjelasan Gambar 5.7d
Gambar 5.7d menampilkan halaman detail pasien yang menampilkan informasi lengkap pasien dalam format read-only tanpa bisa diedit langsung. Halaman ini menampilkan semua data pasien mulai dari data personal, data penanggung jawab, alamat lengkap, penjamin yang terdaftar, hingga riwayat kunjungan pasien ke rumah sakit. Riwayat kunjungan ditampilkan dalam bentuk tabel yang menunjukkan tanggal kunjungan, poli tujuan, dokter yang menangani, dan status kunjungan. Interface menyediakan tombol edit untuk mengubah data pasien jika diperlukan dan tombol kembali untuk kembali ke halaman daftar pasien.

### Penjelasan Gambar 5.7e
Gambar 5.7e menampilkan halaman print identitas pasien yang digunakan untuk mencetak kartu identitas pasien yang berisi informasi penting. Kartu identitas menampilkan NRM, nama lengkap pasien, tanggal lahir, alamat, dan barcode untuk mempermudah scanning saat pendaftaran berikutnya. Format kartu dirancang dengan ukuran standar yang praktis untuk disimpan di dompet atau tas pasien. Interface menyediakan tombol print yang akan membuka dialog print browser untuk mencetak kartu identitas pada kertas khusus.

---

## Catatan Screenshot

### Daftar Screenshot yang Diperlukan (16 Gambar):
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
16. **Gambar 5.6e** - Halaman Print Identitas Pasien

### Tips Screenshot:
- Resolusi 1920x1080 atau 1366x768
- Crop bagian relevan saja
- Pastikan text jelas terbaca
- Gunakan light theme
- Screenshot saat ada data (tidak kosong)
- Untuk popup/modal, screenshot dengan background overlay
