import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "@/lib/supabase/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Invalid patient ID' });
  }

  try {
    const { data, error } = await supabaseServer
      .from('visits')
      .select(`
        *,
        poli (nama),
        doctors (
            users:user_id (nama)
        ),
        penjamin (nama)
      `)
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching patient visits:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
