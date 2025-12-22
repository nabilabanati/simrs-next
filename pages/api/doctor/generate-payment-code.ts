import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

/**
 * Generate a unique payment code for a visit
 * POST /api/doctor/generate-payment-code
 * Body: { visit_id: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { visit_id } = req.body

        if (!visit_id) {
            return res.status(400).json({ error: 'visit_id is required' })
        }

        // Verify visit exists
        const { data: visit, error: visitError } = await supabase
            .from('visits')
            .select('id, status')
            .eq('id', visit_id)
            .single()

        if (visitError || !visit) {
            return res.status(404).json({ error: 'Visit not found' })
        }

        // Check if payment code already exists for this visit
        const { data: existingCode } = await supabase
            .from('payment_codes')
            .select('code, is_used')
            .eq('visit_id', visit_id)
            .single()

        // If code exists and not used, return existing code
        if (existingCode && !existingCode.is_used) {
            return res.status(200).json({
                success: true,
                code: existingCode.code,
                message: 'Payment code already exists'
            })
        }

        // Generate unique payment code
        const code = generatePaymentCode()

        // Insert payment code
        const { data: paymentCode, error: insertError } = await supabase
            .from('payment_codes')
            .insert({
                visit_id,
                code,
                is_used: false,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error creating payment code:', insertError)
            return res.status(500).json({ error: 'Failed to generate payment code' })
        }

        return res.status(200).json({
            success: true,
            code: paymentCode.code,
            expires_at: paymentCode.expires_at
        })

    } catch (error) {
        console.error('Error in generate-payment-code:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

/**
 * Generate a unique 8-character alphanumeric payment code
 * Format: PAY-XXXXX (where X is alphanumeric)
 */
function generatePaymentCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous characters (0, O, I, 1)
    let code = 'PAY-'

    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return code
}
