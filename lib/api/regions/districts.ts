import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { regency_id } = req.query;

  if (!regency_id) {
    return res.status(400).json({ error: "regency_id is required" });
  }

  try {
    const response = await fetch(
      `https://wilayah.id/api/districts/${regency_id}.json`
    );
    const json = await response.json();

    return res.status(200).json(json.data || []);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
}
