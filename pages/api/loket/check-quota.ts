import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Check Patient Quota for Loket
 * GET /api/loket/check-quota?poli_id=xxx&dokter_id=xxx&date=2025-12-22
 * 
 * Returns quota information and whether registration is allowed
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { poli_id, dokter_id, date } = req.query

        if (!poli_id && !dokter_id) {
            return res.status(400).json({ error: 'Either poli_id or dokter_id is required' })
        }

        // Use provided date or today
        const checkDate = date ? new Date(date as string) : new Date()
        const tanggal = checkDate.toISOString().split('T')[0]

        console.log(`🔍 Checking quota for date: ${tanggal}`)

        let result: any = {
            date: tanggal,
            can_register: true,
            quotas: {}
        }

        // Check poli quota if poli_id provided
        if (poli_id) {
            const poliQuota = await checkPoliQuota(poli_id as string, tanggal)
            result.quotas.poli = poliQuota

            if (!poliQuota.can_register) {
                result.can_register = false
                result.reason = `Kuota poli penuh (${poliQuota.current}/${poliQuota.max})`
            }
        }

        // Check doctor quota if dokter_id provided
        if (dokter_id) {
            const doctorQuota = await checkDoctorQuota(dokter_id as string, tanggal)
            result.quotas.doctor = doctorQuota

            if (!doctorQuota.can_register) {
                result.can_register = false
                result.reason = `Kuota dokter penuh (${doctorQuota.current}/${doctorQuota.max})`
            }
        }

        return res.status(200).json({
            success: true,
            ...result
        })

    } catch (error: any) {
        console.error('Error checking quota:', error)
        return res.status(500).json({ error: error.message })
    }
}

async function checkPoliQuota(poliId: string, tanggal: string) {
    // Get poli max quota
    const { data: poli } = await supabase
        .from('poli')
        .select('max_patients_per_day, nama')
        .eq('id', poliId)
        .single()

    if (!poli || !poli.max_patients_per_day) {
        // No quota limit set
        return {
            poli_name: poli?.nama || '-',
            max: null,
            current: 0,
            remaining: null,
            can_register: true,
            unlimited: true
        }
    }

    // Count current registrations for this poli today
    const { count, error } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('poli_id', poliId)
        .gte('created_at', `${tanggal}T00:00:00`)
        .lt('created_at', `${tanggal}T23:59:59`)

    if (error) {
        console.error('Error counting poli visits:', error)
    }

    const currentCount = count || 0
    const remaining = poli.max_patients_per_day - currentCount

    return {
        poli_name: poli.nama,
        max: poli.max_patients_per_day,
        current: currentCount,
        remaining: Math.max(0, remaining),
        can_register: currentCount < poli.max_patients_per_day,
        unlimited: false
    }
}

async function checkDoctorQuota(dokterId: string, tanggal: string) {
    // Get day name
    const checkDate = new Date(tanggal)
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
    const hari = dayNames[checkDate.getDay()]

    // Get all doctor schedules for this day (can be multiple sessions)
    const { data: schedules } = await supabase
        .from('doctor_schedules')
        .select(`
            max_patients_per_day,
            session_name,
            doctors:dokter_id (
                users:user_id (nama)
            )
        `)
        .eq('dokter_id', dokterId)
        .eq('hari', hari)
        .eq('is_active', true)

    if (!schedules || schedules.length === 0) {
        // No schedule for this day
        return {
            doctor_name: '-',
            max: null,
            current: 0,
            remaining: null,
            can_register: true,
            unlimited: true
        }
    }

    // Aggregate total quota from all sessions
    const totalQuota = schedules.reduce((sum, s) => {
        return sum + (s.max_patients_per_day || 0)
    }, 0)

    if (totalQuota === 0) {
        // No quota limit set
        return {
            doctor_name: schedules[0]?.doctors?.users?.nama || '-',
            max: null,
            current: 0,
            remaining: null,
            can_register: true,
            unlimited: true,
            sessions: schedules.map(s => ({
                session_name: s.session_name,
                quota: s.max_patients_per_day
            }))
        }
    }

    // Count current registrations for this doctor today
    const { count, error } = await supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('dokter_id', dokterId)
        .gte('created_at', `${tanggal}T00:00:00`)
        .lt('created_at', `${tanggal}T23:59:59`)

    if (error) {
        console.error('Error counting doctor visits:', error)
    }

    const currentCount = count || 0
    const remaining = totalQuota - currentCount

    return {
        doctor_name: schedules[0].doctors?.users?.nama || '-',
        max: totalQuota,
        current: currentCount,
        remaining: Math.max(0, remaining),
        can_register: currentCount < totalQuota,
        unlimited: false,
        sessions: schedules.map(s => ({
            session_name: s.session_name,
            quota: s.max_patients_per_day
        }))
    }
}
