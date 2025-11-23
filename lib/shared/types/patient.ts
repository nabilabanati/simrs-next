export interface PatientData {
  id: string
  nrm: string
  nama: string
  nik: string
  tanggalLahir: string
  tempatLahir: string
  jenisKelamin: "L" | "P"
  golonganDarah?: string
  agama?: string
  pendidikan?: string

  alamat: string
  pekerjaan: string
  statusNikah: string

  alergi?: string
  catatanKhusus?: string

  penjamin: string
  nama_instansi?: string
  nomor_surat?: string
  noBPJS?: string
  kelasBPJS?: string

  penanggungJawab: string
  namaPJ: string
  pekerjaanPJ?: string
  noTelpPJ?: string

  tanggalTerdaftar: string
  status: "Aktif" | "Nonaktif"

  asalRujukan?: string
  noRujukan?: string

  kunjunganTerakhir?: string
  layananTerakhir?: string
}
