// pages/api/master/medicines.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOKTER, ROLES.FARMASI, ROLES.KASIR];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabaseServer.from("medicines").select("*");
  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
