import type { NextApiRequest, NextApiResponse } from "next";
import { fail } from "./respond";

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  LOKET: "loket",
  DOKTER: "dokter",
  NURSE: "nurse",
  FARMASI: "farmasi",
  KASIR: "kasir",
};

export function withRole(role: string, handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = (req as any).user;

    if (!user || user.role !== role) {
      return fail(res, "Forbidden — insufficient role", 403);
    }

    return handler(req, res);
  };
}

export function withRoles(roles: string[], handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = (req as any).user;

    if (!user || !roles.includes(user.role)) {
      return fail(res, "Forbidden — role not allowed", 403);
    }

    return handler(req, res);
  };
}
