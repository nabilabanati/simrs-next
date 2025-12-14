// pages/api/master/poli.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.LOKET, ROLES.DOKTER, ROLES.NURSE, ROLES.FARMASI, ROLES.KASIR];
const WRITE_ROLES = [ROLES.SUPERADMIN];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET - List all poli
  if (req.method === "GET") {
    const { data, error } = await supabaseServer
      .from("poli")
      .select("*")
      .order("nama", { ascending: true });
    if (error) return fail(res, error.message);
    return ok(res, data);
  }

  // POST - Create new poli
  if (req.method === "POST") {
    const { nama, kode, harga_daftar } = req.body;

    if (!nama || !harga_daftar) {
      return fail(res, "Nama dan harga_daftar required", 400);
    }

    const { data, error } = await supabaseServer
      .from("poli")
      .insert({ nama, kode, harga_daftar })
      .select()
      .single();

    if (error) return fail(res, error.message);
    return ok(res, data);
  }

  // PUT - Update poli
  if (req.method === "PUT") {
    const { id, nama, kode, harga_daftar } = req.body;

    if (!id) {
      return fail(res, "ID required", 400);
    }

    const { data, error } = await supabaseServer
      .from("poli")
      .update({ nama, kode, harga_daftar })
      .eq("id", id)
      .select()
      .single();

    if (error) return fail(res, error.message);
    return ok(res, data);
  }

  // DELETE - Delete poli (cascade will handle assignments)
  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      return fail(res, "ID required", 400);
    }

    const { error } = await supabaseServer
      .from("poli")
      .delete()
      .eq("id", id);

    if (error) return fail(res, error.message);
    return ok(res, { message: "Poli deleted successfully" });
  }

  return fail(res, "Method not allowed", 405);
}

export default withAuth(withRoles(WRITE_ROLES, handler));
