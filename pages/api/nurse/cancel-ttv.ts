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
        const { visit_id } = req.body;

        if (!visit_id) {
            return res.status(400).json({ error: 'visit_id is required' });
        }

        // Reset visit status back to 'belum'
        const { error: visitError } = await supabaseServer
            .from('visits')
            .update({
                ttv_status: 'belum',
            })
            .eq('id', visit_id);

        if (visitError) throw visitError;

        // Delete incomplete triase data if exists
        await supabaseServer
            .from('triase')
            .delete()
            .eq('visit_id', visit_id);

        return res.status(200).json({
            success: true,
            message: 'TTV status reset successfully',
        });
    } catch (error: any) {
        console.error('Error resetting TTV:', error);
        return res.status(500).json({
            error: 'Failed to reset TTV status',
            message: error?.message || 'Unknown error',
        });
    }
}
