// // pages/poliklinik/[poliSlug]/pasien/[pasienId]/[id]/index.tsx

// import { useRouter } from "next/router"
// import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"

// import PatientInfoCard from "@/components/dashboard/patien-detail/PatientInfoCard"
// import TindakanAccordion from "@/components/dashboard/patien-detail/TindakanAccordion"

// import { MASTER_PATIENTS } from "@/lib/dummy/master/patients"
// import { HISTORY_PD_VISITS } from "@/lib/dummy/poli/penyakit-dalam/history"

// export default function KunjunganDetailPage() {
//   const router = useRouter()
//   const { poliSlug, pasienId, id } = router.query

//   if (!poliSlug || !pasienId || !id) return null

//   const patient = MASTER_PATIENTS.find(p => p.id === pasienId)
//   const tindakan = HISTORY_PD_VISITS.find(t => t.idPasien === pasienId && t.id === id)

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">

//       <Breadcrumb
//         items={[
//           { label: `Poli ${poliSlug}`, href: `/poliklinik/${poliSlug}` },
//           { label: patient?.nama ?? "Pasien", href: `/poliklinik/${poliSlug}/pasien/${pasienId}` },
//           { label: "Detail Tindakan", href: "" },
//         ]}
//       />

//       <PatientInfoCard patient={patient} />

//       <div className="mt-6">
//         <TindakanAccordion tindakan={tindakan} />
//       </div>
//     </div>
//   )
// }
