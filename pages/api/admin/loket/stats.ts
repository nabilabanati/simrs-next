import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Admin Loket Statistics
 * 
 * Get statistics and distribution for admin monitoring
 * Returns counts per loket, poli, doctor, and status
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date_from, date_to } = req.query;

    // ============================================
    // Build base query with date filter
    // ============================================
    
    let baseQuery = supabaseServer.from('visits');

    // Default to today if no date specified
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = date_from 
      ? new Date(date_from as string) 
      : today;
    
    const endDate = date_to 
      ? new Date(date_to as string) 
      : new Date();
    endDate.setHours(23, 59, 59, 999);

    // ============================================
    // Get total antrian count
    // ============================================
    
    const { count: totalCount } = await supabaseServer
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('queue_number', 'is', null);

    // ============================================
    // Get distribution per loket
    // ============================================
    
    const { data: loketData } = await supabaseServer
      .from('visits')
      .select('loket_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('queue_number', 'is', null);

    const perLoket = [1, 2, 3, 4, 5].map(loketId => ({
      loket_id: loketId,
      count: loketData?.filter(v => v.loket_id === loketId).length || 0,
    }));

    // ============================================
    // Get distribution per poli
    // ============================================
    
    const { data: poliData } = await supabaseServer
      .from('visits')
      .select(`
        poli_id,
        poli(nama)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('queue_status', 'terdaftar')
      .not('poli_id', 'is', null);

    const poliMap = new Map();
    poliData?.forEach((v: any) => {
      const poliName = (v.poli as any)?.nama || 'Unknown';
      poliMap.set(poliName, (poliMap.get(poliName) || 0) + 1);
    });

    const perPoli = Array.from(poliMap.entries()).map(([nama, count]) => ({
      poli_name: nama,
      count,
    }));

    // ============================================
    // Get distribution per doctor
    // ============================================
    
    const { data: doctorData } = await supabaseServer
      .from('visits')
      .select(`
        dokter_id,
        doctors(user_id)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('queue_status', 'terdaftar')
      .not('dokter_id', 'is', null);

    // Get doctor names
    const doctorUserIds = [...new Set(
      doctorData?.map((v: any) => (v.doctors as any)?.user_id).filter(Boolean) || []
    )];

    let doctorNameMap = new Map();
    if (doctorUserIds.length > 0) {
      const { data: usersData } = await supabaseServer
        .from('users')
        .select('id, nama')
        .in('id', doctorUserIds);
      
      if (usersData) {
        doctorNameMap = new Map(usersData.map(u => [u.id, u.nama]));
      }
    }

    const doctorCountMap = new Map();
    doctorData?.forEach((v: any) => {
      const userId = (v.doctors as any)?.user_id;
      if (userId) {
        const doctorName = doctorNameMap.get(userId) || 'Unknown';
        doctorCountMap.set(doctorName, (doctorCountMap.get(doctorName) || 0) + 1);
      }
    });

    const perDokter = Array.from(doctorCountMap.entries()).map(([nama, count]) => ({
      dokter_name: nama,
      count,
    }));

    // ============================================
    // Get distribution per status
    // ============================================
    
    const { data: statusData } = await supabaseServer
      .from('visits')
      .select('queue_status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('queue_number', 'is', null);

    const statusMap = new Map();
    statusData?.forEach(v => {
      const status = v.queue_status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const perStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // ============================================
    // Return statistics
    // ============================================
    
    return res.status(200).json({
      success: true,
      period: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      statistics: {
        total_antrian: totalCount || 0,
        per_loket: perLoket,
        per_poli: perPoli,
        per_dokter: perDokter,
        per_status: perStatus,
      },
    });

  } catch (error: any) {
    console.error('Error in admin stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error?.message || 'Unknown error',
    });
  }
}
