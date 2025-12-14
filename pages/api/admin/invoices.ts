// pages/api/admin/invoices.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const paid = req.query.paid as string | undefined;
    const date_from = req.query.date_from as string | undefined;
    const date_to = req.query.date_to as string | undefined;

    let query = supabaseServer
        .from("invoices")
        .select(`
      *,
      visits (
        id,
        no_reg,
        created_at,
        patients (
          id,
          nrm,
          nama,
          nik
        ),
        poli (
          id,
          nama,
          kode
        )
      )
    `)
        .order("created_at", { ascending: false });

    // Filter by paid status
    if (paid === "true") {
        query = query.eq("paid", true);
    } else if (paid === "false") {
        query = query.eq("paid", false);
    }

    // Filter by date range
    if (date_from) {
        query = query.gte("created_at", `${date_from}T00:00:00`);
    }
    if (date_to) {
        query = query.lte("created_at", `${date_to}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) return fail(res, error.message);
    return ok(res, data);
}

export default withAuth(withRoles([ROLES.SUPERADMIN, ROLES.KASIR], handler));
