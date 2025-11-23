import type { Resep } from "@/lib/shared/types"

export const RESEP_LIST: Resep[] = [
  {
    id: "r1",
    idPasien: "1",
    nrm: "000001",
    nama: "Hana Qurratu A'yun",
    tanggal: "2025-07-28",
    poli: "penyakit-dalam",
    status: "pending",
    obat: [
      { id: "o1", namaObat: "Paracetamol", jumlah: 10, aturanPakai: "3x sehari" },
    ],
  },
]
