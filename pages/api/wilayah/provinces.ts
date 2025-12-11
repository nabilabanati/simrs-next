import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://wilayah.id/api/provinces.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const result = await response.json();
    
    // Extract the data array from the nested response structure
    const data = result.data || result;
    let provincesArray: any[] = [];
    
    if (Array.isArray(data)) {
      provincesArray = data;
    } else if (typeof data === 'object') {
      // If it's an object, convert to array
      provincesArray = Object.entries(data).map(([key, value]: [string, any]) => {
        if (typeof value === 'string') {
          return { code: key, name: value };
        }
        return { code: value.code || key, name: value.name || value };
      });
    }
    
    console.log('Provinces data:', provincesArray.slice(0, 3)); // Log first 3 items
    res.status(200).json(provincesArray);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
}
