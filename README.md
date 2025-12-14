# SIMRS - Prototype
NextJs - no backend (ambil api dari Supabase)

## Alur SIMRS:
Super admin: liat data pasien secara keseluruhan, lihat kunjungan pasien semua poli maupun dokter (liat doang), liat data obat, liat data pemesanan obat ke farmasi 

Pasien: mengambil nomor antrian ke loket

Admin Loket: 
- Liat list pasien yg ada di db rs di dashboardnya. ada filtering sama pemanggilan nomor antrian di atasnya. nomor antrian itu kehubung sama panel antrian. klo semisal antriannya cuma sampe 15, ya dia ga bisa manggil lagi gitu. nah setiap dia next gitu, nanti ada 1 lagi yg ngedisplay udah sampe mana antriannya per loket.
- nanti di tabelnya itu ada dropdown action, mau liat detail pasien atau add kunjungan. klo add kunjungan nanti muncul modal pop up untuk tambah kunjungan. isinya nama pasiennya + nrm nya (disable, menyesuaikan ketika siapa yg di tambah), dropdown ke poli apa, dropdown dokternya siapa, trs pilih cara bayar. klo pilih umum, auto generate harga. aku blm ada referensi harga daftar klo umum. jadi dibuat 1 aja gitu otomatis. klo bpjs aku ga ada gambaran, skip dulu aja
- terus muncul struk aja, sebenernya mau auto print yah, tapi karena ga ada printernya jadi kaya nambilin bentuk struknya gini loh. nah abis itu auto ilang aja deh. nah terus tadi datanya masuk ke poli yg dia pilih. masuk ke nurse, trs masuk ke dokter yg dipilih (misal dokter a, ya masuk ke dokter a aja, dokter b ga bisa liat)

Perawat
- dia liat pasien yg masuk ke poli tersebut di hari tersebut aja, ngelakuin ttv, nanti status dan data ttv nya di kirim ke dokter
- klo udah selesai, otomatis langsung berubah statusnya jadi selesai, trs datanya pindah ke tabel paling akhir gitu

Dokter
- liat pasien yang masuk ke dia (berdasarkan pendaftaran)
- baru bisa melakukan aksi saat status ttv nya selesai.
- ketika klik aksi yg di dashboard, bakal diarahin ke page buat liat data pasien dan riwayat kunjungannya. nanti bisa klik button tambah pemeriksaan. sebelahnya ada tabel selesaikan kunjungan, tapi klo blm ngisi kunjungan hari itu dia disable
- bikin data pemeriksaan. masuk ke form. auto generate form yg isinya ttv dari perawat. terus dokter masukin aja form yg soap itu sama resep.
- pas nambah resep itu, dia cuma bisa milih obat sama stoknya sesuai yg dari farmasi. klo ga ada disitu, masukinnya di catatan
- ketika simpan kunjungan, data pemesanan resep itu juga masuk ke farmasi. 
- pas yg di halaman yg data pasien dan tabel riwayat kunjungan, yg awalnya button tambah kunjungan bisa di klik, dia klo udah ngisi jadi disable. trs yg selesaikan kunjungan dia jadi active. 
- dokter tapi masih bisa ngedit kunjungan hari itu klo masuk di halaman tsb, sebelum dia akhiri kunjungan
- dokter juga bisa liat kunjungan lain pasien tersebut karena ada tampil juga di tabel tersebut kan. cuma klo dia dari dokter lain dia ga bisa edit cuma liat. klo pun dokter itu yg ngelakuin, dia juga cuma bisa liat aja ga bisa edit. karena takutnya malah ada miss data klo bisa edit. 
- ketika di akhiri kunjungan, pasien tersebut yg awalnya ada di list pertama di tabel, pindah ke bawah sendiri.
- nanti juga dokter auto print struk kunjungan sama resepnya (resep untuk di kasih ke farmasi). struk kunjungan itu buat klo semisal dia umum, buat bayar ke kasir. walau pake bpjs dia juga tetep di print.
- klo udah ganti hari, otomatis isi tabel di dashboard itu kosong, ke ganti sama data pasien yg masuk di hari itu. nanti data pasien yg pernah masuk ke dokter poli tersebut bisa dilihat di page riwayat kunjungan.
- dokter bisa liat resep yg dia pesen ke farmasi. bisa liat statusnya juga. nanti ini statusnya bisa ganti tergantung farmasi

Farmasi
- menerima data resep dari dokter, nanti by nomor registrasi. trs nomor pesanan obat dia auto generate
- bisa nambah stok, harga, sama nama obat
- di dashboard itu isinya resep yg masuk di hari itu. cuma nanti kan ada filterin, dia tetep bisa cari resep dokter yg pernah masuk ke farmasi sebenernya (siapa tau blm ambil)
- nanti ketika klik tombol aksi, itu muncul pop up modal yg nunjukin pesanan obatnya apa. ada button batal sama print label. saat print label, dia otomatis print label perobat (berdasarkan template). nanti yg awalnya print jadi selesai. trs status obatnya ganti jadi sudah diambil. di dokter juga statusnya otomatis sudah diambil.

Kasir
- ini buat pembayaran obat dan kunjungan. ini dia bisa otomatis aja notalin hasil jumlah harga obat sama kunjungan (ini yg kunjungan langsung aja total harga pemeriksaan. kek klo dia di penyakit dalam, harganya banting langsung berapa per kunjungan, poli apa berapa.)
- Itu harga nya otomatis masuk aja kali yah berdasarkan nomor registrasi dia. itu otomatis harga kunjungan dokter sama harga obat.
- trs bayar, status otomatis ganti jadi sudah bayar. alur selesai


### Roling: Pake JWT, ga pake supabase auth
