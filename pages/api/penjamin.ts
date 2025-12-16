import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseServer
        .from('penjamin')
        .select('id, nama, tipe')
        .order('nama', { ascending: true });

      if (error) throw error;

      const paymentMethods: PaymentMethod[] = (data || []).map((penjamin: any) => ({
        id: penjamin.id,
        name: penjamin.nama,
        code: penjamin.tipe?.toUpperCase() || penjamin.nama.toUpperCase(),
        description: `Pembayaran via ${penjamin.nama}`,
      }));

      res.status(200).json({
        success: true,
        data: paymentMethods,
        message: 'Payment methods retrieved successfully',
      });
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch payment methods',
      });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
