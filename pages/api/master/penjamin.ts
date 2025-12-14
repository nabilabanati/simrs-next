// pages/api/master/penjamin.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET, ROLES.KASIR];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabaseServer.from("penjamin").select("*");
  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
