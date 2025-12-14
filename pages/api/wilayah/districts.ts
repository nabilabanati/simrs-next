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
  if (!code) return fail(res, "City code is required", 400);

  try {
    const response = await fetch(`https://wilayah.id/api/districts/${code}.json`);
    if (!response.ok) return fail(res, "Failed to fetch districts", 500);

    const result = await response.json();

    const districts = Object.entries(result.data ?? {}).map(([code, name]) => ({
      code,
      name,
    }));

    return ok(res, districts);
  } catch (err) {
    console.error("Error fetching districts:", err);
    return fail(res, "Failed to fetch districts", 500);
  }
}

export default withAuth(withRoles(ROLES_ALLOWED, handler));
