import type { NextApiResponse } from "next";

export function ok(res: NextApiResponse, data: any, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

export function fail(res: NextApiResponse, message: string, status = 400) {
  return res.status(status).json({
    success: false,
    error: message,
  });
}
