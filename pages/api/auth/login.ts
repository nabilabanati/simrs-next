// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api/respond";
import { signToken } from "@/lib/auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const { username, password } = req.body ?? {};

  if (!username || !password) return fail(res, "username & password required", 400);

  console.log("🔍 Login attempt:", { username });

  const { data: user, error } = await supabaseServer
    .from("users")
    .select("id, username, nama, role, password, is_active")
    .eq("username", username)
    .single();

  console.log("User query result:", {
    found: !!user,
    error: error?.message,
    username: user?.username,
    role: user?.role,
    is_active: user?.is_active,
    hasPassword: !!user?.password
  });

  if (error || !user) {
    console.log("❌ User not found or query error");
    return fail(res, "Invalid credentials", 401);
  }

  // Check if account is active
  if (user.is_active === false) {
    console.log("❌ Account is inactive");
    return fail(res, "Account is inactive. Please contact administrator.", 403);
  }

  // PROTOTYPE: Simple password comparison (plain text)
  console.log("🔐 Comparing passwords...");
  const isPasswordValid = password === user.password;
  console.log("🔐 Password valid:", isPasswordValid);

  if (!isPasswordValid) {
    console.log("❌ Invalid password");
    return fail(res, "Invalid credentials", 401);
  }

  console.log("✅ Login successful");

  const payload = {
    id: user.id,
    role: user.role,
    username: user.username,
    nama: user.nama,
  };

  const token = signToken(payload);

  // Set HTTP-only cookie for middleware authentication
  res.setHeader(
    "Set-Cookie",
    `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
  );

  // avoid sending password back
  delete (user as any).password;

  return ok(res, { token, user: { id: user.id, username: user.username, nama: user.nama, role: user.role } });
}
