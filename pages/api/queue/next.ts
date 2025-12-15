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

    // Get current queue
    const { data: currentData, error: fetchError } = await supabaseServer
      .from('queue_counters')
      .select('*')
      .eq('loket_nama', loket_nama)
      .single();

    if (fetchError) throw fetchError;

    // Check if need to reset (new day)
    const lastUpdate = new Date(currentData.updated_at);
    const now = new Date();
    const isNewDay = lastUpdate.toDateString() !== now.toDateString();

    let newQueueNumber = currentData.current_queue + 1;

    // Auto-reset if new day
    if (isNewDay) {
      newQueueNumber = 1;
    }

    // Update queue
    const { data, error } = await supabaseServer
      .from('queue_counters')
      .update({
        current_queue: newQueueNumber,
        updated_at: now.toISOString(),
      })
      .eq('loket_nama', loket_nama)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      current_queue: data.current_queue,
      loket_nama: data.loket_nama,
      was_reset: isNewDay,
    });
  } catch (error: any) {
    console.error('Error incrementing queue:', error);
    return res.status(500).json({
      error: 'Failed to increment queue',
      message: error?.message || 'Unknown error',
    });
  }
}
