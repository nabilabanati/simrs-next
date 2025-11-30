// pages/poliklinik/[poliSlug]/pasien/[pasienId]/index.tsx

import { useRouter } from "next/router"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import PatientInfoCard from "@/components/dashboard/patien-detail/PatientInfoCard"
import TindakanTable from "@/components/dashboard/patien-detail/TindakanTable"

import { MASTER_PATIENTS } from "@/lib/dummy/master/patients"

export default function PatientDetailPage() {
  const router = useRouter()
  const { poliSlug, pasienId } = router.query

  if (!poliSlug || !pasienId) return null

  const patient = MASTER_PATIENTS.find(p => p.id === pasienId)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb interaktif */}
      <Breadcrumb
        items={[
          { label: `Poli ${poliSlug}`, href: `/poliklinik/${poliSlug}` },
          { label: "Data Pasien", href: "#" },
          { label: patient?.nama ?? "Pasien", href: "" }
        ]}
      />

      {/* Card Data Pasien */}
      <PatientInfoCard patient={patient} />

      {/* Tabel / Accordion Tindakan */}
      <TindakanTable pasienId={pasienId as string} />
    </div>
  )
}
