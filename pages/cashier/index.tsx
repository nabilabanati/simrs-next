import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Receipt, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import AccumulatedInvoiceModal from '@/components/modals/AccumulatedInvoiceModal'
import CashierLayout from '@/components/layout/CashierLayout'
import Breadcrumb from '@/components/dashboard/poli/Breadcrumb'
import DashboardHeader from '@/components/dashboard/poli/DashboardHeader'

interface VisitDetail {
    payment_code: {
        id: string
        code: string
        created_at: string
        expires_at: string
        is_used: boolean
    }
    visit: {
        id: string
        no_reg: string
        created_at: string
        poli: { nama: string; harga_daftar: number }
        doctor: { users: { nama: string } }
    }
    patient: {
        nrm: string
        nama: string
        tanggal_lahir: string
        jenis_kelamin: string
    }
    invoice_items?: any[]
    prescription?: {
        prescription_items: Array<{
            medicines: { nama: string; harga_satuan: number; satuan: string }
            quantity: number
        }>
    }
}

export default function CashierDashboard() {
    const router = useRouter()
    const [paymentCode, setPaymentCode] = useState('')
    const [cashierPassword, setCashierPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [visitDetail, setVisitDetail] = useState<VisitDetail | null>(null)
    const [verifiedVisitId, setVerifiedVisitId] = useState<string | null>(null)
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
    const [userName, setUserName] = useState('')
    const [accumulatedInvoice, setAccumulatedInvoice] = useState<any>(null)

    // Check if user is cashier
    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (!userStr) {
            router.push('/login')
            return
        }

        try {
            const user = JSON.parse(userStr)
            if (user.role !== 'kasir' && user.role !== 'loket') {
                toast.error('Akses ditolak. Halaman ini hanya untuk kasir.')
                router.push('/login')
            } else {
                setUserName(user.nama || 'Kasir')
            }
        } catch (error) {
            console.error('Error parsing user data:', error)
            router.push('/login')
        }
    }, [router])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!paymentCode.trim()) {
            toast.error('Masukkan kode pembayaran')
            return
        }

        if (!cashierPassword.trim()) {
            toast.error('Masukkan password kasir')
            return
        }

        setLoading(true)
        setVisitDetail(null)

        try {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                toast.error('Sesi berakhir, silakan login kembali')
                router.push('/login')
                return
            }

            const user = JSON.parse(userStr)

            console.log('🔍 Debug - User data:', user)
            console.log('🔍 Debug - Sending to API:', {
                code: paymentCode.toUpperCase().trim(),
                cashier_user_id: user.id,
                cashier_role: user.role
            })

            const response = await fetch('/api/cashier/verify-payment-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: paymentCode.toUpperCase().trim(),
                    cashier_user_id: user.id,
                    cashier_password: cashierPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                // Transform API response to match frontend structure
                setVisitDetail({
                    payment_code: data.payment_code,
                    visit: {
                        id: data.visit.id,
                        no_reg: data.visit.no_reg,
                        created_at: data.visit.created_at,
                        poli: data.visit.poli,
                        doctor: data.visit.doctors
                    },
                    patient: data.visit.patients,  // Extract patient from visit
                    invoice_items: data.invoice_items || [],
                    prescription: data.prescription
                })

                // Fetch accumulated invoice for accurate cost calculation
                try {
                    const invoiceRes = await fetch(`/api/doctor/get-accumulated-invoice?visit_id=${data.visit.id}`, {
                        credentials: 'include'
                    })
                    const invoiceData = await invoiceRes.json()
                    if (invoiceRes.ok && invoiceData.success) {
                        setAccumulatedInvoice(invoiceData.data)
                    }
                } catch (err) {
                    console.error('Error fetching accumulated invoice:', err)
                }

                toast.success('Kode pembayaran valid! Silakan konfirmasi detail kunjungan.')
            } else {
                toast.error(data.error || 'Kode pembayaran tidak valid')
            }
        } catch (error) {
            console.error('Error verifying payment code:', error)
            toast.error('Terjadi kesalahan saat memverifikasi kode')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = () => {
        if (visitDetail) {
            setVerifiedVisitId(visitDetail.visit.id)
            setInvoiceModalOpen(true)
        }
    }

    const handleInvoiceClose = async () => {
        setInvoiceModalOpen(false)

        // Mark payment code as used
        if (visitDetail) {
            try {
                const userStr = localStorage.getItem('user')
                if (!userStr) return

                const user = JSON.parse(userStr)

                await fetch('/api/cashier/mark-payment-used', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: visitDetail.payment_code.code,
                        cashier_user_id: user.id,
                    }),
                })

                toast.success('Pembayaran berhasil diproses')

                // Reset form
                setPaymentCode('')
                setCashierPassword('')
                setVisitDetail(null)
                setVerifiedVisitId(null)
            } catch (error) {
                console.error('Error marking payment as used:', error)
            }
        }
    }

    const handleCancel = () => {
        setVisitDetail(null)
        setPaymentCode('')
        setCashierPassword('')
        setAccumulatedInvoice(null)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <CashierLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    <Breadcrumb
                        items={[
                            { label: 'Kasir' },
                            { label: 'Dashboard' },
                        ]}
                    />

                    <DashboardHeader
                        title="Dashboard Kasir"
                        userName={userName}
                        greeting="Selamat Datang"
                    />

                    <div className="max-w-4xl mx-auto pt-6">

                        {/* Search Form */}
                        <Card className="mb-6 shadow-lg">
                            <CardHeader className="">
                                <CardTitle className="flex items-center gap-2">
                                    <Receipt className="w-6 h-6" />
                                    Verifikasi Kode Pembayaran
                                </CardTitle>
                                <div className='mb-1'></div>
                                <CardDescription className="text-black-50">
                                    Masukkan kode pembayaran dari pasien dan password kasir untuk melihat invoice
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-1">
                                <form onSubmit={handleSearch} className="space-y-4">
                                    <div>
                                        <Label htmlFor="paymentCode" className="text-sm font-medium">
                                            Kode Pembayaran
                                        </Label>
                                        <Input
                                            id="paymentCode"
                                            type="text"
                                            placeholder="PAY-XXXXXXXX"
                                            value={paymentCode}
                                            onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                                            className="mt-1 font-mono text-lg"
                                            maxLength={12}
                                            disabled={loading || !!visitDetail}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="password" className="text-sm font-medium">
                                            Password Kasir
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Masukkan password Anda"
                                            value={cashierPassword}
                                            onChange={(e) => setCashierPassword(e.target.value)}
                                            className="mt-1"
                                            disabled={loading || !!visitDetail}
                                        />
                                    </div>

                                    {!visitDetail && (
                                        <Button
                                            type="submit"
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                    Memverifikasi...
                                                </>
                                            ) : (
                                                <>
                                                    <Search className="w-4 h-4 mr-2" />
                                                    Verifikasi Kode
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>

                        {/* Visit Detail - Confirmation */}
                        {visitDetail && (
                            <Card className="shadow-lg border-2 border-blue-500">
                                <CardHeader className="bg-blue-50">
                                    <CardTitle className="flex items-center gap-2 text-blue-800">
                                        <CheckCircle className="w-6 h-6" />
                                        Detail Kunjungan Pasien
                                    </CardTitle>
                                    <CardDescription>
                                        Silakan konfirmasi detail kunjungan sebelum melihat invoice
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {/* Patient Info */}
                                        <div className="col-span-2 bg-blue-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-blue-900 mb-3">Data Pasien</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Nama:</span>
                                                    <p className="font-semibold text-gray-900">{visitDetail.patient.nama}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">NRM:</span>
                                                    <p className="font-semibold text-gray-900">{visitDetail.patient.nrm}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Jenis Kelamin:</span>
                                                    <p className="font-semibold text-gray-900">{visitDetail.patient.jenis_kelamin}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Tanggal Lahir:</span>
                                                    <p className="font-semibold text-gray-900">
                                                        {new Date(visitDetail.patient.tanggal_lahir).toLocaleDateString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visit Info */}
                                        <div className="col-span-2 bg-purple-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-purple-900 mb-3">Data Kunjungan</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">No. Registrasi:</span>
                                                    <p className="font-semibold text-gray-900">{visitDetail.visit.no_reg}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Tanggal Kunjungan:</span>
                                                    <p className="font-semibold text-gray-900">{formatDate(visitDetail.visit.created_at)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Poli:</span>
                                                    <p className="font-semibold text-gray-900">{visitDetail.visit.poli.nama}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Dokter:</span>
                                                    <p className="font-semibold text-gray-900">{visitDetail.visit.doctor.users.nama}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Code Info */}
                                        <div className="col-span-2 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                                            <h3 className="font-semibold text-yellow-900 mb-3">Informasi Kode Pembayaran</h3>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Kode:</span>
                                                    <p className="font-semibold text-gray-900 font-mono">{visitDetail.payment_code.code}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Dibuat:</span>
                                                    <p className="font-semibold text-gray-900">{formatDate(visitDetail.payment_code.created_at)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Kadaluarsa:</span>
                                                    <p className="font-semibold text-gray-900">{formatDate(visitDetail.payment_code.expires_at)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Status:</span>
                                                    <p className="font-semibold text-blue-600">✓ Valid</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cost Breakdown */}
                                        <div className="col-span-2 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                                            <h3 className="font-semibold text-green-900 mb-3">Rincian Biaya</h3>
                                            {accumulatedInvoice ? (
                                                <div className="space-y-2 text-sm">
                                                    {/* Visit Details */}
                                                    {accumulatedInvoice.visits.map((visit: any, idx: number) => (
                                                        <div key={idx} className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-700 font-medium">
                                                                    {visit.poli_name} {idx > 0 && '(Rujukan)'}
                                                                </span>
                                                                <span className="font-semibold text-gray-900">
                                                                    Rp {visit.poli_fee.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                            {visit.medicine_cost > 0 && (
                                                                <div className="flex justify-between pl-4">
                                                                    <span className="text-gray-600">Obat</span>
                                                                    <span className="text-gray-900">
                                                                        Rp {visit.medicine_cost.toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Registration Fee */}
                                                    {accumulatedInvoice.registration_fee > 0 && (
                                                        <div className="flex justify-between border-t border-green-200 pt-2">
                                                            <span className="text-gray-700">Biaya Administrasi</span>
                                                            <span className="font-semibold text-gray-900">
                                                                Rp {accumulatedInvoice.registration_fee.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Total */}
                                                    <div className="border-t-2 border-green-300 pt-2 mt-2 flex justify-between">
                                                        <span className="font-bold text-green-900">Total Pembayaran</span>
                                                        <span className="font-bold text-green-900 text-lg">
                                                            Rp {accumulatedInvoice.total.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">Memuat rincian biaya...</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleCancel}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Batal
                                        </Button>
                                        <Button
                                            onClick={handleConfirm}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Konfirmasi & Lihat Invoice
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Security Notice */}
                        <Card className="mt-6 border-blue-200 bg-blue-50">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <Receipt className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-blue-900 mb-1">Catatan Keamanan</h4>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            <li>• Kode pembayaran hanya dapat digunakan sekali</li>
                                            <li>• Kode berlaku selama 3 hari sejak dibuat</li>
                                            <li>• Pastikan password kasir Anda benar</li>
                                            <li>• Invoice akan otomatis ditandai sebagai diproses setelah ditutup</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Accumulated Invoice Modal */}
                {verifiedVisitId && (
                    <AccumulatedInvoiceModal
                        open={invoiceModalOpen}
                        onClose={handleInvoiceClose}
                        visitId={verifiedVisitId}
                    />
                )}
            </div>
        </CashierLayout>
    )
}
