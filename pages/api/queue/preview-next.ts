import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Preview Next Queue Number
 * 
 * Returns the next queue number that will be assigned
 * Used for real-time preview on queue take page
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString();

    // Get the highest queue number for today
    const { data: maxTicket, error } = await supabaseServer
      .from('queue_tickets')
      .select('queue_number')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart)
      .order('queue_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching max queue number:', error);
      throw error;
    }

    // Next number will be max + 1, or 1 if no tickets today
    const nextNumber = maxTicket ? maxTicket.queue_number + 1 : 1;

    return res.status(200).json({
      success: true,
      next_queue_number: nextNumber,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Error in preview-next:', error);
    return res.status(500).json({
      error: 'Failed to get next queue number',
      message: error?.message || 'Unknown error',
    });
  }
}
