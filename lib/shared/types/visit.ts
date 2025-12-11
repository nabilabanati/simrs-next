export interface PatientVisit {
  id: string
  no_reg: string
  status: "menunggu" | "selesai"
  created_at: string

  patients: {
    nrm: string
    nama: string
    jk: string
  }

  poli?: {
    nama: string
  }
}
