import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { doctor_id } = req.query;

        if (!doctor_id) {
            return res.status(400).json({ error: 'doctor_id is required' });
        }

        // Get unique patients who have visited this doctor
        const { data: visits, error } = await supabaseServer
            .from('visits')
            .select(`
                patient_id,
                patients:patient_id (
                    id,
                    nrm,
                    nama,
                    nik,
                    tanggal_lahir,
                    jenis_kelamin
                ),
                created_at
            `)
            .eq('dokter_id', doctor_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get unique patients with their last visit date
        const uniquePatients = new Map();

        (visits || []).forEach((visit: any) => {
            const patientId = visit.patient_id;
            if (!uniquePatients.has(patientId)) {
                uniquePatients.set(patientId, {
                    ...visit.patients,
                    last_visit: visit.created_at,
                });
            }
        });

        const patients = Array.from(uniquePatients.values());

        return res.status(200).json({
            success: true,
            data: patients,
        });
    } catch (error: any) {
        console.error('Error fetching doctor patients:', error);
        return res.status(500).json({
            error: 'Failed to fetch patients',
            message: error?.message || 'Unknown error',
        });
    }
}
