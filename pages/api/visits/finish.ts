// pages/api/visit/finish.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOKTER];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const { visit_id } = req.body ?? {};
  if (!visit_id) return fail(res, "visit_id required", 400);

  const { error } = await supabaseServer.from("visits").update({ status: "selesai" }).eq("id", visit_id);
  if (error) return fail(res, error.message);

  return ok(res, { ok: true });
}

export default withAuth(withRoles(ALLOWED, handler));
