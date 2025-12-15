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
        const { kode, nama, harga } = req.body;

        if (!kode || !nama || !harga) {
            return res.status(400).json({ error: 'kode, nama, and harga are required' });
        }

        // Check if medicine code already exists
        const { data: existing, error: checkError } = await supabaseServer
            .from('medicines')
            .select('id')
            .eq('kode', kode)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Kode obat sudah digunakan' });
        }

        // Insert new medicine
        const { data, error } = await supabaseServer
            .from('medicines')
            .insert([
                {
                    kode,
                    nama,
                    harga: parseFloat(harga),
                },
            ])
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: 'Obat berhasil ditambahkan',
            medicine: data,
        });
    } catch (error: any) {
        console.error('Error adding medicine:', error);
        return res.status(500).json({
            error: 'Failed to add medicine',
            message: error?.message || 'Unknown error',
        });
    }
}
