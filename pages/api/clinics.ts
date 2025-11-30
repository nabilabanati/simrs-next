import { NextApiRequest, NextApiResponse } from 'next';

export interface Clinic {
  id: string;
  name: string;
  code: string;
}

const clinics: Clinic[] = [
  { id: '1', name: 'Poli Bedah Ortopedi', code: 'POLI_ORTHO' },
  { id: '2', name: 'Poli Gigi', code: 'POLI_GIGI' },
  { id: '3', name: 'Poli Umum', code: 'POLI_UMUM' },
  { id: '4', name: 'Poli Jantung', code: 'POLI_JANTUNG' },
  { id: '5', name: 'Poli Anak', code: 'POLI_ANAK' },
  { id: '6', name: 'Poli Mata', code: 'POLI_MATA' },
  { id: '7', name: 'Poli THT', code: 'POLI_THT' },
  { id: '8', name: 'Poli Kulit & Kelamin', code: 'POLI_SKIN' },
  { id: '9', name: 'Poli Paru', code: 'POLI_PARU' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      data: clinics,
      message: 'Clinics retrieved successfully',
    });
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
