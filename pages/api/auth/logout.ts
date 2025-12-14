// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { ok } from "@/lib/api/respond";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clear HTTP-only cookie
  res.setHeader(
    "Set-Cookie",
    "token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
  );

  // For JWT stateless logout: simply let FE remove token.
  return ok(res, { message: "Logged out" });
}

export default withAuth(handler);
