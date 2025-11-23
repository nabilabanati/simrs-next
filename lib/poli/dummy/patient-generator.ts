import { PATIENTS_DATA } from "./patients"
import { generateQueueNumber, generateRegistration } from "@/lib/shared/utils"
import type { PatientVisit } from "@/lib/shared/types"

export function generateVisit(poliSlug: string, pasienIds: string[]): PatientVisit[] {
  return pasienIds.map((id, index) => {
    const base = PATIENTS_DATA.find((p) => p.id === id)!
    const noAntrian = generateQueueNumber(index + 1)

    return {
      idPasien: base.id,
      nrm: base.nrm,
      nama: base.nama,
      jenisKelamin: base.jenisKelamin,
      noAntrian,
      noRegistrasi: generateRegistration(poliSlug.toUpperCase().slice(0, 2), noAntrian),
      tanggalKunjungan: new Date().toISOString(),
      poli: poliSlug,
      status: "waiting",
    }
  })
}
