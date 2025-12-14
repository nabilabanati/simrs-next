// pages/api/master/doctors.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET, ROLES.DOKTER, ROLES.FARMASI];
const WRITE_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const poliId = (req.query.poli_id as string) || null;

  let q = supabaseServer
    .from("doctors")
    .select("id, user_id, spesialis, sip, created_at");

  if (poliId) {
    // join doctor_poli relation: simple filter by doctor_poli
    const { data, error } = await supabaseServer
      .from("doctor_poli")
      .select("dokter_id")
      .eq("poli_id", poliId);

    if (error) return fail(res, error.message);
    const dokterIds = (data || []).map((r: any) => r.dokter_id);
    q = q.in("id", dokterIds.length ? dokterIds : ["-"]);
  }

  const { data, error } = await q;
  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
