// pages/api/medical-records/history.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOKTER];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const patient_id = (req.query.patient_id as string) || null;
  if (!patient_id) return fail(res, "patient_id required", 400);

  const { data, error } = await supabaseServer
    .from("visits")
    .select("*, medical_records(*)")
    .eq("patient_id", patient_id);

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
