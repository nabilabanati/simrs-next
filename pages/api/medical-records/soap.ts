// pages/api/medical-records/soap.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOKTER];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const payload = req.body ?? {};
  // ensure created_by from token if not provided
  const user = (req as any).user;
  if (!payload.created_by) payload.created_by = user.id;

  const { data, error } = await supabaseServer
    .from("medical_records")
    .insert(payload)
    .select()
    .single();

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(ALLOWED, handler));
