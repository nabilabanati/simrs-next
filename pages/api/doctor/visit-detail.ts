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
        const visitId = req.query.visit_id as string;

        if (!visitId) {
            return res.status(400).json({ error: "visit_id is required" });
        }

        console.log("[visit-detail] Fetching visit with ID:", visitId);

        // First, check if visit exists
        const { data: visitCheck, error: checkError } = await supabase
            .from("visits")
            .select("id")
            .eq("id", visitId)
            .maybeSingle();

        console.log("[visit-detail] Visit check:", { exists: !!visitCheck, checkError });

        if (checkError) {
            console.error("[visit-detail] Error checking visit:", checkError);
            return res.status(500).json({ error: "Database error", details: checkError.message });
        }

        if (!visitCheck) {
            console.error("[visit-detail] Visit not found with ID:", visitId);
            return res.status(404).json({ error: "Visit not found", visitId });
        }

        // Fetch visit data with all related information
        const { data: visitData, error: visitError } = await supabase
            .from("visits")
            .select(`
                *,
                patients:patient_id (
                    id,
                    nrm,
                    nik,
                    nama,
                    tanggal_lahir,
                    tempat_lahir,
                    jenis_kelamin,
                    golongan_darah,
                    alamat,
                    no_telp
                ),
                poli:poli_id (
                    id,
                    nama
                ),
                doctors:dokter_id (
                    id,
                    users:user_id (
                        nama
                    )
                )
            `)
            .eq("id", visitId)
            .single();

        if (visitError) {
            console.error("[visit-detail] Error fetching visit data:", visitError);
            return res.status(500).json({ error: "Error fetching visit data", details: visitError.message });
        }

        // Fetch triase data separately
        const { data: triaseData, error: triaseError } = await supabase
            .from("triase")
            .select(`
                id,
                tensi,
                nadi,
                suhu,
                spo2,
                resp,
                catatan,
                nurses:perawat_id (
                    id,
                    users:user_id (
                        nama
                    )
                )
            `)
            .eq("visit_id", visitId)
            .maybeSingle();

        if (triaseError) {
            console.error("[visit-detail] Error fetching triase:", triaseError);
        }

        // Fetch medical records separately
        const { data: medicalRecordData, error: medicalRecordError } = await supabase
            .from("medical_records")
            .select(`
                id,
                anamnesis,
                pemeriksaan_fisik,
                assessment,
                plan,
                disposition,
                disposition_notes,
                referred_to,
                created_at
            `)
            .eq("visit_id", visitId)
            .maybeSingle();

        if (medicalRecordError) {
            console.error("[visit-detail] Error fetching medical record:", medicalRecordError);
        }

        console.log("[visit-detail] Medical record data:", medicalRecordData);

        // Fetch prescriptions for this visit
        const { data: prescriptionData, error: prescriptionError } = await supabase
            .from("prescriptions")
            .select(`
                id,
                no_order,
                status,
                created_at,
                prescription_items (
                    id,
                    qty,
                    satuan,
                    instruksi,
                    medicines:medicine_id (
                        nama
                    )
                )
            `)
            .eq("visit_id", visitId);

        if (prescriptionError) {
            console.error("[visit-detail] Error fetching prescriptions:", prescriptionError);
        }

        // Format response
        const response = {
            visit: {
                id: visitData.id,
                no_reg: visitData.no_reg,
                created_at: visitData.created_at,
                status: visitData.status,
                ttv_status: visitData.ttv_status,
            },
            patient: visitData.patients,
            poli: visitData.poli,
            doctor: {
                nama: visitData.doctors?.users?.nama || "-"
            },
            triase: triaseData || null,
            soap: medicalRecordData || null,
            prescriptions: prescriptionData || []
        };

        console.log("[visit-detail] Response prepared successfully");

        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (error: any) {
        console.error("[visit-detail] Unexpected error:", error);
        return res.status(500).json({ error: error.message });
    }
}
