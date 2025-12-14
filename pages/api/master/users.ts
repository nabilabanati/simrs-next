// pages/api/master/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];
const WRITE_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabaseServer.from("users").select("id, username, nama, role, created_at");
    if (error) return fail(res, error.message);
    return ok(res, data);
  }

  if (req.method === "POST") {
    const payload = req.body ?? {};
    const { data, error } = await supabaseServer.from("users").insert(payload).select().single();
    if (error) return fail(res, error.message);
    return ok(res, data);
  }

  return fail(res, "Method not allowed", 405);
}

export default withAuth(withRoles(WRITE_ROLES, handler));
