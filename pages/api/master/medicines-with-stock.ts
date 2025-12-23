// pages/api/master/medicines-with-stock.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

const READ_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DOKTER, ROLES.FARMASI];

async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { data, error } = await supabaseServer
            .from("medicines")
            .select(`
          *,
          medicine_stock (qty, lokasi)
        `);

        if (error) {
            console.error("Error fetching medicines:", error);
            return fail(res, error.message);
        }

        console.log("Fetched medicines:", data?.length || 0);

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

        // Return ALL medicines (including those with 0 stock)
        // Doctor can still prescribe even if stock is 0 (will be noted in pharmacy)
        console.log("Medicines with stock calculated:", withStock.length);

        return ok(res, withStock);
    } catch (error: any) {
        console.error("Unexpected error in medicines-with-stock:", error);
        return fail(res, error.message || "Internal server error");
    }
}

export default withAuth(withRoles(READ_ROLES, handler));
