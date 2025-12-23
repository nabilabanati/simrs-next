import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Doctor Schedule Override API
 * For emergency cases where doctor needs to change schedule for specific date
 * 
 * GET: Get override for specific date
 * POST: Create/Update override
 * DELETE: Delete override
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return handleGet(req, res)
    } else if (req.method === 'POST') {
        return handlePost(req, res)
    } else if (req.method === 'DELETE') {
        return handleDelete(req, res)
    } else {
        return res.status(405).json({ error: 'Method not allowed' })
    }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { dokter_id, tanggal } = req.query

        if (!dokter_id) {
            return res.status(400).json({ error: 'dokter_id is required' })
        }

        let query = supabase
            .from('doctor_schedule_overrides')
            .select('*')
            .eq('dokter_id', dokter_id)

        if (tanggal) {
            query = query.eq('tanggal', tanggal)
        }

        const { data, error } = await query.order('tanggal', { ascending: false })

        if (error) {
            console.error('Error fetching overrides:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            success: true,
            data: data || []
        })
    } catch (error: any) {
        console.error('Error in GET /api/doctor/schedule-override:', error)
        return res.status(500).json({ error: error.message })
    }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { dokter_id, tanggal, jam_mulai, jam_selesai, is_cancelled, reason } = req.body

        if (!dokter_id || !tanggal) {
            return res.status(400).json({
                error: 'dokter_id and tanggal are required'
            })
        }

        // If cancelled, jam_mulai and jam_selesai are optional
        if (!is_cancelled && (!jam_mulai || !jam_selesai)) {
            return res.status(400).json({
                error: 'jam_mulai and jam_selesai are required when not cancelled'
            })
        }

        // Upsert override
        const { data, error } = await supabase
            .from('doctor_schedule_overrides')
            .upsert({
                dokter_id,
                tanggal,
                jam_mulai: is_cancelled ? null : jam_mulai,
                jam_selesai: is_cancelled ? null : jam_selesai,
                is_cancelled: is_cancelled || false,
                reason: reason || null
            }, {
                onConflict: 'dokter_id,tanggal'
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating/updating override:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            success: true,
            data,
            message: is_cancelled
                ? 'Jadwal dibatalkan untuk tanggal ini'
                : 'Override jadwal berhasil disimpan'
        })
    } catch (error: any) {
        console.error('Error in POST /api/doctor/schedule-override:', error)
        return res.status(500).json({ error: error.message })
    }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query

        if (!id) {
            return res.status(400).json({ error: 'Override ID is required' })
        }

        const { error } = await supabase
            .from('doctor_schedule_overrides')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting override:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            success: true,
            message: 'Override deleted successfully'
        })
    } catch (error: any) {
        console.error('Error in DELETE /api/doctor/schedule-override:', error)
        return res.status(500).json({ error: error.message })
    }
}
