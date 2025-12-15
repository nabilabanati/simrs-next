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

        // Get all visits for this poli
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
          tensi,
          nadi,
          suhu,
          spo2,
          resp,
          catatan,
          created_at
        )
      `)
            .eq('poli_id', poli_id)
            .order('ttv_status', { ascending: true }) // belum first
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Custom sort: belum -> sedang_dikerjakan -> selesai
        const sortedVisits = (visits || []).sort((a, b) => {
            const statusOrder: Record<string, number> = {
                'belum': 1,
                'sedang_dikerjakan': 2,
                'selesai': 3,
            };

            const aOrder = statusOrder[a.ttv_status] || 999;
            const bOrder = statusOrder[b.ttv_status] || 999;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            // If same status, sort by created_at
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        return res.status(200).json({
            visits: sortedVisits,
        });
    } catch (error: any) {
        console.error('Error fetching visits:', error);
        return res.status(500).json({
            error: 'Failed to fetch visits',
            message: error?.message || 'Unknown error',
        });
    }
}
