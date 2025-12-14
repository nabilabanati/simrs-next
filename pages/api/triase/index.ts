// pages/api/triase/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.DOKTER, ROLES.NURSE];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const visit_id = req.query.visit_id as string;

    if (!visit_id) {
        return fail(res, "visit_id required", 400);
    }

    const { data, error } = await supabaseServer
        .from("triase")
        .select(`
      *,
      nurses:perawat_id (
        users:user_id (nama)
      )
    `)
        .eq("visit_id", visit_id)
        .single();

    if (error) {
        // If no triase found, return null instead of error
        if (error.code === "PGRST116") {
            return ok(res, null);
        }
        return fail(res, error.message);
    }

    return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
