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
        // Get all counters and find the one with lowest queue
        const { data: counters, error: fetchError } = await supabaseServer
            .from('queue_counters')
            .select('*')
            .order('current_queue', { ascending: true })
            .limit(1);

        if (fetchError) throw fetchError;

        if (!counters || counters.length === 0) {
            return res.status(404).json({ error: 'No counters available' });
        }

        const selectedCounter = counters[0];

        // Increment queue for selected counter
        const newQueueNumber = selectedCounter.current_queue + 1;

        const { data, error } = await supabaseServer
            .from('queue_counters')
            .update({
                current_queue: newQueueNumber,
                updated_at: new Date().toISOString(),
            })
            .eq('loket_nama', selectedCounter.loket_nama)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            queue_number: data.current_queue,
            loket_nama: data.loket_nama,
            message: `Nomor antrian Anda: ${data.current_queue}. Silakan menuju ${data.loket_nama}`,
        });
    } catch (error: any) {
        console.error('Error taking queue:', error);
        return res.status(500).json({
            error: 'Failed to take queue number',
            message: error?.message || 'Unknown error',
        });
    }
}
