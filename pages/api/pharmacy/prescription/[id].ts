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
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Prescription ID is required' });
        }

        const { data, error } = await supabaseServer
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
            nik,
            jenis_kelamin,
            tanggal_lahir
          ),
          poli:poli_id (
            id,
            nama
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
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        return res.status(200).json({
            prescription: data,
        });
    } catch (error: any) {
        console.error('Error fetching prescription:', error);
        return res.status(500).json({
            error: 'Failed to fetch prescription',
            message: error?.message || 'Unknown error',
        });
    }
}
