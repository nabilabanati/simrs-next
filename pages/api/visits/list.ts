// pages/api/visit/list.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET, ROLES.DOKTER, ROLES.NURSE];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const poli_id = (req.query.poli_id as string) || null;
  const dokter_id = (req.query.dokter_id as string) || null;
  const today = (req.query.tanggal as string) || null;

  let q = supabaseServer.from("visits").select("*, patients(*), poli(*), doctors(*)");

  if (poli_id) q = q.eq("poli_id", poli_id);
  if (dokter_id) q = q.eq("dokter_id", dokter_id);
  if (today) q = q.gte("created_at", `${today}T00:00:00`).lte("created_at", `${today}T23:59:59`);

  const { data, error } = await q.order("created_at", { ascending: true });
  if (error) return fail(res, error.message);
  return ok(res, data);
}

export default withAuth(withRoles(READ_ROLES, handler));
