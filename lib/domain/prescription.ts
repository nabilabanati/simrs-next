import { supabaseServer } from "@/lib/supabase/server";
import { Prescription, PrescriptionItem } from "@/lib/types";

export async function createPrescription(payload: Partial<Prescription>) {
  const { data, error } = await supabaseServer
    .from("prescriptions")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addPrescriptionItems(items: Partial<PrescriptionItem>[]) {
  const { data, error } = await supabaseServer
    .from("prescription_items")
    .insert(items)
    .select();

  if (error) throw error;
  return data;
}

export async function getPrescriptionItems(prescriptionId: string) {
  const { data } = await supabaseServer
    .from("prescription_items")
    .select("*, medicines(*)")
    .eq("prescription_id", prescriptionId);

  return data || [];
}

export async function updatePrescriptionStatus(id: string, status: string) {
  const { data, error } = await supabaseServer
    .from("prescriptions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
