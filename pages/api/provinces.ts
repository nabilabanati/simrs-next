import type { NextApiRequest, NextApiResponse } from 'next';

export interface Province {
  id: string;
  name: string;
  code: string;
}

const provinces: Province[] = [
  { id: '11', name: 'Jawa Tengah', code: 'JT' },
  { id: '12', name: 'Jawa Barat', code: 'JB' },
  { id: '13', name: 'Jawa Timur', code: 'JE' },
  { id: '14', name: 'DKI Jakarta', code: 'DKI' },
  { id: '15', name: 'Bali', code: 'BL' },
  { id: '16', name: 'Sumatera Utara', code: 'SU' },
  { id: '17', name: 'Sumatera Barat', code: 'SB' },
  { id: '18', name: 'Sumatera Selatan', code: 'SS' },
  { id: '19', name: 'Sulawesi Selatan', code: 'SS2' },
  { id: '20', name: 'Kalimantan Timur', code: 'KT' },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Province[] | { error: string }>
) {
  if (req.method === 'GET') {
    return res.status(200).json(provinces);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
