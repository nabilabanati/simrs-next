import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'District code is required' });
  }

  try {
    const response = await fetch(`https://wilayah.id/api/villages/${code}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const result = await response.json();
    
    // Extract the data array from the nested response structure
    const data = result.data || result;
    let villagesArray: any[] = [];
    
    if (Array.isArray(data)) {
      villagesArray = data;
    } else if (typeof data === 'object') {
      villagesArray = Object.entries(data).map(([key, value]: [string, any]) => {
        if (typeof value === 'string') {
          return { code: key, name: value, postal_code: '' };
        }
        return { 
          code: value.code || key, 
          name: value.name || value,
          postal_code: value.postal_code || ''
        };
      });
    }
    
    console.log('Villages data:', villagesArray.slice(0, 3)); // Log first 3 items
    res.status(200).json(villagesArray);
  } catch (error) {
    console.error('Error fetching villages:', error);
    res.status(500).json({ error: 'Failed to fetch villages' });
  }
}
