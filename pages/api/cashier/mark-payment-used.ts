import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Mark payment code as used after successful payment
 * POST /api/cashier/mark-payment-used
 * Body: { code: string, cashier_user_id: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { code, cashier_user_id } = req.body

        if (!code || !cashier_user_id) {
            return res.status(400).json({ error: 'Code and cashier_user_id are required' })
        }

        // Update payment code as used
        const { data: updatedCode, error: updateError } = await supabase
            .from('payment_codes')
            .update({
                is_used: true,
                used_at: new Date().toISOString(),
                used_by: cashier_user_id
            })
            .eq('code', code.trim().toUpperCase())
            .eq('is_used', false) // Only update if not already used
            .select()
            .single()

        if (updateError || !updatedCode) {
            return res.status(400).json({ error: 'Failed to mark payment as used. Code may already be used.' })
        }

        return res.status(200).json({
            success: true,
            message: 'Payment code marked as used',
            used_at: updatedCode.used_at
        })

    } catch (error) {
        console.error('Error in mark-payment-used:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
