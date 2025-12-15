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
        const { prescription_id, status } = req.body;

        if (!prescription_id || !status) {
            return res.status(400).json({ error: 'prescription_id and status are required' });
        }

        // Validate status
        const validStatuses = ['pending', 'ready', 'dispensed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be: pending, ready, or dispensed' });
        }

        // Update prescription status
        const { data, error } = await supabaseServer
            .from('prescriptions')
            .update({
                status,
                updated_at: new Date().toISOString(),
            })
            .eq('id', prescription_id)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: `Prescription status updated to ${status}`,
            prescription: data,
        });
    } catch (error: any) {
        console.error('Error updating prescription status:', error);
        return res.status(500).json({
            error: 'Failed to update prescription status',
            message: error?.message || 'Unknown error',
        });
    }
}
