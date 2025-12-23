import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, FileText, Calendar, User, Stethoscope } from "lucide-react"
import { toast } from "sonner"

interface Visit {
    id: string
    no_reg: string
    status: string
    ttv_status: string
    created_at: string
    poli: {
        nama: string
    }
    doctors: {
        users: {
            nama: string
        }
    }
    medical_records: any[]
}

export default function PatientHistoryDetailPage() {
    const router = useRouter()
    const { patientId } = router.query

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [patient, setPatient] = useState<any>(null)
    const [visits, setVisits] = useState<Visit[]>([])

    // Auth check
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")
        if (!u || u.role !== "dokter") {
            router.push("/login")
            return
        }
        setUser(u)
    }, [router])

    // Fetch data
    useEffect(() => {
        if (!patientId || !user) return
        fetchData()
    }, [patientId, user])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Get patient data
            const { data: patientData, error: patientError } = await supabase
                .from("patients")
                .select("*")
                .eq("id", patientId)
                .single()

            if (patientError) throw patientError
            setPatient(patientData)

            // 2. Get ALL visit history (including visits to other doctors)
            const { data: visitsData, error: visitsError } = await supabase
                .from("visits")
                .select(`
                    *,
                    poli:poli_id (nama),
                    doctors:dokter_id (
                        users:user_id (nama)
                    ),
                    medical_records (id)
                `)
                .eq("patient_id", patientId)
                .order("created_at", { ascending: false })

            if (visitsError) throw visitsError
            setVisits(visitsData || [])
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const calculateAge = (birthDate: string) => {
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            menunggu: { variant: "secondary", label: "Menunggu" },
            dipanggil: { variant: "default", label: "Dipanggil" },
            sedang_diperiksa: { variant: "default", label: "Sedang Diperiksa" },
            selesai: { variant: "outline", label: "Selesai" },
        }

        const config = variants[status] || { variant: "secondary", label: status }

        return (
            <Badge
                variant={config.variant}
                className={
                    status === "selesai"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : ""
                }
            >
                {config.label}
            </Badge>
        )
    }

    if (!user || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Memuat data...</div>
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
                        onClick={() => router.push("/doctor/patients")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Daftar Pasien
                    </Button>

                    <h1 className="text-3xl font-bold text-gray-900">
                        Riwayat Kunjungan Pasien
                    </h1>
                </div>

                {/* Patient Info Card */}
                {patient && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <User className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    {patient.nama}
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                    <div>
                                        <p className="text-sm text-gray-500">NRM</p>
                                        <p className="font-medium">{patient.nrm}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">NIK</p>
                                        <p className="font-medium">{patient.nik || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Jenis Kelamin</p>
                                        <p className="font-medium">
                                            {patient.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Usia</p>
                                        <p className="font-medium">
                                            {patient.tanggal_lahir
                                                ? `${calculateAge(patient.tanggal_lahir)} tahun`
                                                : "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visits History */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Riwayat Kunjungan ({visits.length})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Menampilkan semua riwayat kunjungan pasien ke semua dokter
                        </p>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Reg</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Poli</TableHead>
                                <TableHead>Dokter</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rekam Medis</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        Belum ada riwayat kunjungan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visits.map((visit) => (
                                    <TableRow key={visit.id}>
                                        <TableCell className="font-medium">
                                            {visit.no_reg}
                                        </TableCell>
                                        <TableCell>{formatDate(visit.created_at)}</TableCell>
                                        <TableCell>{visit.poli?.nama || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Stethoscope className="w-4 h-4 text-gray-400" />
                                                {visit.doctors?.users?.nama || "-"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(visit.status)}</TableCell>
                                        <TableCell>
                                            {visit.medical_records && visit.medical_records.length > 0 ? (
                                                <Badge variant="outline" className="bg-green-50">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Ada
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Belum</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.push(`/doctor/patients/${visit.id}`)
                                                }
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Detail
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
