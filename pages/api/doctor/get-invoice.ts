// pages/api/doctor/get-invoice.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/withAuth';
import { withRoles, ROLES } from '@/lib/api/role';
import { supabaseServer } from '@/lib/supabase/server';
import { ok, fail } from '@/lib/api/respond';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { visit_id } = req.query;

    if (!visit_id || typeof visit_id !== 'string') {
        return fail(res, 'visit_id is required');
    }

    try {
        // Get invoice with complete details
        const { data: invoice, error: invoiceError } = await supabaseServer
            .from('invoices')
            .select(`
                *,
                visits (
                    id,
                    no_reg,
                    created_at,
                    patient_id,
                    poli_id,
                    patients (
                        id,
                        nrm,
                        nama,
                        nik
                    ),
                    poli (
                        id,
                        nama,
                        kode,
                        harga_daftar
                    )
                )
            `)
            .eq('visit_id', visit_id)
            .single();

        if (invoiceError) {
            if (invoiceError.code === 'PGRST116') {
                return fail(res, 'Invoice not found for this visit');
            }
            throw invoiceError;
        }

        // Get prescription items with medicine details
        const { data: prescriptions, error: prescError } = await supabaseServer
            .from('prescriptions')
            .select(`
                id,
                prescription_items (
                    id,
                    nama_obat,
                    qty,
                    satuan,
                    instruksi,
                    medicine_id,
                    medicines (
                        id,
                        nama,
                        harga
                    )
                )
            `)
            .eq('visit_id', visit_id);

        if (prescError) throw prescError;

        // Calculate breakdown
        const biaya_poli = invoice.visits?.poli?.harga_daftar || 0;
        let biaya_obat = 0;
        const medicine_items: any[] = [];

        if (prescriptions && prescriptions.length > 0) {
            prescriptions.forEach((prescription: any) => {
                prescription.prescription_items?.forEach((item: any) => {
                    const harga = item.medicines?.harga || 0;
                    const subtotal = harga * item.qty;
                    biaya_obat += subtotal;

                    medicine_items.push({
                        nama_obat: item.nama_obat,
                        qty: item.qty,
                        satuan: item.satuan,
                        harga: harga,
                        subtotal: subtotal,
                    });
                });
            });
        }

        // Build response
        const totalBiaya = biaya_poli + biaya_obat;

        const response = {
            invoice_id: invoice.id,
            visit_id: invoice.visit_id,
            no_reg: invoice.visits?.no_reg,
            created_at: invoice.visits?.created_at,
            patient: {
                nrm: invoice.visits?.patients?.nrm,
                nama: invoice.visits?.patients?.nama,
                nik: invoice.visits?.patients?.nik,
            },
            poli: {
                nama: invoice.visits?.poli?.nama,
                kode: invoice.visits?.poli?.kode,
            },
            biaya_poli: biaya_poli,
            biaya_obat: biaya_obat,
            total: totalBiaya, // Calculate from biaya_poli + biaya_obat
            paid: invoice.paid,
            paid_at: invoice.paid_at,
            medicine_items: medicine_items,
        };

        return ok(res, response);
    } catch (error: any) {
        console.error('Error fetching invoice:', error);
        return fail(res, error?.message || 'Failed to fetch invoice');
    }
}

export default withAuth(withRoles([ROLES.DOKTER, ROLES.SUPERADMIN, ROLES.ADMIN], handler));
