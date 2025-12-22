import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

/**
 * Verify payment code and authenticate cashier
 * POST /api/cashier/verify-payment-code
 * Body: { code: string, cashier_user_id: string, cashier_password: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { code, cashier_user_id, cashier_password } = req.body

        if (!code || !cashier_user_id || !cashier_password) {
            return res.status(400).json({ error: 'Code, cashier_user_id, and cashier_password are required' })
        }

        // 1. Verify cashier credentials
        const { data: cashier, error: cashierError } = await supabase
            .from('users')
            .select('id, username, password, role, is_active')
            .eq('id', cashier_user_id)
            .single()

        console.log('🔍 API Debug - Cashier query:', {
            cashier_user_id,
            found: !!cashier,
            error: cashierError?.message,
            cashier
        })

        if (cashierError || !cashier) {
            console.error('❌ Cashier not found:', cashierError)
            return res.status(404).json({ error: 'Cashier not found', details: cashierError?.message })
        }

        if (cashier.role !== 'loket' && cashier.role !== 'kasir') {
            return res.status(403).json({ error: 'Only cashier/loket role can verify payment codes' })
        }

        if (!cashier.is_active) {
            return res.status(403).json({ error: 'Cashier account is inactive' })
        }

        // Verify password (plain text for now - TODO: implement bcrypt hashing in database)
        // const passwordMatch = await bcrypt.compare(cashier_password, cashier.password)
        const passwordMatch = cashier_password === cashier.password
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' })
        }

        // 2. Verify payment code
        console.log('🔍 Step 2: Checking payment code:', code.trim().toUpperCase())
        const { data: paymentCode, error: codeError } = await supabase
            .from('payment_codes')
            .select(`
        id,
        visit_id,
        code,
        is_used,
        used_at,
        expires_at,
        created_at
      `)
            .eq('code', code.trim().toUpperCase())
            .single()

        console.log('🔍 Payment code result:', { found: !!paymentCode, error: codeError?.message })

        if (codeError || !paymentCode) {
            console.error('❌ Payment code not found:', codeError)
            return res.status(404).json({ error: 'Invalid payment code' })
        }

        // Check if code is already used
        if (paymentCode.is_used) {
            return res.status(400).json({
                error: 'Payment code has already been used',
                used_at: paymentCode.used_at
            })
        }

        // Check if code is expired
        if (new Date(paymentCode.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Payment code has expired' })
        }

        console.log('✅ Payment code valid, fetching visit data...')

        // 3. Get visit data with all related information
        const { data: visitData, error: visitError } = await supabase
            .from('visits')
            .select(`
        id,
        no_reg,
        patient_id,
        poli_id,
        dokter_id,
        status,
        created_at,
        is_referral,
        patients:patient_id (
          id,
          nrm,
          nama,
          nik,
          tanggal_lahir,
          jenis_kelamin,
          alamat
        ),
        poli:poli_id (
          id,
          nama,
          harga_daftar
        ),
        doctors:dokter_id (
          user_id,
          users:user_id (
            nama
          )
        )
      `)
            .eq('id', paymentCode.visit_id)
            .single()

        console.log('🔍 Visit data result:', { found: !!visitData, error: visitError?.message })

        if (visitError || !visitData) {
            console.error('❌ Visit data not found:', visitError)
            return res.status(404).json({ error: 'Visit data not found' })
        }

        // 4. Get invoice items (tindakan/actions)
        const { data: invoiceItems, error: itemsError } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('visit_id', paymentCode.visit_id)

        // 5. Get prescription data if exists
        const { data: prescriptionData } = await supabase
            .from('prescriptions')
            .select(`
        id,
        no_resep,
        prescription_items (
          id,
          medicine_id,
          quantity,
          instructions,
          medicines:medicine_id (
            nama,
            harga_satuan,
            satuan
          )
        )
      `)
            .eq('visit_id', paymentCode.visit_id)
            .single()

        // Return all data needed for invoice display
        return res.status(200).json({
            success: true,
            payment_code: {
                id: paymentCode.id,
                code: paymentCode.code,
                created_at: paymentCode.created_at
            },
            visit: visitData,
            invoice_items: invoiceItems || [],
            prescription: prescriptionData || null
        })

    } catch (error) {
        console.error('Error in verify-payment-code:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
