import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { ok, fail } from "@/lib/api/respond";
import { supabaseServer } from "@/lib/supabase/server";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return fail(res, "Method not allowed", 405);

  const medicine_id = req.query.medicine_id as string;

  if (!medicine_id) {
    return fail(res, "medicine_id is required", 400);
  }

  const { data, error } = await supabaseServer
    .from("medicine_stock")
    .select("medicine_id, lokasi, qty, updated_at")
    .eq("medicine_id", medicine_id);

  if (error) return fail(res, error.message, 500);

  return ok(res, data ?? []);
}

export default withAuth(
  withRoles([ROLES.DOKTER, ROLES.FARMASI, ROLES.SUPERADMIN], handler)
);
