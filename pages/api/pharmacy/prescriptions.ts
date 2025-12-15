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
        const { status } = req.query;

        let query = supabaseServer
            .from('prescriptions')
            .select(`
        id,
        no_order,
        status,
        created_at,
        visit:visit_id (
          id,
          no_reg,
          patient:patient_id (
            id,
            nrm,
            nama,
            jenis_kelamin
          )
        ),
        created_by_user:created_by (
          id,
          nama
        ),
        prescription_items (
          id,
          nama_obat,
          qty,
          satuan,
          instruksi,
          medicine:medicine_id (
            id,
            kode,
            nama,
            harga
          )
        )
      `)
            .order('created_at', { ascending: false });

        // Filter by status if provided
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return res.status(200).json({
            prescriptions: data || [],
        });
    } catch (error: any) {
        console.error('Error fetching prescriptions:', error);
        return res.status(500).json({
            error: 'Failed to fetch prescriptions',
            message: error?.message || 'Unknown error',
        });
    }
}
