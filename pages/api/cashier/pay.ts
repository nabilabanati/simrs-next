// pages/api/cashier/pay.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.KASIR];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const { invoice_id } = req.body ?? {};
  if (!invoice_id) return fail(res, "invoice_id required", 400);

  // Check if invoice exists
  const { data: invoice, error: fetchError } = await supabaseServer
    .from("invoices")
    .select("*")
    .eq("id", invoice_id)
    .single();

  if (fetchError || !invoice) {
    return fail(res, "Invoice not found", 404);
  }

  // Check if already paid
  if (invoice.paid) {
    return fail(res, "Invoice has already been paid", 400);
  }

  // Process payment
  const { error } = await supabaseServer
    .from("invoices")
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq("id", invoice_id);

  if (error) return fail(res, error.message);

  return ok(res, {
    ok: true,
    message: "Payment processed successfully",
    invoice: { ...invoice, paid: true, paid_at: new Date().toISOString() }
  });
}

export default withAuth(withRoles(ALLOWED, handler));
