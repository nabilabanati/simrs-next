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
        const patientId = req.query.patient_id as string;

        if (!patientId) {
            return res.status(400).json({ error: "patient_id is required" });
        }

        // Fetch patient complete data
        const { data: patientData, error: patientError } = await supabase
            .from("patients")
            .select("*")
            .eq("id", patientId)
            .single();

        if (patientError || !patientData) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Fetch all visits
        const { data: visitsData, error: visitsError } = await supabase
            .from("visits")
            .select(`
                *,
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
            .eq("patient_id", patientId)
            .order("created_at", { ascending: false });

        if (visitsError) {
            console.error("Error fetching visits:", visitsError);
            return res.status(500).json({ error: visitsError.message });
        }

        const visitIds = visitsData?.map(v => v.id) || [];

        // Fetch triase data separately
        let triaseData: any[] = [];
        if (visitIds.length > 0) {
            const { data: triaseResult, error: triaseError } = await supabase
                .from("triase")
                .select(`
                    *,
                    nurses:perawat_id (
                        id,
                        users:user_id (
                            nama
                        )
                    )
                `)
                .in("visit_id", visitIds);

            if (!triaseError && triaseResult) {
                triaseData = triaseResult;
            }
        }

        // Fetch medical records separately
        let medicalRecordsData: any[] = [];
        if (visitIds.length > 0) {
            const { data: mrResult, error: mrError } = await supabase
                .from("medical_records")
                .select("*")
                .in("visit_id", visitIds);

            if (!mrError && mrResult) {
                medicalRecordsData = mrResult;
            }
        }

        // Fetch referrals separately
        let referralsData: any[] = [];
        if (visitIds.length > 0) {
            const { data: refResult, error: refError } = await supabase
                .from("referrals")
                .select(`
                    *,
                    from_poli:from_poli_id (nama),
                    to_poli:to_poli_id (nama),
                    from_doctor:from_doctor_id (
                        users:user_id (nama)
                    ),
                    to_doctor:to_doctor_id (
                        users:user_id (nama)
                    )
                `)
                .in("from_visit_id", visitIds);

            if (!refError && refResult) {
                referralsData = refResult;
            }
        }

        // Fetch prescriptions
        let prescriptionsData: any[] = [];
        if (visitIds.length > 0) {
            const { data: prescData, error: prescError } = await supabase
                .from("prescriptions")
                .select(`
                    id,
                    no_order,
                    visit_id,
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
                .in("visit_id", visitIds);

            if (!prescError && prescData) {
                prescriptionsData = prescData;
            }
        }

        // Create maps by visit_id
        const triaseByVisit: Record<string, any> = {};
        triaseData.forEach(t => {
            triaseByVisit[t.visit_id] = t;
        });

        const medicalRecordsByVisit: Record<string, any> = {};
        medicalRecordsData.forEach(mr => {
            medicalRecordsByVisit[mr.visit_id] = mr;
        });

        const referralsByVisit: Record<string, any[]> = {};
        referralsData.forEach(ref => {
            if (!referralsByVisit[ref.from_visit_id]) {
                referralsByVisit[ref.from_visit_id] = [];
            }
            referralsByVisit[ref.from_visit_id].push(ref);
        });

        const prescriptionsByVisit: Record<string, any[]> = {};
        prescriptionsData.forEach(presc => {
            if (!prescriptionsByVisit[presc.visit_id]) {
                prescriptionsByVisit[presc.visit_id] = [];
            }
            prescriptionsByVisit[presc.visit_id].push(presc);
        });

        // Format response
        const response = {
            patient: patientData,
            visits: visitsData?.map(visit => ({
                ...visit,
                triase: triaseByVisit[visit.id] || null,
                medical_record: medicalRecordsByVisit[visit.id] || null,
                referrals: referralsByVisit[visit.id] || [],
                prescriptions: prescriptionsByVisit[visit.id] || []
            })) || [],
            labResults: []
        };

        return res.status(200).json({
            success: true,
            data: response
        });
    } catch (error: any) {
        console.error("Error in patient-medical-record:", error);
        return res.status(500).json({ error: error.message });
    }
}
