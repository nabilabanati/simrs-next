// pages/api/queue/current.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const ALLOWED = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const loket = (req.query.loket as string) || null;
  if (!loket) return fail(res, "loket required", 400);

  const { data, error } = await supabaseServer
    .from("queue_counters")
    .select("*")
    .eq("loket_nama", loket)
    .single();

  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(ALLOWED, handler));
