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
        const { visit_id, nurse_id, tensi, nadi, suhu, spo2, resp, catatan } = req.body;

        if (!visit_id || !nurse_id) {
            return res.status(400).json({ error: 'visit_id and nurse_id are required' });
        }

        // Validate TTV data
        if (!tensi || !nadi || !suhu || !spo2 || !resp) {
            return res.status(400).json({ error: 'All TTV fields are required' });
        }

        // Insert triase data
        const { data: triase, error: triaseError } = await supabaseServer
            .from('triase')
            .insert([
                {
                    visit_id,
                    perawat_id: nurse_id,
                    tensi,
                    nadi: parseInt(nadi),
                    suhu: parseFloat(suhu),
                    spo2: parseInt(spo2),
                    resp: parseInt(resp),
                    catatan: catatan || null,
                },
            ])
            .select()
            .single();

        if (triaseError) throw triaseError;

        // Update visit status
        const { error: visitError } = await supabaseServer
            .from('visits')
            .update({
                ttv_status: 'selesai',
                ttv_done: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', visit_id);

        if (visitError) throw visitError;

        return res.status(200).json({
            success: true,
            message: 'TTV data saved successfully',
            triase,
        });
    } catch (error: any) {
        console.error('Error saving TTV:', error);
        return res.status(500).json({
            error: 'Failed to save TTV data',
            message: error?.message || 'Unknown error',
        });
    }
}
