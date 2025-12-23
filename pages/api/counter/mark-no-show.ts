import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticket_id } = req.body;

  if (!ticket_id) {
    return res.status(400).json({ error: 'ticket_id is required' });
  }

  try {
    // Update ticket status to no_show
    const { data, error } = await supabaseServer
      .from('queue_tickets')
      .update({ 
        status: 'no_show',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticket_id)
      .eq('status', 'called') // Only allow if currently called
      .select()
      .single();

    if (error) {
      console.error('Error marking as no-show:', error);
      throw error;
    }

    if (!data) {
      return res.status(404).json({ 
        error: 'Ticket not found or not in called status' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Antrian ditandai sebagai tidak hadir',
      data
    });

  } catch (error: any) {
    console.error('Error in mark-no-show API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
