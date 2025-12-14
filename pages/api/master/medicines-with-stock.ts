// pages/api/master/medicines-with-stock.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOKTER, ROLES.FARMASI];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { data, error } = await supabaseServer
        .from("medicines")
        .select(`
      *,
      medicine_stock (qty, lokasi)
    `);

    if (error) return fail(res, error.message);

    // Calculate total stock for each medicine
    const withStock = (data || []).map((medicine: any) => {
        const totalStock = (medicine.medicine_stock || []).reduce(
            (sum: number, stock: any) => sum + (stock.qty || 0),
            0
        );
        return {
            ...medicine,
            total_stock: totalStock,
        };
    });

    // Filter only medicines with stock > 0
    const availableMedicines = withStock.filter((m: any) => m.total_stock > 0);

    return ok(res, availableMedicines);
}

export default withAuth(withRoles(READ_ROLES, handler));
