import { supabaseServer } from "@/lib/supabase/server";

export async function findUserByUsername(username: string) {
  const { data, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) return null;
  return data;
}

export async function findUserById(id: string) {
  const { data } = await supabaseServer
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}
