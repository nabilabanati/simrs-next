import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * API Endpoint: Admin Loket Dashboard
 * 
 * Get all registration data from all lokets for admin monitoring
 * Supports filtering by date, loket, poli, and doctor
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      date_from, 
      date_to, 
      loket_id, 
      poli_id, 
      dokter_id,
      queue_status,
      page = '1',
      limit = '50'
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const offset = (pageNum - 1) * limitNum;

    // ============================================
    // Build query with filters
    // ============================================
    
    let query = supabaseServer
      .from('visits')
      .select(`
        *,
        patients(id, nrm, nama, jenis_kelamin, no_telp),
        poli(id, nama),
        doctors(id, user_id),
        penjamin:penjamin_id(id, nama),
        queue_ticket:queue_ticket_id(id, queue_number, loket_id)
      `, { count: 'exact' });

    // Filter by date range
    if (date_from) {
      query = query.gte('created_at', new Date(date_from as string).toISOString());
    }
    if (date_to) {
      const endDate = new Date(date_to as string);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    // Filter by poli
    if (poli_id) {
      query = query.eq('poli_id', poli_id);
    }

    // Filter by doctor
    if (dokter_id) {
      query = query.eq('dokter_id', dokter_id);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limitNum - 1);

    // ============================================
    // Execute query
    // ============================================
    
    const { data: visits, error, count } = await query;

    if (error) {
      console.error('Error fetching visits:', error);
      throw error;
    }

    // Filter by loket_id from queue_ticket if specified
    let filteredVisits = visits || [];
    if (loket_id) {
      const loketIdNum = parseInt(loket_id as string);
      filteredVisits = filteredVisits.filter(visit => 
        visit.queue_ticket?.loket_id === loketIdNum
      );
    }

    // ============================================
    // Get doctor names
    // ============================================
    
    const doctorUserIds = [...new Set(
      filteredVisits
        .map(v => v.doctors?.user_id)
        .filter(Boolean)
    )];

    let userNameMap = new Map();
    
    if (doctorUserIds.length > 0) {
      const { data: usersData } = await supabaseServer
        .from('users')
        .select('id, nama')
        .in('id', doctorUserIds);
      
      if (usersData) {
        userNameMap = new Map(usersData.map(u => [u.id, u.nama]));
      }
    }

    // ============================================
    // Format response data
    // ============================================
    
    const formattedVisits = filteredVisits.map(visit => ({
      id: visit.id,
      no_reg: visit.no_reg,
      queue_number: visit.queue_ticket?.queue_number,
      loket_id: visit.queue_ticket?.loket_id,
      patient: {
        id: visit.patients?.id,
        nrm: visit.patients?.nrm,
        nama: visit.patients?.nama,
        jenis_kelamin: visit.patients?.jenis_kelamin,
        no_telp: visit.patients?.no_telp,
      },
      poli: {
        id: visit.poli?.id,
        nama: visit.poli?.nama,
      },
      doctor: {
        id: visit.doctors?.id,
        nama: visit.doctors?.user_id ? userNameMap.get(visit.doctors.user_id) : '-',
      },
      penjamin: {
        id: visit.penjamin?.id,
        nama: visit.penjamin?.nama || 'UMUM',
      },
      keluhan: visit.keluhan,
      harga: visit.harga,
      kunjungan_ke: visit.kunjungan_ke,
      created_at: visit.created_at,
      registered_at: visit.registered_at,
    }));

    return res.status(200).json({
      success: true,
      data: formattedVisits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum),
      },
    });

  } catch (error: any) {
    console.error('Error in admin dashboard:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error?.message || 'Unknown error',
    });
  }
}
