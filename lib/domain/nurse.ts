import { supabaseServer } from "@/lib/supabase/server";

export async function getNurses() {
  const { data } = await supabaseServer.from("nurses").select("*");
  return data || [];
}

export async function getNursesByPoli(poliId: string) {
  const { data } = await supabaseServer
    .from("nurse_poli")
    .select("*, nurses(*)")
    .eq("poli_id", poliId);

  return data?.map((n) => n.nurses) || [];
}
