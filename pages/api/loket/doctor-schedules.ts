import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Get All Doctor Schedules for Loket
 * GET /api/loket/doctor-schedules?date=2025-12-22&poli_id=xxx
 * 
 * Returns all doctors with their schedules for specific date
 * Useful for loket to see which doctors are available today
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { date, poli_id } = req.query

        // Use provided date or today
        const checkDate = date ? new Date(date as string) : new Date()
        const tanggal = checkDate.toISOString().split('T')[0]

        // Get day name
        const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
        const hari = dayNames[checkDate.getDay()]

        console.log(`🔍 Fetching doctor schedules for ${tanggal} (${hari})`)

        // Get all doctors with their schedules
        let doctorsQuery = supabase
            .from('doctors')
            .select(`
                id,
                users:user_id (
                    id,
                    nama
                ),
                doctor_poli (
                    poli:poli_id (
                        id,
                        nama
                    )
                )
            `)

        const { data: doctors, error: doctorsError } = await doctorsQuery

        if (doctorsError) {
            console.error('Error fetching doctors:', doctorsError)
            return res.status(500).json({ error: doctorsError.message })
        }

        // For each doctor, get their schedule
        const doctorSchedules = await Promise.all(
            (doctors || []).map(async (doctor) => {
                // Filter by poli if specified
                if (poli_id) {
                    const doctorPolis = doctor.doctor_poli || []
                    const hasMatchingPoli = doctorPolis.some((dp: any) => dp.poli?.id === poli_id)
                    if (!hasMatchingPoli) {
                        return null
                    }
                }

                // Check for override first
                const { data: override } = await supabase
                    .from('doctor_schedule_overrides')
                    .select('*')
                    .eq('dokter_id', doctor.id)
                    .eq('tanggal', tanggal)
                    .single()

                if (override) {
                    if (override.is_cancelled) {
                        return {
                            dokter_id: doctor.id,
                            dokter_name: doctor.users?.nama || '-',
                            poli_name: doctor.doctor_poli?.[0]?.poli?.nama || '-',
                            status: 'cancelled',
                            reason: override.reason,
                            schedule: null
                        }
                    }

                    return {
                        dokter_id: doctor.id,
                        dokter_name: doctor.users?.nama || '-',
                        poli_name: doctor.doctor_poli?.[0]?.poli?.nama || '-',
                        status: 'available',
                        schedule: {
                            jam_mulai: override.jam_mulai,
                            jam_selesai: override.jam_selesai,
                            type: 'override'
                        }
                    }
                }

                // Check regular schedule
                const { data: schedule } = await supabase
                    .from('doctor_schedules')
                    .select('*')
                    .eq('dokter_id', doctor.id)
                    .eq('hari', hari)
                    .eq('is_active', true)
                    .single()

                if (!schedule) {
                    return {
                        dokter_id: doctor.id,
                        dokter_name: doctor.users?.nama || '-',
                        poli_name: doctor.doctor_poli?.[0]?.poli?.nama || '-',
                        status: 'no_schedule',
                        schedule: null
                    }
                }

                return {
                    dokter_id: doctor.id,
                    dokter_name: doctor.users?.nama || '-',
                    poli_name: doctor.doctor_poli?.[0]?.poli?.nama || '-',
                    status: 'available',
                    schedule: {
                        jam_mulai: schedule.jam_mulai,
                        jam_selesai: schedule.jam_selesai,
                        type: 'regular'
                    }
                }
            })
        )

        // Filter out nulls (doctors not in specified poli)
        const filteredSchedules = doctorSchedules.filter(s => s !== null)

        return res.status(200).json({
            success: true,
            date: tanggal,
            day: hari,
            data: filteredSchedules
        })

    } catch (error: any) {
        console.error('Error fetching doctor schedules:', error)
        return res.status(500).json({ error: error.message })
    }
}
