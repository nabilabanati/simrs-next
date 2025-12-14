// pages/api/auth/refresh.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { ok } from "@/lib/api/respond";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Optionally, you can re-issue token with same payload.
  const user = (req as any).user;
  // if you want new token, import signToken from jwt and return a new token.
  return ok(res, { user });
}

export default withAuth(handler);
