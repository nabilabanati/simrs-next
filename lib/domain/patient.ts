import { supabaseServer } from "@/lib/supabase/server";
import { Patient } from "@/lib/types";

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data } = await supabaseServer
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}

export async function searchPatients(keyword: string): Promise<Patient[]> {
  const { data } = await supabaseServer
    .from("patients")
    .select("*")
    .or(`nrm.ilike.%${keyword}%,nama.ilike.%${keyword}%,nik.ilike.%${keyword}%`)
    .limit(20);

  return data || [];
}

export async function createPatient(payload: Partial<Patient>) {
  const { data, error } = await supabaseServer
    .from("patients")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}
