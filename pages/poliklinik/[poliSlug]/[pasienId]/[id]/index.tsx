// pages/poliklinik/[poliSlug]/pasien/[pasienId]/[id]/index.tsx

import { useRouter } from "next/router"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"

import PatientInfoCard from "@/components/dashboard/patien-detail/PatientInfoCard"
import TindakanAccordion from "@/components/dashboard/patien-detail/TindakanAccordion"

import { MASTER_PATIENTS } from "@/lib/dummy/master/patients"
import { TODAY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/today"

export default function KunjunganDetailPage() {
    const router = useRouter()
    const { poliSlug, pasienId, id } = router.query

    if (!poliSlug || !pasienId || !id) return null

    const patient = MASTER_PATIENTS.find(p => p.id === pasienId)
    // Find by noRegistrasi since PatientVisit type doesn't have 'id' property
    const tindakan = TODAY_PD_VISITS.find(t => t.noRegistrasi === id || t.idPasien === pasienId)

    // Get patient name from MASTER_PATIENTS or fallback to visit data
    const patientName = patient?.nama || tindakan?.nama || "Pasien"

    return (
        <div className="min-h-screen bg-gray-50 p-6">

            <Breadcrumb
                items={[
                    { label: "Dashboard", href: `/poliklinik/${poliSlug}` },
                    { label: patientName, href: `/poliklinik/${poliSlug}/${pasienId}` },
                    { label: "Detail Tindakan" },
                ]}
            />

            <PatientInfoCard patient={patient} />

            <div className="mt-6">
                <TindakanAccordion tindakan={tindakan} />
            </div>
        </div>
    )
}
