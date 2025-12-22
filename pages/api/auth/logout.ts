// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { ok } from "@/lib/api/respond";
import { supabaseServer } from "@/lib/supabase/server";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = (req as any).user;

  // Invalidate session in database if sessionId exists
  if (user?.sessionId) {
    await supabaseServer
      .from('sessions')
      .update({ is_active: false })
      .eq('id', user.sessionId);
  }

  // Clear HTTP-only cookie
  res.setHeader(
    "Set-Cookie",
    "token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
  );

  return ok(res, { message: "Logged out successfully" });
}

export default withAuth(handler);
