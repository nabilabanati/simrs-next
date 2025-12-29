// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api/respond";
import { signToken } from "@/lib/auth/jwt";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { rateLimiter } from "@/lib/rate-limiter";

/**
 * Get client IP address from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.socket.remoteAddress || 'unknown';
  return ip;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return fail(res, "Method not allowed", 405);

  const { username, password } = req.body ?? {};

  if (!username || !password) return fail(res, "username & password required", 400);

  // Get client IP for rate limiting
  const clientIP = getClientIP(req);

  // Check rate limit BEFORE querying database
  const rateCheck = rateLimiter.check(clientIP, username);

  if (!rateCheck.allowed) {
    console.log(`🚫 Rate limit exceeded for ${username} from ${clientIP}`);
    return fail(res, rateCheck.message || "Too many login attempts", 429);
  }

  console.log(`🔍 Login attempt: ${username} from ${clientIP} (${rateCheck.remainingAttempts} attempts remaining)`);

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
    // Record failed attempt
    rateLimiter.recordFailure(clientIP, username);
    const remaining = rateLimiter.check(clientIP, username).remainingAttempts || 0;
    const message = remaining > 0
      ? `Invalid credentials. ${remaining} attempts remaining.`
      : "Invalid credentials";
    return fail(res, message, 401);
  }

  // Check if account is active
  if (user.is_active === false) {
    console.log("❌ Account is inactive");
    return fail(res, "Account is inactive. Please contact administrator.", 403);
  }

  // CRITICAL FIX: Record attempt BEFORE password check
  // This prevents bypass by entering correct password after failed attempts
  rateLimiter.recordFailure(clientIP, username);

  // Check AGAIN after recording - if now exceeded, block immediately
  const recheckAfterRecord = rateLimiter.check(clientIP, username);
  if (!recheckAfterRecord.allowed) {
    console.log(`🚫 Rate limit exceeded after recording attempt for ${username} from ${clientIP}`);
    return fail(res, recheckAfterRecord.message || "Too many login attempts", 429);
  }

  // Secure password comparison using bcrypt
  console.log("🔐 Verifying password with bcrypt...");
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log("🔐 Password valid:", isPasswordValid);

  if (!isPasswordValid) {
    console.log("❌ Invalid password");
    // Record failed attempt
    rateLimiter.recordFailure(clientIP, username);
    const remaining = rateLimiter.check(clientIP, username).remainingAttempts || 0;
    const message = remaining > 0
      ? `Invalid credentials. ${remaining} attempts remaining.`
      : "Invalid credentials";
    return fail(res, message, 401);
  }

  // Password is correct - reset rate limiter
  console.log("✅ Login successful - resetting rate limiter");
  rateLimiter.reset(clientIP, username);

  // === SESSION MANAGEMENT ===
  // 1. Invalidate all existing active sessions for this user (single session enforcement)
  const { error: invalidateError } = await supabaseServer
    .from('sessions')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (invalidateError) {
    console.log("⚠️ Warning: Could not invalidate old sessions:", invalidateError.message);
  }

  // 2. Create new session
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 20 * 60 * 60 * 1000); // 20 hours from now

  const { data: session, error: sessionError } = await supabaseServer
    .from('sessions')
    .insert({
      user_id: user.id,
      session_token: sessionToken,
      device_info: req.headers['user-agent'] || 'Unknown',
      ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
      expires_at: expiresAt.toISOString(),
      is_active: true
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.log("❌ Failed to create session:", sessionError?.message);
    return fail(res, "Failed to create session", 500);
  }

  console.log("✅ Session created:", session.id);

  // 3. Create JWT with session ID
  const payload = {
    id: user.id,
    role: user.role,
    username: user.username,
    nama: user.nama,
    sessionId: session.id
  };

  const token = signToken(payload, "20h");

  // 4. Set HTTP-only cookie with 20-hour expiry
  const cookieMaxAge = 20 * 60 * 60; // 72000 seconds = 20 hours
  res.setHeader(
    "Set-Cookie",
    `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${cookieMaxAge}`
  );

  // avoid sending password back
  delete (user as any).password;

  return ok(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role
    },
    sessionExpiresAt: expiresAt.toISOString()
  });
}
