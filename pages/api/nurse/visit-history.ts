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
        const { poli_id } = req.query;

        if (!poli_id) {
            return res.status(400).json({ error: 'poli_id is required' });
        }

        // Get ALL visits for this poli (no date filter for history)
        const { data: visits, error } = await supabaseServer
            .from('visits')
            .select(`
        id,
        no_reg,
        status,
        ttv_status,
        ttv_done,
        created_at,
        patient:patient_id (
          id,
          nrm,
          nama,
          nik,
          tanggal_lahir,
          jenis_kelamin
        ),
        poli:poli_id (
          id,
          nama
        ),
        triase (
          id,
          perawat_id,
          tensi,
          nadi,
          suhu,
          spo2,
          resp,
          catatan,
          created_at,
          nurses:perawat_id (
            users:user_id (
              nama
            )
          )
        )
      `)
            .eq('poli_id', poli_id)
            .order('created_at', { ascending: false }); // Newest first

        if (error) throw error;

        return res.status(200).json({
            visits: visits || [],
        });
    } catch (error: any) {
        console.error('Error fetching visit history:', error);
        return res.status(500).json({
            error: 'Failed to fetch visit history',
            message: error?.message || 'Unknown error',
        });
    }
}
