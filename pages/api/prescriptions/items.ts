// pages/api/prescriptions/items.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.FARMASI, ROLES.DOKTER];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prescription_id = (req.query.prescription_id as string) || null;
  if (!prescription_id) return fail(res, "prescription_id required", 400);

  const { data, error } = await supabaseServer
    .from("prescription_items")
    .select("*, medicines(*)")
    .eq("prescription_id", prescription_id);

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(ALLOWED, handler));
