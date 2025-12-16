import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export interface Poli {
  id: string;
  name: string;
  code: string;
  harga_daftar: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseServer
        .from('poli')
        .select('id, nama, kode, harga_daftar')
        .order('nama', { ascending: true });

      if (error) throw error;

      const polis: Poli[] = (data || []).map((poli: any) => ({
        id: poli.id,
        name: poli.nama,
        code: poli.kode || poli.nama.toUpperCase().replace(/\s+/g, '_'),
        harga_daftar: poli.harga_daftar || 0,
      }));

      res.status(200).json({
        success: true,
        data: polis,
        message: 'Polis retrieved successfully',
      });
    } catch (error: any) {
      console.error('Error fetching polis:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch polis',
      });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
