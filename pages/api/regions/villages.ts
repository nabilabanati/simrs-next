import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { district_id } = req.query;

    if (!district_id || typeof district_id !== 'string') {
        return res.status(400).json({ error: 'District ID is required' });
    }

    try {
        // Fetch villages from wilayah.id API
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${district_id}.json`);

        if (!response.ok) {
            throw new Error('Failed to fetch villages from wilayah.id');
        }

        const data = await response.json();

        // Transform to match our format
        const villages = data.map((village: any) => ({
            code: village.id,
            name: village.name,
        }));

        return res.status(200).json(villages);
    } catch (error: any) {
        console.error('Error fetching villages:', error);
        return res.status(500).json({
            error: 'Failed to fetch villages',
            message: error?.message || 'Unknown error'
        });
    }
}
