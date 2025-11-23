import { useRouter } from "next/router"

import { useVisits } from "@/hooks/use-visits"
import { formatDateTime } from "@/lib/shared/utils/date"

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
  
  const { dateString, timeString } = formatDateTime()

  const {
    today,
    loading,
    totalToday,
    totalWaiting,
    totalCompleted,
  } = useVisits(poliSlug as string)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[`Poli ${poliSlug}`, "Dashboard"]} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Dokter</h1>
          <p className="text-blue-600 font-semibold text-xl mt-1">
            Selamat Datang, Dokter!
          </p>
        </div>

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
              <SearchInput placeholder="Cari No. Reg, NRM, atau Nama Pasien" />
            </div>

            {/* TABLE */}
            <VisitsTable visits={today}/>
          </>
        )}
      </div>
    </div>
  )
}
