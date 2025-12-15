import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseServer
      .from('queue_counters')
      .select('*')
      .order('loket_nama', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      counters: data || [],
    });
  } catch (error: any) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({
      error: 'Failed to fetch queue',
      message: error?.message || 'Unknown error',
    });
  }
}
