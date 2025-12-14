import { supabaseServer } from "@/lib/supabase/server";

export async function getDoctors() {
  const { data } = await supabaseServer.from("doctors").select("*");
  return data || [];
}

export async function getDoctorsByPoli(poliId: string) {
  const { data } = await supabaseServer
    .from("doctor_poli")
    .select("*, doctors(*)")
    .eq("poli_id", poliId);

  return data?.map((d) => d.doctors) || [];
}
