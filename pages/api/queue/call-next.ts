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
    const { loket_id } = req.body;

    if (!loket_id || loket_id < 1 || loket_id > 5) {
      return res.status(400).json({ error: 'Invalid loket_id. Must be between 1 and 5.' });
    }

    // Find the oldest waiting ticket for this loket
    const { data: ticket, error: fetchError } = await supabaseServer
      .from('queue_tickets')
      .select('*')
      .eq('loket_id', loket_id)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No rows found
        return res.status(404).json({ 
          error: 'No waiting tickets',
          message: `Tidak ada antrian yang menunggu di Loket ${loket_id}`
        });
      }
      throw fetchError;
    }

    // Update ticket status to 'called'
    const { data: updatedTicket, error: updateError } = await supabaseServer
      .from('queue_tickets')
      .update({
        status: 'called',
        called_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      ticket: {
        id: updatedTicket.id,
        queue_number: updatedTicket.queue_number,
        loket_id: updatedTicket.loket_id,
        status: updatedTicket.status,
        called_at: updatedTicket.called_at,
      },
    });
  } catch (error: any) {
    console.error('Error calling next ticket:', error);
    return res.status(500).json({
      error: 'Failed to call next ticket',
      message: error?.message || 'Unknown error',
    });
  }
}
