import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Province code is required' });
  }

  try {
    const response = await fetch(`https://wilayah.id/api/regencies/${code}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const result = await response.json();
    
    // Extract the data array from the nested response structure
    const data = result.data || result;
    let citiesArray: any[] = [];
    
    if (Array.isArray(data)) {
      citiesArray = data;
    } else if (typeof data === 'object') {
      citiesArray = Object.entries(data).map(([key, value]: [string, any]) => {
        if (typeof value === 'string') {
          return { code: key, name: value };
        }
        return { code: value.code || key, name: value.name || value };
      });
    }
    
    console.log('Cities data:', citiesArray.slice(0, 3)); // Log first 3 items
    res.status(200).json(citiesArray);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}
