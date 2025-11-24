import { useRouter } from "next/router"
import { useState } from "react"

import { useVisits } from "@/hooks/use-visits"
import { getFormattedDateTime } from "@/lib/shared/utils/date"

import DashboardHeader from "@/components/dashboard/poli/DashboardHeader"
import SummaryCards from "@/components/dashboard/poli/SummaryCards"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import VisitsTable from "@/components/dashboard/poli/VisitsTable"
import SearchInput from "@/components/dashboard/poli/SearchInput"

export default function PoliDashboardPage() {
  const router = useRouter()
  const { poliSlug } = router.query

  if (!poliSlug || typeof poliSlug !== "string") return null

  // DATA FROM HOOKS
  const [query, setQuery] = useState("")


  const { dateString, timeString } = getFormattedDateTime()

  const {
    today,
    loading,
    totalToday,
    totalWaiting,
    totalCompleted,
  } = useVisits(poliSlug as string)

  const filteredVisits = today.filter((v) => {
  const text = query.toLowerCase()
  return (
      v.noRegistrasi.toLowerCase().includes(text) ||
      v.nrm.toLowerCase().includes(text) ||
      v.nama.toLowerCase().includes(text) ||
      v.noAntrian.toLowerCase().includes(text)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        doctorName="Andre"
        greeting="Selamat Datang"
      />
      
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[`Poli ${poliSlug}`, "Dashboard"]} />

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Memuat data...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards
              total={totalToday}
              waiting={totalWaiting}
              completed={totalCompleted}
              loading={loading}
            />

            {/* SEARCH */}
            <div className="mt-8 mb-4 max-w-xs">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Cari No. Reg, NRM, atau Nama Pasien"
              />
            </div>

            {/* TABLE */}
            <VisitsTable visits={query ? filteredVisits : today} />

          </>
        )}
      </div>
    </div>
  )
}
