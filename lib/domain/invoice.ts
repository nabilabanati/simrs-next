import { supabaseServer } from "@/lib/supabase/server";

export async function getInvoiceByVisit(visitId: string) {
  const { data } = await supabaseServer
    .from("invoices")
    .select("*, visits(*, patients(*))")
    .eq("visit_id", visitId)
    .single();

  return data;
}

export async function payInvoice(id: string) {
  const { data, error } = await supabaseServer
    .from("invoices")
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
