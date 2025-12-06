// pages/poliklinik/[poliSlug]/[pasienId]/index.tsx

"use client"

import { useRouter } from "next/router"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import PatientDetailHeader from "@/components/dashboard/patient/PatientDetailHeader"
import PatientInfoGrid from "@/components/dashboard/patient/PatientInfoGrid"
import TindakanList from "@/components/dashboard/patient/TindakanList"

import { MASTER_PATIENTS } from "@/lib/dummy/master/patients"
import { TODAY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/today"
import { POLI_LIST } from "@/lib/poli/dummy/poli-list"

export default function PatientDetailPage() {
  const router = useRouter()
  const { poliSlug, pasienId } = router.query

  if (!poliSlug || !pasienId || typeof poliSlug !== "string" || typeof pasienId !== "string") {
    return null
  }

  const patient = MASTER_PATIENTS.find((p: any) => p.id === pasienId)
  const poli = POLI_LIST.find((p: any) => p.slug === poliSlug)

  // Get all tindakan for this patient
  const patientTindakan = TODAY_PD_VISITS.filter(t => t.idPasien === pasienId)
  const patientName = patient?.nama || "Pasien"
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: poli?.name || "Poli", href: `/poliklinik/${poliSlug}` },
          { label: "Dashboard", href: `/poliklinik/${poliSlug}` },
          { label: patientName, href: `/poliklinik/${poliSlug}/${pasienId}` },
        ]}
      />

      {/* Patient Header */}
      <PatientDetailHeader patient={patient} />

      {/* Patient Info Grid */}
      <PatientInfoGrid patient={patient} />

      {/* Tindakan List */}
      <TindakanList
        tindakanList={patientTindakan}
        poliSlug={poliSlug}
        pasienId={pasienId}
      />
    </div>
  )
}
