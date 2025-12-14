import type { NextApiRequest, NextApiResponse } from "next";
import * as jwt from "jsonwebtoken";
import { fail } from "./respond";

const SECRET = process.env.JWT_SECRET || "dev-secret";

export function withAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const bearer = req.headers.authorization;
    const token = bearer?.split(" ")[1];

    if (!token) {
      return fail(res, "Unauthorized", 401);
    }

    try {
      const decoded = jwt.verify(token, SECRET) as any;

      // inject user dari JWT
      (req as any).user = decoded;

      return handler(req, res);
    } catch (err) {
      return fail(res, "Invalid or expired token", 401);
    }
  };
}
