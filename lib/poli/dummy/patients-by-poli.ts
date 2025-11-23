import { generateVisit } from "./patient-generator"

export const PATIENTS_BY_POLI = {
  "penyakit-dalam": generateVisit("penyakit-dalam", ["1"]),
  umum: generateVisit("umum", []),
  gigi: generateVisit("gigi", []),
  anak: generateVisit("anak", []),
}
