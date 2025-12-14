// pages/api/queue/next.ts
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

  // assume RPC next_queue exists; if not, use simple update
  try {
    const { data, error } = await supabaseServer.rpc("next_queue", { loket_input: loket });
    if (error) return fail(res, error.message);
    return ok(res, data);
  } catch (e: any) {
    // fallback: increment current_queue
    const { data: cur, error: e2 } = await supabaseServer
      .from("queue_counters")
      .select("*")
      .eq("loket_nama", loket)
      .single();
    if (e2) return fail(res, e2.message);

    const newNum = (cur.current_queue || 0) + 1;
    const { data: updated, error: e3 } = await supabaseServer
      .from("queue_counters")
      .update({ current_queue: newNum, updated_at: new Date().toISOString() })
      .eq("loket_nama", loket)
      .select()
      .single();

    if (e3) return fail(res, e3.message);
    return ok(res, updated);
  }
}

export default withAuth(withRoles(ALLOWED, handler));
