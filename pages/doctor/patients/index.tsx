import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Search, User } from "lucide-react"
import { toast } from "sonner"

interface Patient {
    id: string
    nrm: string
    nama: string
    nik: string
    tanggal_lahir: string
    jenis_kelamin: string
    last_visit: string
}

export default function DoctorPatientsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [doctorId, setDoctorId] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [patients, setPatients] = useState<Patient[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Auth check
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")
        if (!u || u.role !== "dokter") {
            router.push("/login")
            return
        }
        setUser(u)
        fetchDoctorId(u.id)
    }, [router])

    // Fetch doctor_id from user_id
    const fetchDoctorId = async (userId: string) => {
        try {
            const response = await fetch(`/api/doctor/profile?user_id=${userId}`)
            const data = await response.json()
            if (data.doctor?.id) {
                setDoctorId(data.doctor.id)
                fetchPatients(data.doctor.id)
            }
        } catch (error) {
            console.error("Error fetching doctor profile:", error)
            toast.error("Gagal memuat profil dokter")
        }
    }

    // Fetch patients
    const fetchPatients = async (docId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/doctor/patients?doctor_id=${docId}`)
            const data = await response.json()

            if (data.success && data.data) {
                setPatients(data.data)
            }
        } catch (error) {
            console.error("Error fetching patients:", error)
            toast.error("Gagal memuat data pasien")
        } finally {
            setLoading(false)
        }
    }

    // Filter patients based on search
    const filteredPatients = patients.filter((patient) => {
        const query = searchQuery.toLowerCase()
        return (
            patient.nama.toLowerCase().includes(query) ||
            patient.nrm.toLowerCase().includes(query) ||
            patient.nik.toLowerCase().includes(query)
        )
    })

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    }

    // Calculate age
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
                        onClick={() => router.push("/doctor")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Dashboard
                    </Button>

                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Riwayat Pasien
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Daftar pasien yang pernah berkunjung ke Anda
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            placeholder="Cari pasien (nama, NRM, NIK)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Patients Table */}
                <div className="bg-white rounded-lg shadow">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NRM</TableHead>
                                <TableHead>Nama Pasien</TableHead>
                                <TableHead>NIK</TableHead>
                                <TableHead>Jenis Kelamin</TableHead>
                                <TableHead>Usia</TableHead>
                                <TableHead>Kunjungan Terakhir</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                        {searchQuery
                                            ? "Tidak ada pasien yang sesuai dengan pencarian"
                                            : "Belum ada pasien yang berkunjung"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <TableRow key={patient.id}>
                                        <TableCell className="font-medium">
                                            {patient.nrm}
                                        </TableCell>
                                        <TableCell>{patient.nama}</TableCell>
                                        <TableCell>{patient.nik || "-"}</TableCell>
                                        <TableCell>
                                            {patient.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                                        </TableCell>
                                        <TableCell>
                                            {patient.tanggal_lahir
                                                ? `${calculateAge(patient.tanggal_lahir)} tahun`
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(patient.last_visit)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.push(`/doctor/patients/history/${patient.id}`)
                                                }
                                            >
                                                <User className="w-4 h-4 mr-2" />
                                                Lihat Riwayat
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Summary */}
                <div className="mt-4 text-sm text-gray-600">
                    Menampilkan {filteredPatients.length} dari {patients.length} pasien
                </div>
            </div>
        </div>
    )
}
