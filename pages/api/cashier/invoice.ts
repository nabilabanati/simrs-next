// pages/api/cashier/invoice.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.KASIR];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabaseServer
    .from("invoices")
    .select("*, visits( *, patients(*) )")
    .eq("paid", false);

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(ALLOWED, handler));
