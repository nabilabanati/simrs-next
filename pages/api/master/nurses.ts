// pages/api/master/nurses.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET, ROLES.NURSE];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const poliId = (req.query.poli_id as string) || null;

  let q = supabaseServer.from("nurses").select("id, user_id, created_at");

  if (poliId) {
    const { data, error } = await supabaseServer
      .from("nurse_poli")
      .select("nurse_id")
      .eq("poli_id", poliId);

    if (error) return fail(res, error.message);
    const nurseIds = (data || []).map((r: any) => r.nurse_id);
    q = q.in("id", nurseIds.length ? nurseIds : ["-"]);
  }

  const { data, error } = await q;
  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
