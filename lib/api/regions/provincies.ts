import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await fetch("https://wilayah.id/api/provinces.json");
    const json = await response.json();

    return res.status(200).json(json.data || []);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
}
