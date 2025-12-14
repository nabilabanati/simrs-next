import { supabaseServer } from "@/lib/supabase/server";

export async function getPharmacyOrdersToday() {
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabaseServer
    .from("pharmacy_orders")
    .select("*, prescriptions(*, patients(*))")
    .gte("created_at", today)
    .lte("created_at", `${today}T23:59:59`);

  return data || [];
}
