import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { regency_id } = req.query;

    if (!regency_id || typeof regency_id !== 'string') {
        return res.status(400).json({ error: 'Regency ID is required' });
    }

    try {
        // Fetch districts from wilayah.id API
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regency_id}.json`);

        if (!response.ok) {
            throw new Error('Failed to fetch districts from wilayah.id');
        }

        const data = await response.json();

        // Transform to match our format
        const districts = data.map((district: any) => ({
            code: district.id,
            name: district.name,
        }));

        return res.status(200).json(districts);
    } catch (error: any) {
        console.error('Error fetching districts:', error);
        return res.status(500).json({
            error: 'Failed to fetch districts',
            message: error?.message || 'Unknown error'
        });
    }
}
