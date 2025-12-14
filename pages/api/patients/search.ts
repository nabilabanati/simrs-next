// pages/api/patients/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyword = (req.query.keyword as string) || "";
  const { data, error } = await supabaseServer
    .from("patients")
    .select("*")
    .or(`nrm.ilike.%${keyword}%,nama.ilike.%${keyword}%,nik.ilike.%${keyword}%`)
    .limit(50);

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
