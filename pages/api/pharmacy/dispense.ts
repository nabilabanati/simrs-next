// pages/api/pharmacy/dispense.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.FARMASI];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);
  const { prescription_id, status } = req.body ?? {};
  if (!prescription_id || !status) return fail(res, "prescription_id & status required", 400);

  const { error } = await supabaseServer
    .from("prescriptions")
    .update({ status })
    .eq("id", prescription_id);

  if (error) return fail(res, error.message);
  return ok(res, { ok: true });
}

export default withAuth(withRoles(ALLOWED, handler));
