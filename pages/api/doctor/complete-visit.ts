import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseServer } from '@/lib/supabase/server';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { visit_id } = req.body;

        if (!visit_id) {
            return res.status(400).json({ error: 'visit_id is required' });
        }

        // Check if visit exists and has SOAP record
        const { data: visit, error: visitError } = await supabaseServer
            .from('visits')
            .select('*, medical_records(*)')
            .eq('id', visit_id)
            .single();

        if (visitError || !visit) {
            return res.status(404).json({ error: 'Visit not found' });
        }

        if (!visit.medical_records || visit.medical_records.length === 0) {
            return res.status(400).json({
                error: 'Cannot complete visit without medical record (SOAP)'
            });
        }

        if (visit.status === 'selesai') {
            return res.status(400).json({
                error: 'Visit already completed'
            });
        }

        // Update visit status to 'selesai'
        // This will trigger the database trigger to auto-generate invoice
        const { error: updateError } = await supabaseServer
            .from('visits')
            .update({ status: 'selesai' })
            .eq('id', visit_id);

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            message: 'Visit completed successfully',
        });
    } catch (error: any) {
        console.error('Error completing visit:', error);
        return res.status(500).json({
            error: 'Failed to complete visit',
            message: error?.message || 'Unknown error',
        });
    }
}
