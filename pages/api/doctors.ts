import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export interface Doctor {
  id: string;
  name: string;
  clinic: string;
  specialization: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Strat 1: Try to fetch with users join
      let doctors: any[] = [];
      let fetchError: any = null;

      try {
        const { data, error } = await supabaseServer
          .from('doctors')
          .select('id, user_id, spesialis, sip, users:user_id(nama)');
        
        if (error) throw error;
        doctors = data || [];
      } catch (err: any) {
        // Strat 2: Fallback if join fails (e.g. relation not exists)
        console.warn('Join with users failed, falling back to basic fetch:', err.message);
        const { data, error } = await supabaseServer
          .from('doctors')
          .select('id, user_id, spesialis, sip');
        
        if (error) {
          throw error; // If this also fails, then real error
        }
        doctors = data || [];
      }

      // Get doctor_poli relations to know which clinic they belong to
      const { data: docPoli, error: docPoliError } = await supabaseServer
        .from('doctor_poli')
        .select('dokter_id, poli:poli_id(nama)');

      if (docPoliError) {
         console.warn('Error fetching doctor_poli:', docPoliError.message);
         // Don't throw, just continue with empty clinic info
      }

      // Map doctors to include clinic name
      const doctorList = doctors.map((doc: any) => {
        // Find clinic for this doctor
        const assignment = docPoli?.find((dp: any) => dp.dokter_id === doc.id);
        const poliData = assignment?.poli as any;
        const clinicName = poliData?.nama || 'Umum';
        
        // Resolve name
        let name = `Dr. ${doc.id}`; // Default
        if (doc.users && doc.users.nama) {
             name = doc.users.nama; // From join
        } else if (doc.user_id && typeof doc.user_id === 'string' && doc.user_id.length < 30) {
             // If user_id is short (not UUID), assume it's a name (legacy data)
             name = doc.user_id;
        }

        return {
          id: doc.id,
          name: name,
          clinic: clinicName,
          specialization: doc.spesialis || 'Umum',
        };
      });

      res.status(200).json({
        success: true,
        data: doctorList,
        message: 'Doctors retrieved successfully',
      });
    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch doctors',
      });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
