import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Get user from localStorage (passed via query or header in real implementation)
        const userId = req.query.user_id as string;
        const patientId = req.query.patient_id as string;

        if (!userId) {
            return res.status(400).json({ error: "user_id is required" });
        }

        if (!patientId) {
            return res.status(400).json({ error: "patient_id is required for patient detail view" });
        }

        // Fetch visits for this patient that have prescriptions
        const { data: visits, error: visitsError } = await supabase
            .from("visits")
            .select(`
                id,
                no_reg,
                created_at,
                patient_id,
                doctors:dokter_id (
                    users:user_id (
                        nama
                    )
                ),
                prescriptions (
                    id,
                    no_order,
                    created_at,
                    prescription_items (
                        id,
                        nama_obat,
                        qty,
                        satuan,
                        instruksi
                    )
                )
            `)
            .eq("patient_id", patientId)
            .eq("status", "selesai")
            .order("created_at", { ascending: false });

        if (visitsError) {
            console.error("Error fetching visits:", visitsError);
            return res.status(500).json({ error: visitsError.message });
        }

        // Filter visits that have prescriptions and format data
        const formattedData = (visits || [])
            .filter((visit: any) => visit.prescriptions && visit.prescriptions.length > 0)
            .map((visit: any, index: number) => {
                // Aggregate all prescription items from all prescriptions in this visit
                const allMedicines: any[] = [];
                visit.prescriptions.forEach((prescription: any) => {
                    if (prescription.prescription_items) {
                        allMedicines.push(...prescription.prescription_items);
                    }
                });

                // Get the first prescription's no_order (or generate one)
                const noResep = visit.prescriptions[0]?.no_order ||
                    visit.prescriptions[0]?.id.substring(0, 8).toUpperCase() ||
                    "-";

                return {
                    id: visit.id,
                    no: index + 1,
                    visit_date: visit.created_at,
                    no_reg: visit.no_reg || "-",
                    no_resep: noResep,
                    doctor_name: visit.doctors?.users?.nama || "-",
                    medicines: allMedicines.map((item: any) => ({
                        nama: item.nama_obat,
                        qty: item.qty,
                        satuan: item.satuan,
                        instruksi: item.instruksi
                    })),
                    medicines_count: allMedicines.length
                };
            });

        return res.status(200).json({
            success: true,
            data: formattedData,
        });
    } catch (error: any) {
        console.error("Error in get-prescriptions:", error);
        return res.status(500).json({ error: error.message });
    }
}
