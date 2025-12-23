import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Take Queue Ticket
 * 
 * New workflow with separated tables:
 * 1. Calculate active queue_tickets per loket (load balancing)
 * 2. Assign to loket with least load
 * 3. Generate queue number (auto-increment daily)
 * 4. Create queue_ticket record with status = 'waiting'
 * 5. Return queue_number and created_at (NOT loket_id to patient)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ============================================
    // Step 1: Get least busy loket (load balancing)
    // ============================================
    
    const { data: loketData, error: loketError } = await supabaseServer
      .rpc('get_least_busy_loket');

    if (loketError) {
      console.error('Error getting least busy loket:', loketError);
      throw loketError;
    }

    const assignedLoket = loketData || 1; // Fallback to loket 1 if function fails

    // ============================================
    // Step 2: Get next queue number for today
    // ============================================
    
    const { data: queueNumber, error: queueError } = await supabaseServer
      .rpc('get_next_queue_number');

    if (queueError) {
      console.error('Error getting next queue number:', queueError);
      throw queueError;
    }

    const nextQueueNumber = queueNumber || 1;

    // ============================================
    // Step 3: Create queue_ticket record
    // ============================================
    
    const { data: ticket, error: insertError } = await supabaseServer
      .from('queue_tickets')
      .insert({
        loket_id: assignedLoket,
        queue_number: nextQueueNumber,
        status: 'waiting',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating queue ticket:', insertError);
      throw insertError;
    }

    // ============================================
    // Step 4: Return ticket data to patient
    // ============================================
    
    // IMPORTANT: Do NOT return loket_id to patient
    // Patient only sees queue number and waiting message
    
    return res.status(200).json({
      success: true,
      ticket: {
        id: ticket.id,
        queue_number: ticket.queue_number,
        created_at: ticket.created_at,
        // loket_id is intentionally NOT included
      },
      message: 'Silakan menunggu panggilan',
    });

  } catch (error: any) {
    console.error('Error in take-ticket:', error);
    return res.status(500).json({
      error: 'Failed to create queue ticket',
      message: error?.message || 'Unknown error',
    });
  }
}
