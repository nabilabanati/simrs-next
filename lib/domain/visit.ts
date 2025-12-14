import { supabaseServer } from "@/lib/supabase/server";
import { Visit } from "@/lib/types";

export async function getVisitsTodayByDoctor(dokterId: string): Promise<Visit[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabaseServer
    .from("visits")
    .select("*, patients(*)")
    .eq("dokter_id", dokterId)
    .gte("created_at", today)
    .lte("created_at", `${today}T23:59:59`)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getVisitsTodayByPoli(poliId: string): Promise<Visit[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabaseServer
    .from("visits")
    .select("*, patients(*)")
    .eq("poli_id", poliId)
    .gte("created_at", today)
    .lte("created_at", `${today}T23:59:59`)
    .order("created_at", { ascending: true });

  return data || [];
}

export async function createVisit(payload: Partial<Visit>) {
  const { data, error } = await supabaseServer
    .from("visits")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVisitStatus(id: string, status: string) {
  const { data, error } = await supabaseServer
    .from("visits")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
