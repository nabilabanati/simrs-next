
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import VisitsTable from "@/components/dashboard/poli/VisitsTable"
import SearchInput from "@/components/dashboard/poli/SearchInput"
import Pagination from "@/components/dashboard/poli/Pagination"

interface PoliRelasi {
  poli: {
    id: string
    nama: string
  }
}

export default function DokterDashboardPage() {
  const router = useRouter()

  // ================= USER LOGIN =================
  const [user, setUser] = useState<any>(null)

  // ================= POLI =================
  const [poliName, setPoliName] = useState("Poli")

  // ================= DATA VISITS =================
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ================= UI STATE =================
  const [query, setQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // ================= DATE & TIME =================
  const [dateString, setDateString] = useState("")
  const [timeString, setTimeString] = useState("")

  // ================= INIT LOGIN & FETCH DATA =================
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "null")

    if (!u || u.role !== "dokter") {
      router.push("/login")
      return
    }

    setUser(u)

    const now = new Date()
    setDateString(
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    )
    setTimeString(now.toLocaleTimeString("id-ID"))

    fetchPoliAndVisits(u)
  }, [])

  // ================= FETCH POLI + VISITS (FINAL BENAR) =================
  async function fetchPoliAndVisits(userData: any) {
    setLoading(true)

    const { data: dokterData, error: dokterError } = await supabase
      .from("dokter")
      .select("id")
      .eq("id", userData.id)
      .single()

    if (dokterError || !dokterData?.id) {
      console.error("Dokter tidak ditemukan:", dokterError)
      setPoliName("Dokter Tidak Ditemukan")
      setVisits([])
      setLoading(false)
      return
    }

    const dokterId = dokterData.id

    const { data: poliRelasi, error: poliError } = await supabase
      .from("dokter_poli")
      .select("poli ( id, nama )")
      .eq("dokter_id", dokterId)

    if (poliError || !poliRelasi || poliRelasi.length === 0) {
      console.error("Poli tidak ditemukan:", poliError)
      setPoliName("Poli Tidak Ditemukan")
      setVisits([])
      setLoading(false)
      return
    }

    const poliData = poliRelasi[0] as any
    const poliId = poliData.poli.id
    setPoliName(poliData.poli.nama)

    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const end = new Date()
    end.setHours(23, 59, 59, 999)

    const { data: visitData, error: visitError } = await supabase
      .from("visits")
      .select(`
        id,
        no_reg,
        status,
        created_at,
        patients:patient_id ( nrm, nama, jk )
      `)
      .eq("poli_id", poliId)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (visitError) {
      console.error("Error ambil visits:", visitError)
      setVisits([])
      setLoading(false)
      return
    }

    const formatted = (visitData || []).map((v: any, i: number) => ({
      id: v.id,
      no: i + 1,
      noAntrian: v.no_reg?.slice(-4) || "0000",
      noRegistrasi: v.no_reg || "-",
      tanggal: new Date(v.created_at).toLocaleDateString("id-ID"),
      nrm: v.patients?.nrm || "-",
      nama: v.patients?.nama || "-",
      jk: v.patients?.jk || "-",
      status: v.status === "menunggu" ? "waiting" : "completed",
    }))

    // ✅ Baru dimasukkan ke STATE
    setVisits(formatted)
    setLoading(false)
  }

  // ================= SEARCH =================
  const filteredVisits = visits.filter((v) => {
    const text = query.toLowerCase()
    return (
      v.noRegistrasi.toLowerCase().includes(text) ||
      v.nrm.toLowerCase().includes(text) ||
      v.nama.toLowerCase().includes(text)
    )
  })

  const dataToShow = query ? filteredVisits : visits

  // ================= PAGINATION =================
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(dataToShow.length / ITEMS_PER_PAGE)

  const paginatedVisits = dataToShow.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  if (!user) return null

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <Breadcrumb items={[{ label: `Poli ${poliName}` }, { label: "Dashboard" }]} />

        {loading ? (
          <div className="text-center py-16 text-gray-500">Memuat data...</div>
        ) : (
          <>
            <div className="mt-8 mb-4 max-w-xs">
              <SearchInput value={query} onChange={setQuery} placeholder="Cari No. Reg, NRM, atau Nama Pasien" />
            </div>

            <VisitsTable visits={paginatedVisits} currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} />

            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </>
        )}
      </div>
    </div>
  )
}
