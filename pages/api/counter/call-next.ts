import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Call Next Patient
 * 
 * New workflow with separated tables:
 * 1. Find oldest 'waiting' queue_ticket for the loket
 * 2. Update status to 'called'
 * 3. Return ticket data for display
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loket_id } = req.body;

    if (!loket_id || loket_id < 1 || loket_id > 5) {
      return res.status(400).json({ 
        error: 'Invalid loket_id',
        message: 'loket_id must be between 1 and 5'
      });
    }

    // ============================================
    // Step 1: Find next waiting ticket (FIFO)
    // ============================================
    
    const { data: nextTicket, error: findError } = await supabaseServer
      .from('queue_tickets')
      .select('*')
      .eq('loket_id', loket_id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (findError || !nextTicket) {
      return res.status(404).json({ 
        error: 'No waiting tickets',
        message: `Tidak ada antrian yang menunggu di Loket ${loket_id}`
      });
    }

    // ============================================
    // Step 1.5: Mark previous 'called' ticket as no_show
    // (if exists and not yet registered)
    // ============================================
    
    const { error: noShowError } = await supabaseServer
      .from('queue_tickets')
      .update({ 
        status: 'no_show',
        updated_at: new Date().toISOString()
      })
      .eq('loket_id', loket_id)
      .eq('status', 'called')
      .neq('id', nextTicket.id); // Don't update the ticket we're about to call

    if (noShowError) {
      console.error('Error marking previous ticket as no_show:', noShowError);
      // Don't throw - this is not critical, continue with calling next
    }

    // ============================================
    // Step 2: Update ticket status to 'called'
    // ============================================
    
    const { data: calledTicket, error: updateError } = await supabaseServer
      .from('queue_tickets')
      .update({ 
        status: 'called',
        called_at: new Date().toISOString()
      })
      .eq('id', nextTicket.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      throw updateError;
    }

    // ============================================
    // Step 3: Return called ticket
    // ============================================
    
    return res.status(200).json({
      success: true,
      ticket: {
        id: calledTicket.id,
        queue_number: calledTicket.queue_number,
        loket_id: calledTicket.loket_id,
        status: calledTicket.status,
        called_at: calledTicket.called_at,
        created_at: calledTicket.created_at,
      },
      message: `Antrian ${calledTicket.queue_number} dipanggil`
    });

  } catch (error: any) {
    console.error('Error in call-next:', error);
    return res.status(500).json({
      error: 'Failed to call next ticket',
      message: error?.message || 'Unknown error',
    });
  }
}
