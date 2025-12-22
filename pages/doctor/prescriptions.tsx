import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import DoctorLayout from "@/components/layout/DoctorLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Search, FileText, RefreshCw, Eye } from "lucide-react"
import { toast } from "sonner"

interface Prescription {
    id: string
    no_order: string
    status: string
    created_at: string
    visit: {
        no_reg: string
        patient: {
            nrm: string
            nama: string
            nik: string
        }
    }
    items_count: number
}

export default function DoctorPrescriptionsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

    const ITEMS_PER_PAGE = 10

    // Auth check
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null")
        if (!u || u.role !== "dokter") {
            router.push("/login")
            return
        }
        setUser(u)
    }, [router])

    // Fetch prescriptions
    useEffect(() => {
        if (!user?.id) return
        fetchPrescriptions()

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchPrescriptions(false)
        }, 30000)

        return () => clearInterval(interval)
    }, [user, statusFilter])

    const fetchPrescriptions = async (showLoading = true) => {
        if (showLoading) setLoading(true)
        else setRefreshing(true)

        try {
            const params = new URLSearchParams({
                user_id: user.id,
            })

            if (statusFilter !== "all") {
                params.append("status", statusFilter)
            }

            const response = await fetch(`/api/doctor/get-prescriptions?${params}`)
            const data = await response.json()

            if (data.success) {
                setPrescriptions(data.data || [])
            } else {
                toast.error("Gagal memuat data resep")
            }
        } catch (error) {
            console.error("Error fetching prescriptions:", error)
            toast.error("Terjadi kesalahan saat memuat data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    // Calculate summary statistics
    const totalPrescriptions = prescriptions.length
    const pendingCount = prescriptions.filter((p) => p.status === "pending").length
    const readyCount = prescriptions.filter((p) => p.status === "ready").length
    const dispensedCount = prescriptions.filter((p) => p.status === "dispensed").length

    // Filter by search query
    const filteredPrescriptions = prescriptions.filter((p) => {
        const search = searchQuery.toLowerCase()
        return (
            p.no_order.toLowerCase().includes(search) ||
            p.visit.no_reg.toLowerCase().includes(search) ||
            p.visit.patient.nama.toLowerCase().includes(search) ||
            p.visit.patient.nrm.toLowerCase().includes(search)
        )
    })

    // Pagination
    const totalPages = Math.ceil(filteredPrescriptions.length / ITEMS_PER_PAGE)
    const paginatedPrescriptions = filteredPrescriptions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        const variants: Record<string, { className: string; label: string }> = {
            pending: { className: "bg-yellow-500 hover:bg-yellow-600 text-white", label: "Menunggu" },
            ready: { className: "bg-blue-500 hover:bg-blue-600 text-white", label: "Siap" },
            dispensed: { className: "bg-green-500 hover:bg-green-600 text-white", label: "Selesai" },
        }

        const config = variants[status] || { className: "bg-gray-500", label: status }

        return (
            <Badge className={config.className}>
                {config.label}
            </Badge>
        )
    }

    if (!user || loading) {
        return (
            <DoctorLayout>
                <div className="p-6">
                    <div className="text-center py-8">Memuat data...</div>
                </div>
            </DoctorLayout>
        )
    }

    return (
        <DoctorLayout>
            <div className="min-h-screen bg-gray-50">
                <div className="p-6">
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
                                    Riwayat Resep
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Daftar resep yang telah Anda buat
                                </p>
                            </div>
                            <Button
                                onClick={() => fetchPrescriptions(true)}
                                disabled={refreshing}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Resep</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {totalPrescriptions}
                                        </p>
                                    </div>
                                    <FileText className="w-10 h-10 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Menunggu</p>
                                        <p className="text-3xl font-bold text-yellow-600">
                                            {pendingCount}
                                        </p>
                                    </div>
                                    <FileText className="w-10 h-10 text-yellow-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Siap</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {readyCount}
                                        </p>
                                    </div>
                                    <FileText className="w-10 h-10 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Selesai</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {dispensedCount}
                                        </p>
                                    </div>
                                    <FileText className="w-10 h-10 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Cari no. order, no. reg, nama pasien, NRM..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="pl-10"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => {
                                    setStatusFilter(value)
                                    setCurrentPage(1)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="pending">Menunggu</SelectItem>
                                    <SelectItem value="ready">Siap</SelectItem>
                                    <SelectItem value="dispensed">Selesai</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Order</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>No. Registrasi</TableHead>
                                    <TableHead>Nama Pasien</TableHead>
                                    <TableHead>NRM</TableHead>
                                    <TableHead>Jumlah Item</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPrescriptions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            {searchQuery || statusFilter !== "all"
                                                ? "Tidak ada resep yang sesuai dengan filter"
                                                : "Belum ada resep yang dibuat"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPrescriptions.map((prescription) => (
                                        <TableRow key={prescription.id}>
                                            <TableCell className="font-medium">
                                                {prescription.no_order}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(prescription.created_at)}
                                            </TableCell>
                                            <TableCell>{prescription.visit.no_reg}</TableCell>
                                            <TableCell>{prescription.visit.patient.nama}</TableCell>
                                            <TableCell>{prescription.visit.patient.nrm}</TableCell>
                                            <TableCell>{prescription.items_count} item</TableCell>
                                            <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.push(`/pharmacy/prescriptions/${prescription.id}`)
                                                    }
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        onClick={() => setCurrentPage(page)}
                                        className="w-10"
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="mt-4 text-sm text-gray-600 text-center">
                        Menampilkan {paginatedPrescriptions.length} dari {filteredPrescriptions.length} resep
                        {statusFilter !== "all" && ` (filter: ${statusFilter})`}
                    </div>

                    {/* Auto-refresh indicator */}
                    <div className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Auto-refresh setiap 30 detik
                    </div>
                </div>
            </div>
        </DoctorLayout>
    )
}
