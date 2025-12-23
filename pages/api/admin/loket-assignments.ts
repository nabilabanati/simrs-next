// pages/api/admin/loket-assignments.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = (req as any).user;

    // Only superadmin and admin_loket can manage assignments
    if (!["superadmin", "admin_loket"].includes(user.role)) {
        return fail(res, "Unauthorized", 403);
    }

    // GET - List all assignments
    if (req.method === "GET") {
        const { data, error } = await supabaseServer
            .from("user_loket_assignment")
            .select(`
                id,
                loket_id,
                created_at,
                users:user_id (
                    id,
                    username,
                    nama,
                    role
                )
            `)
            .order("created_at", { ascending: false });

        if (error) return fail(res, error.message);
        return ok(res, data);
    }

    // POST - Create new assignment
    if (req.method === "POST") {
        const { user_id, loket_id } = req.body;

        if (!user_id || !loket_id) {
            return fail(res, "user_id and loket_id are required", 400);
        }

        if (loket_id < 1 || loket_id > 5) {
            return fail(res, "loket_id must be between 1 and 5", 400);
        }

        // Check if user exists and has role 'loket'
        const { data: targetUser, error: userError } = await supabaseServer
            .from("users")
            .select("id, role")
            .eq("id", user_id)
            .single();

        if (userError || !targetUser) {
            return fail(res, "User not found", 404);
        }

        if (targetUser.role !== "loket") {
            return fail(res, "Can only assign users with role 'loket'", 400);
        }

        // Create assignment
        const { data, error } = await supabaseServer
            .from("user_loket_assignment")
            .insert({
                user_id,
                loket_id,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return fail(res, "User already assigned to this loket", 409);
            }
            return fail(res, error.message);
        }

        return ok(res, data);
    }

    // DELETE - Remove assignment
    if (req.method === "DELETE") {
        const { id } = req.query;

        if (!id || typeof id !== "string") {
            return fail(res, "Assignment ID required", 400);
        }

        const { error } = await supabaseServer
            .from("user_loket_assignment")
            .delete()
            .eq("id", id);

        if (error) return fail(res, error.message);

        return ok(res, { message: "Assignment deleted successfully" });
    }

    return fail(res, "Method not allowed", 405);
}

export default withAuth(handler);
