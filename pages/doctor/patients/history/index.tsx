import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Search, User, Calendar, Eye, X, FileText } from "lucide-react"
import { toast } from "sonner"
import DoctorLayout from "@/components/layout/DoctorLayout"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"

interface PatientHistory {
    patient_id: string
    nrm: string
    nama: string
    nik: string
    jenis_kelamin: string
    tanggal_lahir: string
    total_visits: number
    latest_visit_id: string
    latest_visit_date: string
    latest_visit_status: string
    latest_no_reg: string
    latest_poli: string
    latest_disposition: string | null
    latest_medical_record: {
        id: string
        anamnesis: string
        pemeriksaan_fisik: string
        assessment: string
        plan: string
        disposition: string
        disposition_notes: string
        referred_to: string
    } | null
}

export default function PatientHistoryPage() {
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [patients, setPatients] = useState<PatientHistory[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<PatientHistory | null>(null)
    const [poliName, setPoliName] = useState<string>("Poli")
    const ITEMS_PER_PAGE = 15

    // Auth check
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")
        if (!u || u.role !== "dokter") {
            router.push("/login")
            return
        }
        setUser(u)
    }, [router])

    // Fetch patient history
    useEffect(() => {
        if (!user) return
        fetchPatientHistory()
    }, [user])

    const fetchPatientHistory = async () => {
        setLoading(true)
        try {
            // Fetch doctor's poli name
            const { data: doctorData } = await supabase
                .from("doctors")
                .select(`
                    doctor_poli (
                        poli:poli_id (
                            nama
                        )
                    )
                `)
                .eq("user_id", user.id)
                .single();

            if (doctorData?.doctor_poli && Array.isArray(doctorData.doctor_poli) && doctorData.doctor_poli.length > 0) {
                const firstPoli = doctorData.doctor_poli[0] as any;
                if (firstPoli?.poli?.nama) {
                    setPoliName(firstPoli.poli.nama);
                }
            }

            const response = await fetch(`/api/doctor/patient-history?user_id=${user.id}`)
            const data = await response.json()

            if (response.ok) {
                setPatients(data.data || [])
            } else {
                console.error("Error fetching patient history:", data.error)
                toast.error("Gagal memuat data riwayat pasien")
                setPatients([])
            }
        } catch (error) {
            console.error("Error fetching patient history:", error)
            toast.error("Terjadi kesalahan saat memuat data")
            setPatients([])
        } finally {
            setLoading(false)
        }
    }

    // Calculate age
    const calculateAge = (birthDate: string) => {
        if (!birthDate) return "-"
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return `${age} tahun`
    }

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
    }

    // Get disposition label
    const getDispositionLabel = (disposition: string | null) => {
        if (!disposition) return "-"

        switch (disposition) {
            case "pulang":
                return "Pulang"
            case "rujuk_rs":
                return "Rujuk ke RS"
            case "konsul_internal":
                return "Pindah Poli"
            default:
                return "-"
        }
    }

    // Get disposition color
    const getDispositionColor = (disposition: string | null) => {
        if (!disposition) return "bg-gray-100 text-gray-700"

        switch (disposition) {
            case "pulang":
                return "bg-green-100 text-green-700"
            case "rujuk_rs":
                return "bg-blue-100 text-blue-700"
            case "konsul_internal":
                return "bg-yellow-100 text-yellow-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    // Filter patients by search query
    const filteredPatients = useMemo(() => {
        if (!searchQuery) return patients

        const query = searchQuery.toLowerCase()
        return patients.filter((patient) => {
            return (
                patient.nama.toLowerCase().includes(query) ||
                patient.nrm.toLowerCase().includes(query) ||
                patient.nik.toLowerCase().includes(query)
            )
        })
    }, [patients, searchQuery])

    // Pagination
    const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE)
    const paginatedPatients = filteredPatients.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    if (!user || loading) {
        return (
            <DoctorLayout>
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat data...</p>
                    </div>
                </div>
            </DoctorLayout>
        )
    }

    return (
        <DoctorLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    {/* Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: `${poliName}`, href: "/doctor" },
                            { label: "Riwayat Kunjungan" },
                        ]}
                    />

                    {/* Header */}
                    <div className="mb-8 mt-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Riwayat Kunjungan
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari No. Reg, NRM, dan Nama Pasien"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            NO
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            TANGGAL
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            NO. REG
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            NRM
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            NAMA PASIEN
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            J.K.
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Rekam Medis
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedPatients.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <User className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p className="font-medium">
                                                        {searchQuery
                                                            ? "Tidak ada pasien yang sesuai dengan pencarian"
                                                            : "Belum ada riwayat kunjungan pasien"}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPatients.map((patient, index) => {
                                            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                                            return (
                                                <tr
                                                    key={patient.latest_visit_id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {globalIndex}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(patient.latest_visit_date)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {patient.latest_no_reg}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {patient.nrm}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {patient.nama}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {patient.jenis_kelamin}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => {
                                                                router.push(`/doctor/patients/${patient.latest_visit_id}?from=history`)
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                            title="Lihat Detail Pasien"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDispositionColor(
                                                                patient.latest_disposition
                                                            )}`}
                                                        >
                                                            {getDispositionLabel(patient.latest_disposition)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    &lt;
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    // Show first page, last page, current page, and pages around current
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 rounded text-sm ${currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return (
                                            <span key={page} className="px-2">
                                                ...
                                            </span>
                                        )
                                    }
                                    return null
                                })}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Medical Record Modal */}
                    {modalOpen && selectedPatient && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                                {/* Modal Header */}
                                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 p-2 rounded-lg">
                                            <FileText className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Rekam Medis Kunjungan Terakhir
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                {selectedPatient.nama} - {selectedPatient.nrm}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setModalOpen(false)
                                            setSelectedPatient(null)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                    {selectedPatient.latest_medical_record ? (
                                        <div className="space-y-6">
                                            {/* Visit Info */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Tanggal Kunjungan</p>
                                                        <p className="font-medium text-gray-900">
                                                            {formatDate(selectedPatient.latest_visit_date)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Poli</p>
                                                        <p className="font-medium text-gray-900">
                                                            {selectedPatient.latest_poli}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SOAP */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Subjective (Anamnesis)
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-900 whitespace-pre-wrap">
                                                        {selectedPatient.latest_medical_record.anamnesis || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Objective (Pemeriksaan Fisik)
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-900 whitespace-pre-wrap">
                                                        {selectedPatient.latest_medical_record.pemeriksaan_fisik || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Assessment (Diagnosis)
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-900 whitespace-pre-wrap">
                                                        {selectedPatient.latest_medical_record.assessment || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Plan (Rencana Tindakan)
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="text-gray-900 whitespace-pre-wrap">
                                                        {selectedPatient.latest_medical_record.plan || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Disposition */}
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                                    Tindakan Dokter
                                                </h3>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDispositionColor(
                                                                selectedPatient.latest_disposition
                                                            )}`}
                                                        >
                                                            {getDispositionLabel(selectedPatient.latest_disposition)}
                                                        </span>
                                                        {selectedPatient.latest_medical_record.disposition_notes && (
                                                            <p className="text-gray-700">
                                                                {selectedPatient.latest_medical_record.disposition_notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {selectedPatient.latest_medical_record.referred_to && (
                                                        <p className="text-gray-700 mt-2">
                                                            <span className="font-medium">Rujukan ke:</span>{" "}
                                                            {selectedPatient.latest_medical_record.referred_to}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 font-medium">
                                                Belum ada rekam medis untuk kunjungan ini
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                                    <Button
                                        onClick={() => {
                                            setModalOpen(false)
                                            setSelectedPatient(null)
                                        }}
                                        variant="outline"
                                    >
                                        Tutup
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DoctorLayout>
    )
}
