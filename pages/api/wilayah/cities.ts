import type { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "@/lib/api/withAuth";
import { withRoles, ROLES } from "@/lib/api/role";
import { ok, fail } from "@/lib/api/respond";

const ROLES_ALLOWED = [
  ROLES.SUPERADMIN,
  ROLES.ADMIN,
  ROLES.LOKET,
  ROLES.DOKTER,
  ROLES.NURSE,
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return fail(res, "Method not allowed", 405);

  const code = req.query.code as string;
  if (!code) return fail(res, "Province code is required", 400);

  try {
    const response = await fetch(`https://wilayah.id/api/regencies/${code}.json`);
    if (!response.ok) return fail(res, "Failed to fetch cities", 500);

    const result = await response.json();

    const cities = Object.entries(result.data ?? {}).map(([code, name]) => ({
      code,
      name,
    }));

    return ok(res, cities);
  } catch (err) {
    console.error("Error fetching cities:", err);
    return fail(res, "Failed to fetch cities", 500);
  }
}

export default withAuth(withRoles(ROLES_ALLOWED, handler));
