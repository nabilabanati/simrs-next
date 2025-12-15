import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loket_nama } = req.body;

    if (!loket_nama) {
      return res.status(400).json({ error: 'loket_nama is required' });
    }

    // Reset queue to 1
    const { data, error } = await supabaseServer
      .from('queue_counters')
      .update({
        current_queue: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('loket_nama', loket_nama)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      current_queue: data.current_queue,
      loket_nama: data.loket_nama,
    });
  } catch (error: any) {
    console.error('Error resetting queue:', error);
    return res.status(500).json({
      error: 'Failed to reset queue',
      message: error?.message || 'Unknown error',
    });
  }
}
