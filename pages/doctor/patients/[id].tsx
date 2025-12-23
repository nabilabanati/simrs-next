import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Clipboard,
    CheckCircle,
    Receipt,
    User,
    Activity,
    Heart,
    Thermometer,
    Wind,
    Ruler,
    Weight,
    Calendar,
    MapPin,
    Phone,
    Briefcase,
    Droplet,
    Pill,
    FlaskConical
} from "lucide-react"
import { toast } from "sonner"
import DoctorLayout from "@/components/layout/DoctorLayout"
import InvoiceModal from "@/components/modals/InvoiceModal"
import MedicalRecordModal from "@/components/modals/MedicalRecordModal"
import CompleteMedicalRecordModal from "@/components/modals/CompleteMedicalRecordModal"
import ReferralLetterModal from "@/components/modals/ReferralLetterModal"
import AccumulatedInvoiceModal from "@/components/modals/AccumulatedInvoiceModal"
import PaymentCodeModal from "@/components/modals/PaymentCodeModal"
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb"

type TabType = "tindakan" | "resep" | "lab"

export default function PatientDetailPage() {
    const router = useRouter()
    const { id } = router.query // visit_id

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [completing, setCompleting] = useState(false)

    // Patient & Visit Data
    const [patient, setPatient] = useState<any>(null)
    const [currentVisit, setCurrentVisit] = useState<any>(null)
    const [visitHistory, setVisitHistory] = useState<any[]>([])
    const [hasSOAPToday, setHasSOAPToday] = useState(false)

    // Tab State
    const [activeTab, setActiveTab] = useState<TabType>("tindakan")
    const [prescriptions, setPrescriptions] = useState<any[]>([])
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)

    // Modals
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
    const [medicalRecordModalOpen, setMedicalRecordModalOpen] = useState(false)
    const [completeMedicalRecordModalOpen, setCompleteMedicalRecordModalOpen] = useState(false)
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null)
    const [referralLetterModalOpen, setReferralLetterModalOpen] = useState(false)
    const [accumulatedInvoiceModalOpen, setAccumulatedInvoiceModalOpen] = useState(false)
    const [paymentCodeModalOpen, setPaymentCodeModalOpen] = useState(false)

    // Disposition tracking
    const [disposition, setDisposition] = useState<string | null>(null)
    const [referralData, setReferralData] = useState<any>(null)

    // Date Filter
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    // Breadcrumb items based on navigation source
    const breadcrumbItems = useMemo(() => {
        const from = router.query.from as string | undefined;
        const poliName = currentVisit?.poli?.nama || "Poli";

        if (from === 'history') {
            return [
                { label: poliName, href: "/doctor" },
                { label: "Riwayat Kunjungan", href: "/doctor/patients/history" },
                { label: patient?.nama || "Pasien" },
            ];
        }
        return [
            { label: currentVisit?.poli?.nama || "Poli", href: "/doctor" },
            { label: "Dashboard Dokter", href: "/doctor" },
            { label: patient?.nama || "Pasien" },
        ];
    }, [router.query.from, patient?.nama, currentVisit?.poli?.nama]);

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

            // 2. Check if SOAP exists for this visit and get disposition
            const { data: soapData } = await supabase
                .from("medical_records")
                .select("id, disposition")
                .eq("visit_id", id)
                .single()

            setHasSOAPToday(!!soapData)
            if (soapData?.disposition) {
                setDisposition(soapData.disposition)
            }

            // 2.5. Get referral data if exists
            const { data: referralInfo } = await supabase
                .from("referrals")
                .select(`
                    *,
                    to_poli:to_poli_id (nama),
                    to_doctor:to_doctor_id (users:user_id (nama))
                `)
                .eq("from_visit_id", id)
                .maybeSingle()

            if (referralInfo) {
                setReferralData(referralInfo)
            }

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
          medical_records (anamnesis, assessment, disposition)
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

    // Fetch prescriptions when Resep tab is active
    useEffect(() => {
        if (activeTab === "resep" && patient?.id) {
            fetchPrescriptions()
        }
    }, [activeTab, patient?.id])

    async function fetchPrescriptions() {
        setLoadingPrescriptions(true)
        try {
            const response = await fetch(`/api/doctor/get-prescriptions?user_id=${user.id}&patient_id=${patient.id}`)
            const data = await response.json()

            if (response.ok) {
                setPrescriptions(data.data || [])
            } else {
                console.error("Error fetching prescriptions:", data.error)
                setPrescriptions([])
            }
        } catch (error) {
            console.error("Error fetching prescriptions:", error)
            setPrescriptions([])
        } finally {
            setLoadingPrescriptions(false)
        }
    }

    const handleCompleteVisit = async () => {
        if (!currentVisit?.id) return

        const confirmed = window.confirm(
            "Apakah Anda yakin ingin menyelesaikan kunjungan ini?\n\n" +
            "Setelah diselesaikan, status kunjungan akan berubah menjadi 'Selesai'."
        )

        if (!confirmed) return

        setCompleting(true)

        try {
            const response = await fetch('/api/doctor/complete-visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visit_id: currentVisit.id }),
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Kunjungan berhasil diselesaikan')

                // Fetch fresh disposition data
                const { data: soapData } = await supabase
                    .from('medical_records')
                    .select('disposition')
                    .eq('visit_id', currentVisit.id)
                    .single()

                const freshDisposition = soapData?.disposition

                // Debug logging
                console.log('=== MODAL SELECTION DEBUG ===')
                console.log('Fresh Disposition:', freshDisposition)
                console.log('Is Referral:', currentVisit?.is_referral)

                // Refresh all data
                await fetchPatientAndVisits()

                // Open appropriate modal based on fresh disposition
                if (freshDisposition === 'konsul_internal') {
                    // For internal consultation, show referral letter
                    console.log('Opening: ReferralLetterModal')
                    setReferralLetterModalOpen(true)
                } else if (freshDisposition === 'pulang' || freshDisposition === 'rujuk_rs') {
                    // For discharge or external referral, ALWAYS show payment code modal
                    // Doctors should NEVER see the full invoice - only cashiers can
                    console.log('Opening: PaymentCodeModal (for cashier verification)')
                    setPaymentCodeModalOpen(true)
                } else {
                    console.log('No modal opened - disposition:', freshDisposition)
                }
            } else {
                toast.error(data.error || 'Gagal menyelesaikan kunjungan')
            }
        } catch (error) {
            console.error('Error completing visit:', error)
            toast.error('Terjadi kesalahan saat menyelesaikan kunjungan')
        } finally {
            setCompleting(false)
        }
    }

    // Helper function to get patient initials
    const getInitials = (name: string) => {
        if (!name) return "?"
        const parts = name.split(" ")
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    // Helper function to calculate age
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

    // Helper function to get disposition display label
    const getDispositionLabel = (disposition: string | null) => {
        if (!disposition) return "Belum Ada Tindakan"

        switch (disposition) {
            case "pulang":
                return "Pulang"
            case "rujuk_rs":
                return "Rujuk RS"
            case "konsul_internal":
                return "Konsul Internal"
            default:
                return "Belum Ada Tindakan"
        }
    }

    // Helper function to get disposition badge color
    const getDispositionColor = (disposition: string | null) => {
        if (!disposition) return "bg-gray-100 text-gray-700 border-gray-200"

        switch (disposition) {
            case "pulang":
                return "bg-green-100 text-green-700 border-green-200"
            case "rujuk_rs":
                return "bg-blue-100 text-blue-700 border-blue-200"
            case "konsul_internal":
                return "bg-purple-100 text-purple-700 border-purple-200"
            default:
                return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    // ================= COMPUTED VALUES =================
    const isTTVDone = currentVisit?.ttv_status === "selesai"
    const canCompleteVisit = isTTVDone && hasSOAPToday && currentVisit?.status !== "selesai"

    // Filter visit history by date
    const filteredVisitHistory = useMemo(() => {
        if (!startDate && !endDate) return visitHistory

        return visitHistory.filter((visit: any) => {
            const visitDate = new Date(visit.created_at)
            const start = startDate ? new Date(startDate) : null
            const end = endDate ? new Date(endDate) : null

            if (start && end) {
                return visitDate >= start && visitDate <= end
            } else if (start) {
                return visitDate >= start
            } else if (end) {
                return visitDate <= end
            }
            return true
        })
    }, [visitHistory, startDate, endDate])

    // Filter prescriptions by date
    const filteredPrescriptions = useMemo(() => {
        if (!startDate && !endDate) return prescriptions

        return prescriptions.filter((prescription: any) => {
            const prescriptionDate = new Date(prescription.created_at)
            const start = startDate ? new Date(startDate) : null
            const end = endDate ? new Date(endDate) : null

            if (start && end) {
                return prescriptionDate >= start && prescriptionDate <= end
            } else if (start) {
                return prescriptionDate >= start
            } else if (end) {
                return prescriptionDate <= end
            }
            return true
        })
    }, [prescriptions, startDate, endDate])

    if (!user || loading) {
        return (
            <DoctorLayout>
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat data pasien...</p>
                    </div>
                </div>
            </DoctorLayout>
        )
    }

    if (!patient) {
        return (
            <DoctorLayout>
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                    <div className="text-gray-500">Pasien tidak ditemukan</div>
                </div>
            </DoctorLayout>
        )
    }

    return (
        <DoctorLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    {/* Breadcrumb */}
                    <Breadcrumb items={breadcrumbItems} />

                    {/* Header */}
                    <div className="mb-6 mt-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {patient.nama}
                        </h1>
                        <p className="text-gray-600">NRM: {patient.nrm}</p>
                    </div>

                    {/* Patient Information Card - Horizontal Layout */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Column 1 */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">No. Reg</p>
                                    <p className="font-semibold text-gray-900">{currentVisit?.no_reg || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">NIK</p>
                                    <p className="font-semibold text-gray-900">{patient.nik || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Tgl. Lahir / Umur</p>
                                    <p className="font-semibold text-gray-900">
                                        {patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toLocaleDateString("id-ID") : "-"} / {calculateAge(patient.tanggal_lahir)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Jenis Kelamin</p>
                                    <p className="font-semibold text-gray-900">{patient.jenis_kelamin || "-"}</p>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Asal Rujukan</p>
                                    <p className="font-semibold text-gray-900">-</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">No. Rujukan</p>
                                    <p className="font-semibold text-gray-900">-</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Alamat</p>
                                    <p className="font-semibold text-gray-900 text-sm">{patient.alamat || "-"}</p>
                                </div>
                            </div>

                            {/* Column 3 */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Dokter PJ</p>
                                    <p className="font-semibold text-gray-900">{currentVisit?.doctors?.users?.nama || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">No. BPJS / No. SEP</p>
                                    <p className="font-semibold text-gray-900">-</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Alergi</p>
                                    <p className="font-semibold text-gray-900">-</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Penyakit Khusus</p>
                                    <p className="font-semibold text-gray-900">-</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                            <div className="flex gap-3">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2"
                                    disabled={!isTTVDone}
                                    onClick={() => {
                                        const from = router.query.from as string | undefined;
                                        const url = `/doctor/patients/visit/${currentVisit.id}${from ? `?from=${from}` : ''}`;
                                        router.push(url);
                                    }}
                                >
                                    <Clipboard className="w-4 h-4 mr-2" />
                                    {currentVisit?.status === 'selesai'
                                        ? "Lihat Tindakan"
                                        : (hasSOAPToday ? "Edit Pemeriksaan" : "Tambah Pemeriksaan")
                                    }
                                </Button>

                                <Button
                                    variant="outline"
                                    className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold px-6 py-2"
                                    disabled={!canCompleteVisit || completing}
                                    onClick={handleCompleteVisit}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {completing ? 'Memproses...' : 'Selesaikan Kunjungan'}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold px-6 py-2"
                                    onClick={() => setCompleteMedicalRecordModalOpen(true)}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Rekam Medis
                                </Button>
                            </div>

                            {/* Conditional Print Buttons - Right Side */}
                            {currentVisit?.status === 'selesai' && (
                                <>
                                    {/* If disposition is konsul_internal, show Referral Letter button */}
                                    {disposition === 'konsul_internal' && (
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2"
                                            onClick={() => setReferralLetterModalOpen(true)}
                                        >
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Cetak Surat Konsul
                                        </Button>
                                    )}

                                    {/* If disposition is pulang or rujuk_rs, show Payment Code button */}
                                    {(disposition === 'pulang' || disposition === 'rujuk_rs') && (
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
                                            onClick={() => setPaymentCodeModalOpen(true)}
                                        >
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Cetak Kode Pembayaran
                                        </Button>
                                    )}
                                </>

                            )}
                        </div>
                    </div>

                    {/* Tabbed History Section */}
                    <div className="bg-white shadow-lg border border-gray-200">
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200">
                            <div className="flex space-x-1 px-6">
                                <button
                                    onClick={() => setActiveTab("tindakan")}
                                    className={`px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === "tindakan"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Data Tindakan</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("resep")}
                                    className={`px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === "resep"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Pill className="w-4 h-4" />
                                        <span>Resep</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab("lab")}
                                    className={`px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === "lab"
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <FlaskConical className="w-4 h-4" />
                                        <span>Hasil Lab</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Date Filter */}
                            <div className="mb-6 flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium text-gray-700">Tanggal:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-500">-</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            setStartDate("")
                                            setEndDate("")
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>

                            {/* Data Tindakan Tab */}
                            {activeTab === "tindakan" && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Tindakan</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lokasi Pelayanan</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dokter PJ</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Catatan Medis</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {filteredVisitHistory.length === 0 ? (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="px-4 py-12 text-center text-gray-500"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                                                            <p className="font-medium">Belum ada riwayat tindakan</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredVisitHistory.map((visit: any) => (
                                                    <tr
                                                        key={visit.id}
                                                        className={`border-b border-gray-100 transition-colors ${visit.id === currentVisit?.id
                                                            ? "bg-blue-50/50 border-l-4 border-l-blue-600"
                                                            : "hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        <td className="px-6 py-5 text-sm text-gray-900">
                                                            {new Date(visit.created_at).toLocaleDateString("id-ID", {
                                                                day: '2-digit',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-gray-700">
                                                            {visit.poli?.nama || "-"}
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-gray-700">
                                                            {visit.doctors?.users?.nama || "-"}
                                                        </td>
                                                        <td className="px-6 py-5 text-sm text-gray-700">
                                                            {visit.medical_records?.assessment || "-"}
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span
                                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getDispositionColor(visit.medical_records?.disposition)}`}
                                                            >
                                                                {getDispositionLabel(visit.medical_records?.disposition)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            {visit.status === "selesai" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                                                    onClick={() => {
                                                                        setSelectedVisitId(visit.id)
                                                                        setMedicalRecordModalOpen(true)
                                                                    }}
                                                                >
                                                                    Lihat Detail
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Resep Tab */}
                            {activeTab === "resep" && (
                                <div className="overflow-x-auto">
                                    {loadingPrescriptions ? (
                                        <div className="py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                            <p className="text-gray-600">Memuat data resep...</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No.</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal Tindakan</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nomor Registrasi</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nomor Resep</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dokter PJ</th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Resep Obat</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {filteredPrescriptions.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-4 py-12 text-center text-gray-500"
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                <Pill className="w-12 h-12 text-gray-300 mb-3" />
                                                                <p className="font-medium">Belum ada riwayat resep</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredPrescriptions.map((visit: any) => (
                                                        <tr
                                                            key={visit.id}
                                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {visit.no}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {new Date(visit.visit_date).toLocaleDateString("id-ID", {
                                                                    day: "2-digit",
                                                                    month: "long",
                                                                    year: "numeric"
                                                                })}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {visit.no_reg}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {visit.no_resep}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                {visit.doctor_name}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                                {visit.medicines && visit.medicines.length > 0 ? (
                                                                    <ul className="list-disc list-inside space-y-1">
                                                                        {visit.medicines.map((medicine: any, idx: number) => (
                                                                            <li key={idx}>
                                                                                {medicine.nama} - {medicine.qty} {medicine.satuan}
                                                                                {medicine.instruksi && (
                                                                                    <span className="text-gray-500 text-xs ml-1">
                                                                                        ({medicine.instruksi})
                                                                                    </span>
                                                                                )}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {/* Hasil Lab Tab */}
                            {activeTab === "lab" && (
                                <div className="overflow-hidden">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis Pemeriksaan</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Hasil</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-12 text-center text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <FlaskConical className="w-12 h-12 text-gray-300 mb-3" />
                                                        <p className="font-medium">Belum ada hasil laboratorium</p>
                                                        <p className="text-sm text-gray-400 mt-1">Fitur hasil lab akan segera tersedia</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invoice Modal */}
                <InvoiceModal
                    open={invoiceModalOpen}
                    onClose={() => setInvoiceModalOpen(false)}
                    visitId={id as string}
                />

                {/* Referral Letter Modal */}
                {referralData && patient && (
                    <ReferralLetterModal
                        open={referralLetterModalOpen}
                        onClose={() => setReferralLetterModalOpen(false)}
                        visitData={{
                            patient: {
                                nrm: patient.nrm,
                                nama: patient.nama,
                                tanggal_lahir: patient.tanggal_lahir,
                                jenis_kelamin: patient.jenis_kelamin
                            },
                            sourcePoli: currentVisit?.poli?.nama || '',
                            sourceDoctor: currentVisit?.doctors?.users?.nama || '',
                            targetPoli: referralData.to_poli?.nama || '',
                            targetDoctor: referralData.to_doctor?.users?.nama || '',
                            diagnosis: '', // Will be fetched from medical_records if needed
                            consultationNotes: referralData.notes || '',
                            date: currentVisit?.created_at || new Date().toISOString()
                        }}
                    />
                )}

                {/* Accumulated Invoice Modal */}
                <AccumulatedInvoiceModal
                    open={accumulatedInvoiceModalOpen}
                    onClose={() => setAccumulatedInvoiceModalOpen(false)}
                    visitId={id as string}
                />

                {/* Payment Code Modal */}
                <PaymentCodeModal
                    open={paymentCodeModalOpen}
                    onClose={() => setPaymentCodeModalOpen(false)}
                    visitId={id as string}
                />

                {/* Medical Record Modal */}
                {selectedVisitId && (
                    <MedicalRecordModal
                        open={medicalRecordModalOpen}
                        onClose={() => {
                            setMedicalRecordModalOpen(false)
                            setSelectedVisitId(null)
                        }}
                        visitId={selectedVisitId}
                    />
                )}

                {/* Complete Medical Record Modal */}
                {patient?.id && (
                    <CompleteMedicalRecordModal
                        open={completeMedicalRecordModalOpen}
                        onClose={() => setCompleteMedicalRecordModalOpen(false)}
                        patientId={patient.id}
                    />
                )}
            </div>
        </DoctorLayout>
    )
}
