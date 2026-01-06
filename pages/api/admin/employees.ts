// pages/api/admin/employees.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRole, ROLES } from "@/lib/api/role";
import { supabaseServer } from "@/lib/supabase/server";
import { ok, fail } from "@/lib/api/respond";
import bcrypt from "bcryptjs";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        return handleGet(req, res);
    } else if (req.method === "POST") {
        return handlePost(req, res);
    } else if (req.method === "PATCH") {
        return handlePatch(req, res);
    } else {
        return fail(res, "Method not allowed", 405);
    }
}

// GET /api/admin/employees
// List all employees with their role-specific data and poli assignments
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    const role = req.query.role as string | undefined;

    let query = supabaseServer
        .from("users")
        .select(`
      *,
      doctors (
        id,
        spesialis,
        sip,
        doctor_poli (
          poli_id,
          poli (id, nama, kode)
        )
      ),
      nurses (
        id,
        nurse_poli (
          poli_id,
          poli (id, nama, kode)
        )
      )
    `)
        .in("role", ["dokter", "nurse", "loket", "farmasi", "kasir"])
        .order("created_at", { ascending: false });

    if (role) {
        query = query.eq("role", role);
    }

    const { data, error } = await query;

    if (error) return fail(res, error.message);
    return ok(res, data);
}

// POST /api/admin/employees
// Create new employee (dokter, nurse, loket, farmasi, kasir)
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    const { username, password, nama, role, spesialis, sip, poli_ids } = req.body;

    // Validation
    if (!username || !password || !nama || !role) {
        return fail(res, "Missing required fields: username, password, nama, role", 400);
    }

    if (!["dokter", "nurse", "loket", "farmasi", "kasir"].includes(role)) {
        return fail(res, "Invalid role. Must be: dokter, nurse, loket, farmasi, or kasir", 400);
    }

    if (password.length < 6) {
        return fail(res, "Password must be at least 6 characters", 400);
    }

    // Check if username already exists
    const { data: existingUser } = await supabaseServer
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

    if (existingUser) {
        return fail(res, "Username already exists", 400);
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // 1. Insert into users table
        const { data: user, error: userError } = await supabaseServer
            .from("users")
            .insert({
                username,
                password: hashedPassword,
                nama,
                role,
                is_active: true,
            })
            .select()
            .single();

        if (userError) throw userError;

        // 2. Insert into doctors or nurses table if applicable
        if (role === "dokter") {
            const { data: doctor, error: doctorError } = await supabaseServer
                .from("doctors")
                .insert({
                    user_id: user.id,
                    spesialis: spesialis || null,
                    sip: sip || null,
                })
                .select()
                .single();

            if (doctorError) throw doctorError;

            // 3. Insert into doctor_poli if poli_ids provided
            if (poli_ids && Array.isArray(poli_ids) && poli_ids.length > 0) {
                const poliAssignments = poli_ids.map((poli_id: string) => ({
                    dokter_id: doctor.id,
                    poli_id,
                }));

                const { error: poliError } = await supabaseServer
                    .from("doctor_poli")
                    .insert(poliAssignments);

                if (poliError) throw poliError;
            }
        } else if (role === "nurse") {
            const { data: nurse, error: nurseError } = await supabaseServer
                .from("nurses")
                .insert({
                    user_id: user.id,
                })
                .select()
                .single();

            if (nurseError) throw nurseError;

            // 3. Insert into nurse_poli if poli_ids provided
            if (poli_ids && Array.isArray(poli_ids) && poli_ids.length > 0) {
                const poliAssignments = poli_ids.map((poli_id: string) => ({
                    nurse_id: nurse.id,
                    poli_id,
                }));

                const { error: poliError } = await supabaseServer
                    .from("nurse_poli")
                    .insert(poliAssignments);

                if (poliError) throw poliError;
            }
        }

        return ok(res, { message: "Employee created successfully", user });
    } catch (error: any) {
        return fail(res, error.message || "Failed to create employee");
    }
}

// PATCH /api/admin/employees
// Toggle employee active/inactive status
async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
    const { id, action } = req.body;

    if (!id) {
        return fail(res, "Employee ID is required", 400);
    }

    if (action !== "toggle-active") {
        return fail(res, "Invalid action. Use 'toggle-active'", 400);
    }

    // Get current user status
    const { data: user, error: getUserError } = await supabaseServer
        .from("users")
        .select("id, is_active, role")
        .eq("id", id)
        .single();

    if (getUserError || !user) {
        return fail(res, "Employee not found", 404);
    }

    // Prevent superadmin from deactivating themselves
    const currentUser = (req as any).user;
    if (user.id === currentUser.id) {
        return fail(res, "Cannot deactivate your own account", 403);
    }

    // Prevent deactivating other superadmins
    if (user.role === ROLES.SUPERADMIN) {
        return fail(res, "Cannot deactivate other superadmin accounts", 403);
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
