import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Get Queue for Loket
 * 
 * New workflow with separated tables:
 * 1. Get current called ticket from queue_tickets
 * 2. Get waiting queue from queue_tickets
 * 3. Return queue data for loket display
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loket_id } = req.query;

    if (!loket_id || parseInt(loket_id as string) < 1 || parseInt(loket_id as string) > 5) {
      return res.status(400).json({ 
        error: 'Invalid loket_id',
        message: 'loket_id must be between 1 and 5'
      });
    }

    const loketIdNum = parseInt(loket_id as string);

    // Get today's date range (start and end of day in local timezone)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString();

    // ============================================
    // Step 1: Get current called ticket (today only)
    // ============================================
    
    const { data: currentTicket, error: currentError } = await supabaseServer
      .from('queue_tickets')
      .select('*')
      .eq('loket_id', loketIdNum)
      .eq('status', 'called')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart)
      .order('called_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentError) {
      console.error('Error fetching current ticket:', currentError);
      throw currentError;
    }

    // ============================================
    // Step 2: Get waiting queue (FIFO order, today only)
    // ============================================
    
    const { data: waitingQueue, error: waitingError } = await supabaseServer
      .from('queue_tickets')
      .select('*')
      .eq('loket_id', loketIdNum)
      .eq('status', 'waiting')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart)
      .order('created_at', { ascending: true });

    if (waitingError) {
      console.error('Error fetching waiting queue:', waitingError);
      throw waitingError;
    }

    // ============================================
    // Step 3: Count waiting tickets (today only)
    // ============================================
    
    const { count: waitingCount, error: countError } = await supabaseServer
      .from('queue_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('loket_id', loketIdNum)
      .eq('status', 'waiting')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart);

    if (countError) {
      console.error('Error counting waiting tickets:', countError);
      throw countError;
    }

    // ============================================
    // Step 4: Return queue data
    // ============================================
    
    return res.status(200).json({
      success: true,
      current_ticket: currentTicket,
      waiting_queue: waitingQueue || [],
      waiting_count: waitingCount || 0,
    });

  } catch (error: any) {
    console.error('Error in get-queue:', error);
    return res.status(500).json({
      error: 'Failed to fetch queue data',
      message: error?.message || 'Unknown error',
    });
  }
}
