export interface Patient {
  id: string;
  nrm: string;
  nik?: string;
  nama: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  pekerjaan?: string;
  golongan_darah?: string;

  penanggung_jawab?: string;
  nama_pj?: string;
  pekerjaan_pj?: string;
  no_telp_pj?: string;

  alamat?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  kode_pos?: string;

  catatan_khusus?: string;
  created_at?: string;
}
