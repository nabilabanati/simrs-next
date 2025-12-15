import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        // Get nurse data
        const { data: nurse, error: nurseError } = await supabaseServer
            .from('nurses')
            .select('id, user_id, created_at')
            .eq('user_id', user_id)
            .single();

        if (nurseError) throw nurseError;

        if (!nurse) {
            return res.status(404).json({ error: 'Nurse not found' });
        }

        // Get nurse's poli assignment
        const { data: nursePoli, error: poliError } = await supabaseServer
            .from('nurse_poli')
            .select(`
        id,
        poli:poli_id (
          id,
          nama,
          kode
        )
      `)
            .eq('nurse_id', nurse.id)
            .single();

        if (poliError && poliError.code !== 'PGRST116') {
            throw poliError;
        }

        return res.status(200).json({
            nurse_id: nurse.id,
            user_id: nurse.user_id,
            poli: nursePoli?.poli || null,
        });
    } catch (error: any) {
        console.error('Error fetching nurse profile:', error);
        return res.status(500).json({
            error: 'Failed to fetch nurse profile',
            message: error?.message || 'Unknown error',
        });
    }
}
