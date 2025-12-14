import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch provinces from wilayah.id API
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');

        if (!response.ok) {
            throw new Error('Failed to fetch provinces from wilayah.id');
        }

        const data = await response.json();

        // Transform to match our format
        const provinces = data.map((province: any) => ({
            code: province.id,
            name: province.name,
        }));

        return res.status(200).json(provinces);
    } catch (error: any) {
        console.error('Error fetching provinces:', error);
        return res.status(500).json({
            error: 'Failed to fetch provinces',
            message: error?.message || 'Unknown error'
        });
    }
}
