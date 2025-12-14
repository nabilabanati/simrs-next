import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { province_id } = req.query;

    if (!province_id || typeof province_id !== 'string') {
        return res.status(400).json({ error: 'Province ID is required' });
    }

    try {
        // Fetch regencies from wilayah.id API
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province_id}.json`);

        if (!response.ok) {
            throw new Error('Failed to fetch regencies from wilayah.id');
        }

        const data = await response.json();

        // Transform to match our format
        const regencies = data.map((regency: any) => ({
            code: regency.id,
            name: regency.name,
        }));

        return res.status(200).json(regencies);
    } catch (error: any) {
        console.error('Error fetching regencies:', error);
        return res.status(500).json({
            error: 'Failed to fetch regencies',
            message: error?.message || 'Unknown error'
        });
    }
}
