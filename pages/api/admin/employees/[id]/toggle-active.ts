// pages/api/admin/employees/[id]/toggle-active.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRole, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PATCH") {
        return fail(res, "Method not allowed", 405);
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
        return fail(res, "Invalid employee ID");
    }

    // Get current user status
    const { data: user, error: getUserError } = await supabaseServer
        .from("users")
        .select("id, is_active, role")
        .eq("id", id)
        .single();

    if (getUserError || !user) {
        return fail(res, "Employee not found");
    }

    // Prevent superadmin from deactivating themselves
    const currentUser = (req as any).user;
    if (user.id === currentUser.userId) {
        return fail(res, "Cannot deactivate your own account");
    }

    // Prevent deactivating other superadmins
    if (user.role === ROLES.SUPERADMIN) {
        return fail(res, "Cannot deactivate other superadmin accounts");
    }

    // Toggle is_active status
    const newStatus = !user.is_active;

    const { data: updatedUser, error: updateError } = await supabaseServer
        .from("users")
        .update({ is_active: newStatus })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
        return fail(res, updateError.message);
    }

    return ok(res, {
        message: `Employee ${newStatus ? "activated" : "deactivated"} successfully`,
        user: updatedUser,
    });
}

export default withAuth(withRole(ROLES.SUPERADMIN, handler));
