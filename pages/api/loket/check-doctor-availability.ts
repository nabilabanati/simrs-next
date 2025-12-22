import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Check Doctor Availability for Loket
 * GET /api/loket/check-doctor-availability?dokter_id=xxx&datetime=2025-12-22T10:00
 * 
 * Returns whether doctor is available at specific datetime
 * Considers both regular schedule and overrides
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { dokter_id, datetime } = req.query

        if (!dokter_id) {
            return res.status(400).json({ error: 'dokter_id is required' })
        }

        // Use provided datetime or current time
        const checkTime = datetime ? new Date(datetime as string) : new Date()
        const tanggal = checkTime.toISOString().split('T')[0]
        const time = checkTime.toTimeString().split(' ')[0].substring(0, 5) // HH:MM format

        // Get day name in Indonesian
        const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
        const hari = dayNames[checkTime.getDay()]

        console.log(`🔍 Checking availability for dokter ${dokter_id} on ${tanggal} (${hari}) at ${time}`)

        // Step 1: Check if there's an override for this date
        const { data: override } = await supabase
            .from('doctor_schedule_overrides')
            .select('*')
            .eq('dokter_id', dokter_id)
            .eq('tanggal', tanggal)
            .single()

        if (override) {
            console.log('📅 Found schedule override:', override)

            // If cancelled, doctor is not available
            if (override.is_cancelled) {
                return res.status(200).json({
                    success: true,
                    available: false,
                    reason: override.reason || 'Dokter tidak tersedia pada tanggal ini',
                    schedule_type: 'override_cancelled'
                })
            }

            // Check override time range
            if (time >= override.jam_mulai && time <= override.jam_selesai) {
                return res.status(200).json({
                    success: true,
                    available: true,
                    schedule: {
                        jam_mulai: override.jam_mulai,
                        jam_selesai: override.jam_selesai,
                        type: 'override'
                    }
                })
            } else {
                return res.status(200).json({
                    success: true,
                    available: false,
                    reason: `Dokter tersedia ${override.jam_mulai} - ${override.jam_selesai} (jadwal khusus)`,
                    schedule_type: 'override_outside_hours',
                    schedule: {
                        jam_mulai: override.jam_mulai,
                        jam_selesai: override.jam_selesai
                    }
                })
            }
        }

        // Step 2: Check regular schedules (can be multiple per day)
        const { data: schedules } = await supabase
            .from('doctor_schedules')
            .select('*')
            .eq('dokter_id', dokter_id)
            .eq('hari', hari)
            .eq('is_active', true)

        if (!schedules || schedules.length === 0) {
            return res.status(200).json({
                success: true,
                available: false,
                reason: `Dokter tidak memiliki jadwal praktik pada hari ${hari}`,
                schedule_type: 'no_schedule'
            })
        }

        console.log(`📅 Found ${schedules.length} schedule(s):`, schedules)

        // Check if current time is within ANY of the schedules
        const activeSchedule = schedules.find(s =>
            time >= s.jam_mulai && time <= s.jam_selesai
        )

        if (activeSchedule) {
            return res.status(200).json({
                success: true,
                available: true,
                schedule: {
                    jam_mulai: activeSchedule.jam_mulai,
                    jam_selesai: activeSchedule.jam_selesai,
                    session_name: activeSchedule.session_name || null,
                    type: 'regular'
                }
            })
        } else {
            // Show all available time slots
            const timeSlots = schedules.map(s =>
                `${s.jam_mulai}-${s.jam_selesai}${s.session_name ? ` (${s.session_name})` : ''}`
            ).join(', ')

            return res.status(200).json({
                success: true,
                available: false,
                reason: `Dokter tersedia pada: ${timeSlots}`,
                schedule_type: 'outside_hours',
                schedules: schedules.map(s => ({
                    jam_mulai: s.jam_mulai,
                    jam_selesai: s.jam_selesai,
                    session_name: s.session_name
                }))
            })
        }

    } catch (error: any) {
        console.error('Error checking doctor availability:', error)
        return res.status(500).json({ error: error.message })
    }
}
