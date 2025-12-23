import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { user_id } = req.query;

    if (!user_id || typeof user_id !== 'string') {
        return res.status(400).json({ error: 'user_id is required' });
    }

    try {
        // 1. Get doctor data
        const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', user_id)
            .single();

        if (doctorError || !doctorData?.id) {
            console.error('Doctor not found:', doctorError);
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const doctorId = doctorData.id;

        // 2. Get poli info
        const { data: poliRelasi } = await supabase
            .from('doctor_poli')
            .select('poli ( id, nama )')
            .eq('dokter_id', doctorId)
            .limit(1);

        let poliName = '';
        if (poliRelasi && poliRelasi.length > 0) {
            const poliData = poliRelasi[0] as any;
            poliName = poliData.poli.nama;
        }

        // 3. Get today's visits
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const { data: visitData, error: visitError } = await supabase
            .from('visits')
            .select(`
                id,
                no_reg,
                status,
                ttv_status,
                created_at,
                patients:patient_id ( nrm, nama, jenis_kelamin )
            `)
            .eq('dokter_id', doctorId)
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: false });

        if (visitError) {
            console.error('Error fetching visits:', visitError);
            return res.status(500).json({ error: 'Failed to fetch visits' });
        }

        // 4. Format data
        const formattedVisits = (visitData || []).map((v: any, idx: number) => {
            const noRegParts = v.no_reg.split('-');
            const noAntrian = noRegParts[0] || '';

            return {
                id: v.id,
                no: idx + 1,
                noAntrian,
                noRegistrasi: v.no_reg,
                tanggalKunjungan: new Date(v.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }),
                nrm: v.patients?.nrm || '',
                nama: v.patients?.nama || '',
                jenisKelamin: v.patients?.jenis_kelamin === 'L' ? 'L' : 'P',
                ttvStatus: v.ttv_status || 'belum',
                status: v.status || 'waiting',
            };
        });

        return res.status(200).json({
            visits: formattedVisits,
            poliName,
        });
    } catch (error) {
        console.error('Error in /api/doctor/visits:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
