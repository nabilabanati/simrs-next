import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Doctor Schedule Management API
 * GET: Get doctor's schedules
 * POST: Create schedule
 * PUT: Update schedule
 * DELETE: Delete schedule
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Get doctor ID from authenticated user
    const user = req.headers.authorization // TODO: Extract from JWT

    if (req.method === 'GET') {
        return handleGet(req, res)
    } else if (req.method === 'POST') {
        return handlePost(req, res)
    } else if (req.method === 'PUT') {
        return handlePut(req, res)
    } else if (req.method === 'DELETE') {
        return handleDelete(req, res)
    } else {
        return res.status(405).json({ error: 'Method not allowed' })
    }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { dokter_id } = req.query

        if (!dokter_id) {
            return res.status(400).json({ error: 'dokter_id is required' })
        }

        // Get regular schedules
        const { data: schedules, error } = await supabase
            .from('doctor_schedules')
            .select('*')
            .eq('dokter_id', dokter_id)
            .order('hari', { ascending: true })

        if (error) {
            console.error('Error fetching schedules:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            success: true,
            data: schedules || []
        })
    } catch (error: any) {
        console.error('Error in GET /api/doctor/schedule:', error)
        return res.status(500).json({ error: error.message })
    }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { dokter_id, hari, jam_mulai, jam_selesai, session_name, is_active } = req.body

        if (!dokter_id || !hari || !jam_mulai || !jam_selesai) {
            return res.status(400).json({
                error: 'dokter_id, hari, jam_mulai, and jam_selesai are required'
            })
        }

        // Validate day
        const validDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']
        if (!validDays.includes(hari.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid day. Must be senin-minggu' })
        }

        // Insert new schedule (no longer using upsert since we allow multiple per day)
        const { data, error } = await supabase
            .from('doctor_schedules')
            .insert({
                dokter_id,
                hari: hari.toLowerCase(),
                jam_mulai,
                jam_selesai,
                session_name: session_name || null,
                is_active: is_active !== undefined ? is_active : true,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating schedule:', error)
            return res.status(500).json({
                error: error.message,
                hint: error.hint || 'Check if time slots overlap'
            })
        }

        return res.status(200).json({
            success: true,
            data
        })
    } catch (error: any) {
        console.error('Error in POST /api/doctor/schedule:', error)
        return res.status(500).json({ error: error.message })
    }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query
        const { hari, jam_mulai, jam_selesai, session_name, is_active } = req.body

        if (!id) {
            return res.status(400).json({ error: 'Schedule ID is required' })
        }

        if (!hari || !jam_mulai || !jam_selesai) {
            return res.status(400).json({
                error: 'hari, jam_mulai, and jam_selesai are required'
            })
        }

        // Validate day
        const validDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']
        if (!validDays.includes(hari.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid day. Must be senin-minggu' })
        }

        // Update schedule
        const { data, error } = await supabase
            .from('doctor_schedules')
            .update({
                hari: hari.toLowerCase(),
                jam_mulai,
                jam_selesai,
                session_name: session_name || null,
                is_active: is_active !== undefined ? is_active : true,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating schedule:', error)
            return res.status(500).json({
                error: error.message,
                hint: error.hint || 'Check if time slots overlap'
            })
        }

        return res.status(200).json({
            success: true,
            data
        })
    } catch (error: any) {
        console.error('Error in PUT /api/doctor/schedule:', error)
        return res.status(500).json({ error: error.message })
    }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query

        if (!id) {
            return res.status(400).json({ error: 'Schedule ID is required' })
        }

        const { error } = await supabase
            .from('doctor_schedules')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting schedule:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            success: true,
            message: 'Schedule deleted successfully'
        })
    } catch (error: any) {
        console.error('Error in DELETE /api/doctor/schedule:', error)
        return res.status(500).json({ error: error.message })
    }
}
