import { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    const { user_id } = req.query

    if (!user_id || typeof user_id !== "string") {
        return res.status(400).json({ error: "user_id is required" })
    }

    try {
        // 1. Get doctor_id from user_id
        const { data: doctorData, error: doctorError } = await supabase
            .from("doctors")
            .select("id")
            .eq("user_id", user_id)
            .single()

        if (doctorError || !doctorData) {
            return res.status(404).json({ error: "Doctor not found" })
        }

        const doctorId = doctorData.id

        // 2. Get all visits for this doctor with patient info
        const { data: visitsData, error: visitsError } = await supabase
            .from("visits")
            .select(`
                id,
                patient_id,
                created_at,
                status,
                no_reg,
                poli:poli_id (nama),
                patients:patient_id (
                    id,
                    nrm,
                    nama,
                    nik,
                    jenis_kelamin,
                    tanggal_lahir
                ),
                medical_records (
                    id,
                    anamnesis,
                    pemeriksaan_fisik,
                    assessment,
                    plan,
                    disposition,
                    disposition_notes,
                    referred_to
                )
            `)
            .eq("dokter_id", doctorId)
            .order("created_at", { ascending: false })

        if (visitsError) {
            console.error("Error fetching visits:", visitsError)
            return res.status(500).json({ error: "Failed to fetch visits" })
        }

        // 3. Group by patient and aggregate data
        const patientMap = new Map()

        visitsData?.forEach((visit: any) => {
            const patientId = visit.patient_id
            const patient = visit.patients

            if (!patient) return

            if (!patientMap.has(patientId)) {
                patientMap.set(patientId, {
                    patient_id: patientId,
                    nrm: patient.nrm,
                    nama: patient.nama,
                    nik: patient.nik || "-",
                    jenis_kelamin: patient.jenis_kelamin,
                    tanggal_lahir: patient.tanggal_lahir,
                    total_visits: 0,
                    latest_visit_id: visit.id,
                    latest_visit_date: visit.created_at,
                    latest_visit_status: visit.status,
                    latest_no_reg: visit.no_reg,
                    latest_poli: visit.poli?.nama || "-",
                    latest_disposition: visit.medical_records?.disposition || null,
                    latest_medical_record: visit.medical_records || null,
                })
            }

            const patientData = patientMap.get(patientId)
            patientData.total_visits += 1

            // Update latest visit if this one is more recent
            if (new Date(visit.created_at) > new Date(patientData.latest_visit_date)) {
                patientData.latest_visit_id = visit.id
                patientData.latest_visit_date = visit.created_at
                patientData.latest_visit_status = visit.status
                patientData.latest_no_reg = visit.no_reg
                patientData.latest_poli = visit.poli?.nama || "-"
                patientData.latest_disposition = visit.medical_records?.disposition || null
                patientData.latest_medical_record = visit.medical_records || null
            }
        })

        // 4. Convert map to array and sort by latest visit date
        const patients = Array.from(patientMap.values()).sort((a, b) => {
            return new Date(b.latest_visit_date).getTime() - new Date(a.latest_visit_date).getTime()
        })

        return res.status(200).json({
            success: true,
            data: patients,
        })
    } catch (error) {
        console.error("Error in patient-history API:", error)
        return res.status(500).json({ error: "Internal server error" })
    }
}
