// pages/api/queue/reset.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);
  const { loket } = req.body ?? {};
  if (!loket) return fail(res, "loket required", 400);

  const { error } = await supabaseServer
    .from("queue_counters")
    .update({ current_queue: 0, updated_at: new Date().toISOString() })
    .eq("loket_nama", loket);

  if (error) return fail(res, error.message);
  return ok(res, { ok: true });
}

export default withAuth(withRoles(ALLOWED, handler));
