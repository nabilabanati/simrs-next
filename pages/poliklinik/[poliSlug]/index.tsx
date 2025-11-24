import { useRouter } from "next/router"
import { useState, useEffect } from "react"
import { POLI_LIST } from "@/lib/poli/dummy/poli-list"

import { useVisits } from "@/hooks/use-visits"
import { getFormattedDateTime } from "@/lib/shared/utils/date"

import DashboardHeader from "@/components/dashboard/poli/DashboardHeader"
import SummaryCards from "@/components/dashboard/poli/SummaryCards"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import VisitsTable from "@/components/dashboard/poli/VisitsTable"
import SearchInput from "@/components/dashboard/poli/SearchInput"
import Pagination from "@/components/dashboard/poli/Pagination"

export default function PoliDashboardPage() {
  const router = useRouter()
  const { poliSlug } = router.query

  if (!poliSlug || typeof poliSlug !== "string") return null

  const poli = POLI_LIST.find((p) => p.slug === poliSlug)
  const poliName = poli?.name || poliSlug

  // STATES
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // REALTIME CLOCK
  const { dateString, timeString } = getFormattedDateTime()

  // HOOK DATA
  const {
    today,
    loading,
    totalToday,
    totalWaiting,
    totalCompleted,
  } = useVisits(poliSlug)

  // SEARCH
  const filteredVisits = today.filter((v) => {
    const text = query.toLowerCase()
    return (
      v.noRegistrasi.toLowerCase().includes(text) ||
      v.nrm.toLowerCase().includes(text) ||
      v.nama.toLowerCase().includes(text) ||
      v.noAntrian.toLowerCase().includes(text)
    )
  })

  // RESET PAGE IF SEARCHING
  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  // DATA YANG DIPAKAI
  const dataToShow = query ? filteredVisits : today

  // ==== SORT WAITING DI ATAS, COMPLETED DI BAWAH ====
  const sortedVisits = [...dataToShow].sort((a, b) => {
    if (a.status === "waiting" && b.status === "completed") return -1
    if (a.status === "completed" && b.status === "waiting") return 1

    // sort nomor antrian
    return Number(a.noAntrian) - Number(b.noAntrian)
  })

  // PAGINATION
  const ITEMS_PER_PAGE = 10

  const totalPages = Math.ceil(sortedVisits.length / ITEMS_PER_PAGE)

  const paginatedVisits = sortedVisits.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="p-6">
        {/* BREADCRUMB */}
        <Breadcrumb items={[poliName, "Dashboard"]} />

        {/* HEADER */}
        <DashboardHeader
          doctorName="Andre"
          greeting="Selamat Datang"
        />

        {loading ? (
          <div className="text-center py-16 text-gray-500">Memuat data...</div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
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
            <VisitsTable
              visits={paginatedVisits}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />

            {/* PAGINATION */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  )
}
