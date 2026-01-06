import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { visit_id } = req.query

    if (!visit_id || typeof visit_id !== 'string') {
        return res.status(400).json({ error: 'visit_id is required' })
    }

    try {
        // Step 1: Get current visit info
        const { data: currentVisit, error: currentVisitError } = await supabase
            .from('visits')
            .select(`
                id,
                patient_id,
                penjamin_id,
                poli:poli_id (nama),
                dokter:dokter_id (users:user_id (nama)),
                harga,
                is_referral,
                created_at,
                penjamin:penjamin_id (nama)
            `)
            .eq('id', visit_id)
            .single()

        if (currentVisitError || !currentVisit) {
            return res.status(404).json({ error: 'Visit not found' })
        }

        const visitChain: any[] = []

        if (currentVisit.is_referral) {
            // Find the referral record pointing to this visit
            const { data: incomingReferral } = await supabase
                .from('referrals')
                .select(`
                    from_visit_id,
                    from_poli:from_poli_id (nama),
                    from_doctor:from_doctor_id (users:user_id (nama))
                `)
                .eq('to_visit_id', visit_id)
                .eq('referral_type', 'internal')
                .single()

            if (incomingReferral) {
                // source visit details
                const { data: sourceVisit } = await supabase
                    .from('visits')
                    .select(`
                        id,
                        poli:poli_id (nama),
                        dokter:dokter_id (users:user_id (nama)),
                        harga,
                        created_at
                    `)
                    .eq('id', incomingReferral.from_visit_id)
                    .single()

                if (sourceVisit) {
                    visitChain.push(sourceVisit)
                }
            }
        }

        visitChain.push(currentVisit)

        const visitDetails = await Promise.all(
            visitChain.map(async (visit) => {
                console.log(`Processing visit ${visit.id}, visit.harga: ${visit.harga}`)

                // ALWAYS fetch poli fee from poli table
                // visits.harga contains registration fee (50k), NOT poli fee
                let poliFee = 0
                const { data: poliData } = await supabase
                    .from('poli')
                    .select('harga_daftar')
                    .eq('nama', visit.poli?.nama)
                    .single()

                if (poliData?.harga_daftar) {
                    poliFee = poliData.harga_daftar
                    console.log(`Visit ${visit.id} poli fee from poli table: ${poliFee}`)
                } else {
                    console.warn(`Visit ${visit.id} - Could not find poli fee for ${visit.poli?.nama}`)
                }

                const { data: medicineData, error: medicineError } = await supabase
                    .rpc('get_visit_medicine_cost', { p_visit_id: visit.id })
                    .single()

                console.log(`Visit ${visit.id} medicine data:`, { medicineData, medicineError })

                const medicineCost = medicineData?.medicine_cost || 0
                console.log(`Visit ${visit.id} total medicine cost: ${medicineCost}`)

                const visitDetail = {
                    visit_id: visit.id,
                    poli_name: visit.poli?.nama || '-',
                    doctor_name: visit.dokter?.users?.nama || '-',
                    poli_fee: poliFee,
                    medicine_cost: medicineCost,
                    subtotal: poliFee + medicineCost,
                    date: visit.created_at
                }

                console.log(`Visit ${visit.id} final detail:`, visitDetail)
                return visitDetail
            })
        )

        let total = visitDetails.reduce((sum, visit) => sum + visit.subtotal, 0)

        const penjaminName = currentVisit.penjamin?.nama || ''
        const registrationFee = penjaminName.toLowerCase() === 'umum' ? 50000 : 0
        total += registrationFee

        console.log(`Penjamin: ${penjaminName}, Registration Fee: ${registrationFee}, Total: ${total}`)

        const { data: patient } = await supabase
            .from('patients')
            .select('nrm, nama, tanggal_lahir, jenis_kelamin')
            .eq('id', currentVisit.patient_id)
            .single()

        return res.status(200).json({
            success: true,
            data: {
                patient,
                visits: visitDetails,
                total,
                registration_fee: registrationFee,
                penjamin_name: penjaminName,
                is_accumulated: visitChain.length > 1
            }
        })
    } catch (error: any) {
        console.error('Error calculating accumulated invoice:', error)
        return res.status(500).json({ error: error.message || 'Internal server error' })
    }
}
