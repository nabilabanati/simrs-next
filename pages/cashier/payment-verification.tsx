import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, Lock, Search, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import AccumulatedInvoiceModal from '@/components/modals/AccumulatedInvoiceModal'
import { CounterLayout } from '@/components/layout/CounterLayout'

export default function PaymentVerificationPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Form state
    const [paymentCode, setPaymentCode] = useState('')
    const [password, setPassword] = useState('')

    // Verification result
    const [verifiedVisitId, setVerifiedVisitId] = useState<string | null>(null)
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem('user') || 'null')
        if (!u || u.role !== 'loket') {
            router.push('/login')
            return
        }
        setUser(u)
    }, [router])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!paymentCode.trim()) {
            toast.error('Masukkan kode pembayaran')
            return
        }

        if (!password.trim()) {
            toast.error('Masukkan password Anda')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/cashier/verify-payment-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: paymentCode.trim().toUpperCase(),
                    cashier_user_id: user.id,
                    cashier_password: password
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Kode pembayaran berhasil diverifikasi')
                setVerifiedVisitId(data.visit.id)
                setInvoiceModalOpen(true)
                // Clear form
                setPaymentCode('')
                setPassword('')
            } else {
                toast.error(data.error || 'Gagal memverifikasi kode pembayaran')
            }
        } catch (error) {
            console.error('Error verifying payment code:', error)
            toast.error('Terjadi kesalahan saat memverifikasi kode')
        } finally {
            setLoading(false)
        }
    }

    const handleInvoiceClose = async () => {
        setInvoiceModalOpen(false)

        // Mark payment code as used
        if (verifiedVisitId && paymentCode) {
            try {
                await fetch('/api/cashier/mark-payment-used', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: paymentCode.trim().toUpperCase(),
                        cashier_user_id: user.id
                    })
                })
            } catch (error) {
                console.error('Error marking payment as used:', error)
            }
        }

        setVerifiedVisitId(null)
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat...</p>
                </div>
            </div>
        )
    }

    return (
        <CounterLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="container mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                            <Receipt className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Verifikasi Pembayaran
                        </h1>
                        <p className="text-gray-600">
                            Masukkan kode pembayaran dari pasien untuk melihat detail invoice
                        </p>
                    </div>

                    {/* Verification Form */}
                    <div className="max-w-md mx-auto">
                        <Card className="p-6 shadow-lg">
                            <form onSubmit={handleVerify} className="space-y-6">
                                {/* Payment Code Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="paymentCode" className="text-sm font-semibold text-gray-700">
                                        Kode Pembayaran
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            id="paymentCode"
                                            type="text"
                                            placeholder="PAY-XXXXXXXX"
                                            value={paymentCode}
                                            onChange={(e) => setPaymentCode(e.target.value.toUpperCase())}
                                            className="pl-10 text-lg font-mono uppercase"
                                            maxLength={12}
                                            disabled={loading}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Format: PAY-XXXXXXXX (8 karakter)
                                    </p>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                        Password Kasir
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Masukkan password Anda"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10"
                                            disabled={loading}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Password diperlukan untuk keamanan
                                    </p>
                                </div>

                                {/* Security Notice */}
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                    <div className="flex items-start">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-yellow-800">
                                            <p className="font-semibold mb-1">Perhatian Keamanan</p>
                                            <p>
                                                Pastikan kode pembayaran berasal dari pasien yang sah.
                                                Setiap kode hanya dapat digunakan satu kali.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                                    disabled={loading || !paymentCode.trim() || !password.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Memverifikasi...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Verifikasi Kode
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Card>

                        {/* Instructions */}
                        <div className="mt-6 bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Cara Menggunakan:</h3>
                            <ol className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full mr-3 flex-shrink-0 text-xs font-semibold">
                                        1
                                    </span>
                                    <span>Minta pasien menunjukkan bukti kunjungan dengan kode pembayaran</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full mr-3 flex-shrink-0 text-xs font-semibold">
                                        2
                                    </span>
                                    <span>Masukkan kode pembayaran yang tertera pada bukti</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full mr-3 flex-shrink-0 text-xs font-semibold">
                                        3
                                    </span>
                                    <span>Masukkan password kasir Anda untuk verifikasi</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full mr-3 flex-shrink-0 text-xs font-semibold">
                                        4
                                    </span>
                                    <span>Detail invoice akan ditampilkan setelah verifikasi berhasil</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Invoice Modal */}
                {verifiedVisitId && (
                    <AccumulatedInvoiceModal
                        open={invoiceModalOpen}
                        onClose={handleInvoiceClose}
                        visitId={verifiedVisitId}
                    />
                )}
            </div>
        </CounterLayout>
    )
}
