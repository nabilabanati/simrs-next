import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clipboard, CheckCircle } from "lucide-react"

export default function PatientDetailPage() {
    const router = useRouter()
    const { id } = router.query // visit_id

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Patient & Visit Data
    const [patient, setPatient] = useState<any>(null)
    const [currentVisit, setCurrentVisit] = useState<any>(null)
    const [visitHistory, setVisitHistory] = useState<any[]>([])
    const [hasSOAPToday, setHasSOAPToday] = useState(false)

    // ================= AUTH CHECK =================
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")
        if (!u || u.role !== "dokter") {
            router.push("/login")
            return
        }
        setUser(u)
    }, [router])

    // ================= FETCH DATA =================
    useEffect(() => {
        if (!id || !user) return
        fetchPatientAndVisits()
    }, [id, user])

    async function fetchPatientAndVisits() {
        setLoading(true)

        try {
            // 1. Get current visit data
            const { data: visitData, error: visitError } = await supabase
                .from("visits")
                .select(`
          *,
          patients:patient_id (*),
          poli:poli_id (nama),
          doctors:dokter_id (users:user_id (nama))
        `)
                .eq("id", id)
                .single()

            if (visitError || !visitData) {
                console.error("Visit not found:", visitError)
                setLoading(false)
                return
            }

            setCurrentVisit(visitData)
            setPatient(visitData.patients)

            // 2. Check if SOAP exists for this visit
            const { data: soapData } = await supabase
                .from("medical_records")
                .select("id")
                .eq("visit_id", id)
                .single()

            setHasSOAPToday(!!soapData)

            // 3. Get all visit history for this patient
            const { data: historyData, error: historyError } = await supabase
                .from("visits")
                .select(`
          id,
          no_reg,
          created_at,
          status,
          poli:poli_id (nama),
          doctors:dokter_id (users:user_id (nama)),
          medical_records (anamnesis, assessment)
        `)
                .eq("patient_id", visitData.patient_id)
                .order("created_at", { ascending: false })

            if (!historyError) {
                setVisitHistory(historyData || [])
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const isTTVDone = currentVisit?.ttv_status === "selesai"
    const canCompleteVisit = hasSOAPToday && currentVisit?.status !== "selesai"

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Memuat data pasien...</div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Pasien tidak ditemukan</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/doctor")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Dashboard
                    </Button>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Detail Pasien
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel: Patient Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Informasi Pasien</h2>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">NRM</p>
                                    <p className="font-medium">{patient.nrm}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">NIK</p>
                                    <p className="font-medium">{patient.nik || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Nama Lengkap</p>
                                    <p className="font-medium">{patient.nama}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tempat, Tanggal Lahir</p>
                                    <p className="font-medium">
                                        {patient.tempat_lahir || "-"},{" "}
                                        {patient.tanggal_lahir
                                            ? new Date(patient.tanggal_lahir).toLocaleDateString("id-ID")
                                            : "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Usia</p>
                                    <p className="font-medium">
                                        {patient.tanggal_lahir
                                            ? `${new Date().getFullYear() - new Date(patient.tanggal_lahir).getFullYear()} tahun`
                                            : "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Jenis Kelamin</p>
                                    <p className="font-medium">{patient.jenis_kelamin || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Golongan Darah</p>
                                    <p className="font-medium">{patient.golongan_darah || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pekerjaan</p>
                                    <p className="font-medium">{patient.pekerjaan || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Alamat</p>
                                    <p className="font-medium">{patient.alamat || "-"}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <Button
                                    className="w-full"
                                    disabled={!isTTVDone}
                                    onClick={() =>
                                        router.push(`/doctor/patients/visit/${currentVisit.id}`)
                                    }
                                >
                                    <Clipboard className="w-4 h-4 mr-2" />
                                    {hasSOAPToday ? "Edit Pemeriksaan" : "Tambah Pemeriksaan"}
                                </Button>

                                {!isTTVDone && (
                                    <p className="text-xs text-gray-500 text-center">
                                        *Menunggu TTV dari perawat
                                    </p>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={!canCompleteVisit}
                                    onClick={() => {
                                        // TODO: Show confirmation modal
                                        alert("Selesaikan kunjungan - fitur ini akan dibuat")
                                    }}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Selesaikan Kunjungan
                                </Button>

                                {!hasSOAPToday && (
                                    <p className="text-xs text-gray-500 text-center">
                                        *Selesaikan pemeriksaan terlebih dahulu
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Visit History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Riwayat Kunjungan</h2>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                                            <th className="px-4 py-3 text-left font-medium">No. Reg</th>
                                            <th className="px-4 py-3 text-left font-medium">Poli</th>
                                            <th className="px-4 py-3 text-left font-medium">Dokter</th>
                                            <th className="px-4 py-3 text-left font-medium">Diagnosis</th>
                                            <th className="px-4 py-3 text-left font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {visitHistory.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-8 text-center text-gray-500"
                                                >
                                                    Belum ada riwayat kunjungan
                                                </td>
                                            </tr>
                                        ) : (
                                            visitHistory.map((visit: any) => (
                                                <tr
                                                    key={visit.id}
                                                    className={`hover:bg-gray-50 ${visit.id === currentVisit?.id ? "bg-blue-50" : ""
                                                        }`}
                                                >
                                                    <td className="px-4 py-3">
                                                        {new Date(visit.created_at).toLocaleDateString("id-ID")}
                                                    </td>
                                                    <td className="px-4 py-3">{visit.no_reg}</td>
                                                    <td className="px-4 py-3">{visit.poli?.nama || "-"}</td>
                                                    <td className="px-4 py-3">
                                                        {visit.doctors?.users?.nama || "-"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {visit.medical_records?.assessment || "-"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-1 text-xs rounded-full font-medium ${visit.status === "selesai"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                                }`}
                                                        >
                                                            {visit.status === "selesai" ? "Selesai" : "Aktif"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
