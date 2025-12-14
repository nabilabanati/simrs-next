import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Seed provinces data from wilayah.id API to Supabase
 * Call this endpoint once to populate the provinces table
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST to seed data.' });
    }

    try {
        // Fetch provinces from wilayah.id API
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');

        if (!response.ok) {
            throw new Error('Failed to fetch provinces from wilayah.id');
        }

        const provincesData = await response.json();

        // Transform and insert to Supabase
        const provinces = provincesData.map((province: any) => ({
            id: province.id,
            name: province.name,
        }));

        const { data, error } = await supabaseServer
            .from('provinces')
            .upsert(provinces, { onConflict: 'id' });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: `Successfully seeded ${provinces.length} provinces`,
            count: provinces.length
        });
    } catch (error: any) {
        console.error('Error seeding provinces:', error);
        return res.status(500).json({
            error: 'Failed to seed provinces',
            message: error?.message || 'Unknown error'
        });
    }
}
