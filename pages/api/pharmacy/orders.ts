// pages/api/pharmacy/orders.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.FARMASI];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabaseServer
    .from("pharmacy_orders")
    .select("*, prescriptions(*, prescription_items(*))")
    .order("created_at", { ascending: true });

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(ALLOWED, handler));
