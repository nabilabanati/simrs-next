import { NextApiRequest, NextApiResponse } from 'next';

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: '1', name: 'BPJS', code: 'BPJS', description: 'Badan Penyelenggara Jaminan Sosial' },
  { id: '2', name: 'Umum', code: 'GENERAL', description: 'Pembayaran Umum (Tunai/Transfer)' },
  { id: '3', name: 'Asuransi', code: 'INSURANCE', description: 'Asuransi Kesehatan Swasta' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      data: paymentMethods,
      message: 'Payment methods retrieved successfully',
    });
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
