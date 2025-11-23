import { OBAT_LIST } from "@/lib/farmasi/dummy/obat"
import type { Resep } from "@/lib/shared/types"

export function hitungTotal(res: Resep) {
  return res.obat.reduce((sum, item) => {
    const obat = OBAT_LIST.find(o => o.id === item.id)
    return sum + (item.jumlah * (obat?.harga || 0))
  }, 0)
}
