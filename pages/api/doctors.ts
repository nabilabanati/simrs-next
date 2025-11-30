import { NextApiRequest, NextApiResponse } from 'next';

export interface Doctor {
  id: string;
  name: string;
  clinic: string;
  specialization: string;
}

const doctors: Doctor[] = [
  // Poli Bedah Ortopedi
  { id: '1', name: 'dr. Budi Sp.OT', clinic: 'Poli Bedah Ortopedi', specialization: 'Bedah Ortopedi' },
  { id: '2', name: 'dr. Agus Santoso Sp.OT', clinic: 'Poli Bedah Ortopedi', specialization: 'Bedah Ortopedi' },
  { id: '3', name: 'dr. Rina Kartika Sp.OT', clinic: 'Poli Bedah Ortopedi', specialization: 'Bedah Ortopedi' },
  
  // Poli Gigi
  { id: '4', name: 'drg. Andi Prasetyo, Sp.KG', clinic: 'Poli Gigi', specialization: 'Konservasi Gigi' },
  { id: '5', name: 'drg. Sari Dewi', clinic: 'Poli Gigi', specialization: 'Gigi Umum' },
  { id: '6', name: 'drg. Ahmad Fauzi, Sp.KG', clinic: 'Poli Gigi', specialization: 'Konservasi Gigi' },
  
  // Poli Umum
  { id: '7', name: 'dr. Sarah', clinic: 'Poli Umum', specialization: 'Umum' },
  { id: '8', name: 'dr. Muhammad Yusuf', clinic: 'Poli Umum', specialization: 'Umum' },
  { id: '9', name: 'dr. Dewi Pratiwi', clinic: 'Poli Umum', specialization: 'Umum' },
  
  // Poli Jantung
  { id: '10', name: 'dr. Sari Sp.JP', clinic: 'Poli Jantung', specialization: 'Jantung' },
  { id: '11', name: 'dr. Budi Hartono Sp.JP', clinic: 'Poli Jantung', specialization: 'Jantung' },
  { id: '12', name: 'dr. Lisa Permata Sp.JP', clinic: 'Poli Jantung', specialization: 'Jantung' },
  
  // Poli Anak
  { id: '13', name: 'dr. Ahmad Sp.A', clinic: 'Poli Anak', specialization: 'Anak' },
  { id: '14', name: 'dr. Rina Susanti Sp.A', clinic: 'Poli Anak', specialization: 'Anak' },
  { id: '15', name: 'dr. Dedi Kurniawan Sp.A', clinic: 'Poli Anak', specialization: 'Anak' },
  
  // Poli Mata
  { id: '16', name: 'dr. Rina Kusuma', clinic: 'Poli Mata', specialization: 'Mata' },
  { id: '17', name: 'dr. Agung Pratama Sp.M', clinic: 'Poli Mata', specialization: 'Mata' },
  { id: '18', name: 'dr. Maya Sari Sp.M', clinic: 'Poli Mata', specialization: 'Mata' },
  
  // Poli THT
  { id: '19', name: 'dr. Dedi Pratama', clinic: 'Poli THT', specialization: 'THT' },
  { id: '20', name: 'dr. Siti Nurhaliza Sp.THT', clinic: 'Poli THT', specialization: 'THT' },
  { id: '21', name: 'dr. Roni Wijaya Sp.THT', clinic: 'Poli THT', specialization: 'THT' },
  
  // Poli Kulit & Kelamin
  { id: '22', name: 'dr. Andi Kurnia Sp.KK', clinic: 'Poli Kulit & Kelamin', specialization: 'Kulit' },
  { id: '23', name: 'dr. Dewi Lestari Sp.KK', clinic: 'Poli Kulit & Kelamin', specialization: 'Kulit' },
  { id: '24', name: 'dr. Budi Setiawan Sp.KK', clinic: 'Poli Kulit & Kelamin', specialization: 'Kulit' },
  
  // Poli Paru
  { id: '25', name: 'dr. Ahmad Fauzi Sp.P', clinic: 'Poli Paru', specialization: 'Paru' },
  { id: '26', name: 'dr. Sari Indira Sp.P', clinic: 'Poli Paru', specialization: 'Paru' },
  { id: '27', name: 'dr. Roni Susanto Sp.P', clinic: 'Poli Paru', specialization: 'Paru' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { clinic } = req.query;

    if (clinic && typeof clinic === 'string') {
      // Get doctors for specific clinic
      const filteredDoctors = doctors.filter((doc) => doc.clinic === clinic);
      res.status(200).json({
        success: true,
        data: filteredDoctors,
        message: `Doctors for ${clinic} retrieved successfully`,
      });
    } else {
      // Get all doctors
      res.status(200).json({
        success: true,
        data: doctors,
        message: 'All doctors retrieved successfully',
      });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
