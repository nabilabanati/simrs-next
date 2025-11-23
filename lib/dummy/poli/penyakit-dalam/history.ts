// lib/dummy/poli/penyakit-dalam/history.ts

import type { PatientVisit } from "@/lib/shared/types/visit"

export const HISTORY_PD_VISITS: PatientVisit[] = [
  {
    idPasien: "1",
    nrm: "000001",
    nama: "Hana Qurratu A'yun",
    jenisKelamin: "P",

    noAntrian: "010",
    noRegistrasi: "PD-15072025-010",
    tanggalKunjungan: "2025-07-15",

    poli: "penyakit-dalam",
    status: "completed",
  },
]
