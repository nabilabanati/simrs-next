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
        const { medicine_id, qty, lokasi } = req.body;

        if (!medicine_id || !qty || !lokasi) {
            return res.status(400).json({ error: 'medicine_id, qty, and lokasi are required' });
        }

        // Check if stock exists for this medicine and location
        const { data: existingStock, error: fetchError } = await supabaseServer
            .from('medicine_stock')
            .select('*')
            .eq('medicine_id', medicine_id)
            .eq('lokasi', lokasi)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        let result;

        if (existingStock) {
            // Update existing stock
            const { data, error } = await supabaseServer
                .from('medicine_stock')
                .update({
                    qty: existingStock.qty + parseInt(qty),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingStock.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Insert new stock
            const { data, error } = await supabaseServer
                .from('medicine_stock')
                .insert([
                    {
                        medicine_id,
                        qty: parseInt(qty),
                        lokasi,
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return res.status(200).json({
            success: true,
            message: 'Stock added successfully',
            stock: result,
        });
    } catch (error: any) {
        console.error('Error adding stock:', error);
        return res.status(500).json({
            error: 'Failed to add stock',
            message: error?.message || 'Unknown error',
        });
    }
}
