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
    // Auto-reset daily: Check if we need to reset for a new day
    const { data: lastCounter, error: lastError } = await supabaseServer
      .from('queue_counters')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (lastError && lastError.code !== 'PGRST116') throw lastError;

    if (lastCounter) {
      const lastUpdate = new Date(lastCounter.updated_at);
      const now = new Date();
      
      // Check if it's a different day (compare dates only, not time)
      const lastDate = lastUpdate.toISOString().split('T')[0];
      const currentDate = now.toISOString().split('T')[0];

      if (lastDate !== currentDate) {
        // It's a new day! Reset everything
        console.log('New day detected, resetting all queues...');
        
        // Delete all tickets
        await supabaseServer
          .from('queue_tickets')
          .delete()
          .gte('queue_number', 0); // Delete all where queue_number >= 0

        // Reset all counters
        await supabaseServer
          .from('queue_counters')
          .update({ 
            current_queue: 0, 
            updated_at: now.toISOString() 
          })
          .gte('id', '00000000-0000-0000-0000-000000000000'); // Update all
      }
    }

    // Get current global queue number
    const { data: counters, error: fetchError } = await supabaseServer
      .from('queue_counters')
      .select('current_queue')
      .order('current_queue', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    // Calculate next queue number (global across all lokets)
    const currentMax = counters && counters.length > 0 ? counters[0].current_queue : 0;
    const queueNumber = currentMax + 1;

    // Round-robin loket assignment: 1,2,3,4,5,1,2,3,4,5...
    const loketId = ((queueNumber - 1) % 5) + 1;

    // Insert new ticket
    const { data: ticket, error: insertError } = await supabaseServer
      .from('queue_tickets')
      .insert({
        queue_number: queueNumber,
        loket_id: loketId,
        status: 'waiting',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update the counter for this loket
    const { error: updateError } = await supabaseServer
      .from('queue_counters')
      .update({
        current_queue: queueNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('loket_nama', `LOKET-${loketId}`);

    if (updateError) throw updateError;

    return res.status(200).json({
      ticket: {
        id: ticket.id,
        queue_number: ticket.queue_number,
        loket_id: ticket.loket_id,
        status: ticket.status,
        created_at: ticket.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      error: 'Failed to create queue ticket',
      message: error?.message || 'Unknown error',
    });
  }
}
