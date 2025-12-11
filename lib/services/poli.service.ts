import { supabase } from "@/lib/supabase"

export async function getPoliByDokter(dokterId: string) {
  const { data, error } = await supabase
    .from("dokter_poli")
    .select(`
      poli_id,
      poli:poli_id ( nama )
    `)
    .eq("dokter_id", dokterId)
    .limit(1)

  return { data, error }
}
