// pages/api/patients/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const CREATE_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const payload = req.body ?? {};
  const { data, error } = await supabaseServer.from("patients").insert(payload).select().single();
  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(CREATE_ROLES, handler));
