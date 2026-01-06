import type { NextApiRequest, NextApiResponse } from "next";
import * as jwt from "jsonwebtoken";
import { fail } from "./respond";
import { supabaseServer } from "@/lib/supabase/server";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function withAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Try to get token from cookie first (new method)
    let token = req.cookies.token;

    // Fallback to Authorization header (old method for backward compatibility)
    if (!token) {
      const bearer = req.headers.authorization;
      token = bearer?.split(" ")[1];
    }

    if (!token) {
      return fail(res, "Unauthorized", 401);
    }

    try {
      const decoded = jwt.verify(token, SECRET) as any;

      // === SINGLE SESSION ENFORCEMENT ===
      // Check if session is still active in database
      if (decoded.sessionId) {
        const { data: session, error } = await supabaseServer
          .from('sessions')
          .select('is_active, expires_at')
          .eq('id', decoded.sessionId)
          .single();

        if (error || !session) {
          return fail(res, "Session not found. Please login again.", 401);
        }

        if (!session.is_active) {
          return fail(res, "Session has been terminated. Please login again.", 401);
        }

        // Check if session expired
        if (new Date(session.expires_at) < new Date()) {
          // Mark session as inactive
          await supabaseServer
            .from('sessions')
            .update({ is_active: false })
            .eq('id', decoded.sessionId);

          return fail(res, "Session expired. Please login again.", 401);
        }
      }

      // inject user dari JWT
      (req as any).user = decoded;

      return handler(req, res);
    } catch (err) {
      return fail(res, "Invalid or expired token", 401);
    }
  };
}
