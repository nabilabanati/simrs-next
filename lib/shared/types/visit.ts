export interface PatientVisit {
  idPasien: string
  nrm: string
  nama: string
  jenisKelamin: "L" | "P"

  noAntrian: string
  noRegistrasi: string
  tanggalKunjungan: string

  poli: string
  status: "waiting" | "completed"
}
