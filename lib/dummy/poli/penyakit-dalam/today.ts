
import type { PatientVisit } from "@/lib/shared/types/visit"

export const TODAY_PD_VISITS: PatientVisit[] = [
  {
    idPasien: "2",
    nrm: "000002",
    nama: "Muhammad Fadhlan",
    jenisKelamin: "L",

    noAntrian: "003",
    noRegistrasi: "PD-28072025-003",
    tanggalKunjungan: "2025-07-28",

    poli: "penyakit-dalam",
    status: "waiting",
  },
  {
    idPasien: "3",
    nrm: "000006",
    nama: "Rina Marliana",
    jenisKelamin: "P",

    noAntrian: "002",
    noRegistrasi: "PD-28072025-002",
    tanggalKunjungan: "2025-07-28",

    poli: "penyakit-dalam",
    status: "completed",
  },
]
