import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Update Doctor Daily Quota
 * PUT /api/doctor/update-quota
 * Body: { dokter_id: string, kuota_harian: number }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { dokter_id, kuota_harian } = req.body

        if (!dokter_id) {
            return res.status(400).json({ error: 'dokter_id is required' })
        }

        if (kuota_harian === undefined || kuota_harian === null) {
            return res.status(400).json({ error: 'kuota_harian is required' })
        }

        // Validate kuota_harian is a positive number
        const quota = parseInt(kuota_harian)
        if (isNaN(quota) || quota < 0) {
            return res.status(400).json({ error: 'kuota_harian must be a positive number' })
        }

        // Update doctor's daily quota
        const { data, error } = await supabase
            .from('doctors')
            .update({ kuota_harian: quota })
            .eq('id', dokter_id)
            .select()
            .single()

        if (error) {
            console.error('Error updating doctor quota:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({
            success: true,
            message: 'Kuota harian berhasil diupdate',
            data
        })
    } catch (error: any) {
        console.error('Error in PUT /api/doctor/update-quota:', error)
        return res.status(500).json({ error: error.message })
    }
}
