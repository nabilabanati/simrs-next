import { supabase } from "@/lib/supabase"

export async function getTodayVisitsByPoli(poliId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select(`
      id,
      no_reg,
      status,
      patient_id,
      patients:patient_id (
        nrm,
        nama,
      )
    `)
    .eq("poli_id", poliId)
    .order("created_at", { ascending: true })

  return { data, error }
}
