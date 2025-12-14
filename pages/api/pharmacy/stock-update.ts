import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { ok, fail } from "@/lib/api/respond";
import { supabaseServer } from "@/lib/supabase/server";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const { medicine_id, lokasi, qty } = req.body;

  if (!medicine_id || !lokasi || qty === undefined) {
    return fail(res, "medicine_id, lokasi, and qty are required", 400);
  }

  const { error } = await supabaseServer
    .from("medicine_stock")
    .upsert(
      {
        medicine_id,
        lokasi,
        qty: Number(qty),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "medicine_id,lokasi" } // required for TS & supabase logic
    );

  if (error) return fail(res, error.message, 500);

  return ok(res, { message: "Stock updated successfully" });
}

export default withAuth(withRoles([ROLES.FARMASI, ROLES.SUPERADMIN], handler));
