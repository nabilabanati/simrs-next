import { POLI_LIST } from "../dummy/poli"

export function getPoliName(slug: string) {
  return POLI_LIST.find((p) => p.slug === slug)?.name || "-"
}
