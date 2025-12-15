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
        const { visit_id, nurse_id } = req.body;

        if (!visit_id || !nurse_id) {
            return res.status(400).json({ error: 'visit_id and nurse_id are required' });
        }

        // Call the Supabase RPC function to pick patient
        const { data, error } = await supabaseServer
            .rpc('pick_patient_for_ttv', {
                visit_id_input: visit_id,
                nurse_id_input: nurse_id,
            });

        if (error) throw error;

        // The function returns JSON with success and message
        return res.status(200).json(data);
    } catch (error: any) {
        console.error('Error picking patient:', error);
        return res.status(500).json({
            error: 'Failed to pick patient',
            message: error?.message || 'Unknown error',
        });
    }
}
