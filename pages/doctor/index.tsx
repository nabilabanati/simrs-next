import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import DoctorLayout from "@/components/layout/DoctorLayout"
import DashboardHeader from "@/components/dashboard/poli/DashboardHeader"
import SummaryCards from "@/components/dashboard/poli/SummaryCards"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"
import DoctorVisitsTable from "@/components/dashboard/doctor/DoctorVisitsTable"
import SearchInput from "@/components/dashboard/poli/SearchInput"
import Pagination from "@/components/dashboard/poli/Pagination"

export default function DoctorDashboard() {
    const router = useRouter()

    // User & Doctor State
    const [user, setUser] = useState<any>(null)
    const [doctorName, setDoctorName] = useState("")
    const [poliName, setPoliName] = useState("")

    // Data State
    const [visits, setVisits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // UI State
    const [query, setQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    // Date & Time
    const [dateString, setDateString] = useState("")
    const [timeString, setTimeString] = useState("")

    // ================= INIT: Check Auth =================
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")

        if (!u || u.role !== "dokter") {
            if (u && u.role !== "dokter") {
                toast.error("Akses ditolak. Anda bukan dokter.")
            }
            router.push("/login")
            return
        }

        setUser(u)
        setDoctorName(u.nama || "Dokter")

        const now = new Date()
        setDateString(
            now.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
            })
        )
        setTimeString(
            now.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            })
        )
    }, [router])

    // ================= FETCH: Doctor Visits =================
    useEffect(() => {
        if (!user) return

        fetchDoctorVisits()

        // Auto-refresh every 5 seconds (smooth refresh)
        const interval = setInterval(() => {
            fetchDoctorVisits(true)
        }, 5000)

        return () => clearInterval(interval)
    }, [user])

    async function fetchDoctorVisits(isRefresh = false) {
        if (isRefresh) {
            setRefreshing(true)
        } else {
            setLoading(true)
        }

        try {
            // 1. Get doctor data
            const { data: doctorData, error: doctorError } = await supabase
                .from("doctors")
                .select("id")
                .eq("user_id", user.id)
                .single()

            if (doctorError || !doctorData?.id) {
                console.error("Doctor not found:", doctorError)
                setVisits([])
                setLoading(false)
                return
            }

            const doctorId = doctorData.id

            // 2. Get poli info
            const { data: poliRelasi } = await supabase
                .from("doctor_poli")
                .select("poli ( id, nama )")
                .eq("dokter_id", doctorId)
                .limit(1)

            if (poliRelasi && poliRelasi.length > 0) {
                const poliData = poliRelasi[0] as any
                setPoliName(poliData.poli.nama)
            }

            // 3. Get today's visits
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
          ttv_status,
          created_at,
          patients:patient_id ( nrm, nama, jenis_kelamin )
        `)
                .eq("dokter_id", doctorId)
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString())
                .order("created_at", { ascending: true })

            if (visitError) {
                console.error("Error fetching visits:", visitError)
                setVisits([])
                setLoading(false)
                return
            }

            const formatted = (visitData || []).map((v: any, i: number) => ({
                id: v.id,
                no: i + 1,
                noAntrian: v.no_reg?.slice(-4) || "0000",
                noRegistrasi: v.no_reg || "-",
                tanggalKunjungan: new Date(v.created_at).toLocaleDateString("id-ID"),
                nrm: v.patients?.nrm || "-",
                nama: v.patients?.nama || "-",
                jenisKelamin: v.patients?.jenis_kelamin || "-",
                ttvStatus: v.ttv_status || "belum",
                status: v.status === "selesai" ? "completed" : "waiting",
            }))

            // Sort: waiting visits first, completed visits last
            formatted.sort((a, b) => {
                if (a.status === 'waiting' && b.status === 'completed') return -1
                if (a.status === 'completed' && b.status === 'waiting') return 1
                return 0
            })

            setVisits(formatted)
        } catch (error) {
            console.error("Error in fetchDoctorVisits:", error)
            setVisits([])
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // ================= SUMMARY =================
    const totalToday = visits.length
    const totalWaiting = visits.filter((v) => v.status === "waiting").length
    const totalCompleted = visits.filter((v) => v.status === "completed").length

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

    const paginatedVisits = dataToShow.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    if (!user) return null

    // ================= RENDER =================
    return (
        <DoctorLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    <Breadcrumb
                        items={[
                            { label: `${poliName}` },
                            { label: "Dashboard Dokter" },
                        ]}
                    />

                    <DashboardHeader
                        title="Dashboard Dokter"
                        userName={doctorName}
                        greeting="Selamat Datang"
                    />

                    {loading ? (
                        <div className="text-center py-16 text-gray-500">
                            Memuat data...
                        </div>
                    ) : (
                        <>
                            <SummaryCards
                                total={totalToday}
                                waiting={totalWaiting}
                                completed={totalCompleted}
                                loading={loading}
                            />

                            <div className="mt-8 mb-4 max-w-xs">
                                <SearchInput
                                    value={query}
                                    onChange={setQuery}
                                    placeholder="Cari No. Reg, NRM, atau Nama Pasien"
                                />
                            </div>

                            <DoctorVisitsTable
                                visits={paginatedVisits}
                                currentPage={currentPage}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </DoctorLayout>
    )
}
