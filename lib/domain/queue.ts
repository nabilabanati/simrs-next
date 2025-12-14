import { supabaseServer } from "@/lib/supabase/server";

export async function getQueue(loket: string) {
  const { data } = await supabaseServer
    .from("queue_counters")
    .select("*")
    .eq("loket_nama", loket)
    .single();

  return data;
}

export async function nextQueue(loket: string) {
  const { data, error } = await supabaseServer.rpc("increment_queue", {
    loket_name_input: loket,
  });

  if (error) throw error;
  return data;
}

export async function resetQueue(loket: string) {
  const { data, error } = await supabaseServer
    .from("queue_counters")
    .update({ current_queue: 0 })
    .eq("loket_nama", loket)
    .select()
    .single();

  if (error) throw error;
  return data;
}
