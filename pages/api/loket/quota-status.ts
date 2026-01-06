import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Get Quota Status for Poli and Doctors
 * Returns current quota usage for today
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all poli with their quota and current usage
    const { data: polis, error: poliError } = await supabaseServer
      .from('poli')
      .select('id, nama, kuota_harian')
      .order('nama');

    if (poliError) throw poliError;

    // Get all doctors with their quota
    const { data: doctors, error: doctorError } = await supabaseServer
      .from('doctors')
      .select(`
        id,
        kuota_harian,
        user_id,
        users!inner(nama)
      `);

    if (doctorError) throw doctorError;

    // Get today's visits count per poli
    const { data: poliVisits, error: poliVisitsError } = await supabaseServer
      .from('visits')
      .select('poli_id')
      .gte('created_at', today.toISOString());

    if (poliVisitsError) throw poliVisitsError;

    // Get today's visits count per doctor
    const { data: doctorVisits, error: doctorVisitsError } = await supabaseServer
      .from('visits')
      .select('dokter_id')
      .gte('created_at', today.toISOString());

    if (doctorVisitsError) throw doctorVisitsError;

    // Count visits per poli
    const poliVisitCounts = poliVisits.reduce((acc: any, visit: any) => {
      acc[visit.poli_id] = (acc[visit.poli_id] || 0) + 1;
      return acc;
    }, {});

    // Count visits per doctor
    const doctorVisitCounts = doctorVisits.reduce((acc: any, visit: any) => {
      acc[visit.dokter_id] = (acc[visit.dokter_id] || 0) + 1;
      return acc;
    }, {});

    // Build poli quota info
    const poliQuota = polis.map((poli: any) => {
      const used = poliVisitCounts[poli.id] || 0;
      const quota = poli.kuota_harian;
      const available = quota ? quota - used : null;
      const isFull = quota ? used >= quota : false;
      const percentage = quota ? Math.round((used / quota) * 100) : 0;

      return {
        id: poli.id,
        nama: poli.nama,
        quota: quota,
        used: used,
        available: available,
        isFull: isFull,
        percentage: percentage,
        status: isFull ? 'full' : percentage >= 80 ? 'warning' : 'available'
      };
    });

    // Build doctor quota info
    const doctorQuota = doctors.map((doctor: any) => {
      const used = doctorVisitCounts[doctor.id] || 0;
      const quota = doctor.kuota_harian;
      const available = quota ? quota - used : null;
      const isFull = quota ? used >= quota : false;
      const percentage = quota ? Math.round((used / quota) * 100) : 0;

      return {
        id: doctor.id,
        nama: doctor.users.nama,
        quota: quota,
        used: used,
        available: available,
        isFull: isFull,
        percentage: percentage,
        status: isFull ? 'full' : percentage >= 80 ? 'warning' : 'available'
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        poli: poliQuota,
        doctors: doctorQuota,
        date: today.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching quota:', error);
    return res.status(500).json({
      error: 'Failed to fetch quota',
      message: error?.message || 'Unknown error'
    });
  }
}
