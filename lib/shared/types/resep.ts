export interface ResepItem {
  id: string
  namaObat: string
  jumlah: number
  aturanPakai: string
}

export interface Resep {
  id: string
  idPasien: string
  nrm: string
  nama: string
  tanggal: string
  poli: string
  obat: ResepItem[]
  status: "pending" | "done"
}
