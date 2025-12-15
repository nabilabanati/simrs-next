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
    // Get all medicines with their stock
    const { data, error } = await supabaseServer
      .from('medicines')
      .select(`
        id,
        kode,
        nama,
        harga,
        created_at,
        medicine_stock (
          id,
          lokasi,
          qty,
          updated_at
        )
      `)
      .order('nama', { ascending: true });

    if (error) throw error;

    // Calculate total stock for each medicine
    const medicinesWithStock = (data || []).map((medicine: any) => {
      const totalStock = medicine.medicine_stock?.reduce(
        (sum: number, stock: any) => sum + (stock.qty || 0),
        0
      ) || 0;

      return {
        id: medicine.id,
        kode: medicine.kode,
        nama: medicine.nama,
        harga: medicine.harga,
        total_stock: totalStock,
        stock_locations: medicine.medicine_stock || [],
        is_low_stock: totalStock < 10,
      };
    });

    return res.status(200).json({
      medicines: medicinesWithStock,
    });
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    return res.status(500).json({
      error: 'Failed to fetch stock',
      message: error?.message || 'Unknown error',
    });
  }
}
