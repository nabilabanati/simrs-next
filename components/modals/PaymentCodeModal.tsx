import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X, Copy, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentCodeModalProps {
    open: boolean
    onClose: () => void
    visitId: string
}

interface VisitData {
    patient: {
        nrm: string
        nama: string
        tanggal_lahir: string
        jenis_kelamin: string
    }
    no_reg: string
    poli: string
    doctor: string
    created_at: string
}

export default function PaymentCodeModal({ open, onClose, visitId }: PaymentCodeModalProps) {
    const [loading, setLoading] = useState(true)
    const [paymentCode, setPaymentCode] = useState<string>('')
    const [isPaid, setIsPaid] = useState(false)  // Track if code is already used
    const [visitData, setVisitData] = useState<VisitData | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (open && visitId) {
            fetchPaymentCode()
            fetchVisitData()
        }
    }, [open, visitId])

    // Auto-print when data is loaded
    useEffect(() => {
        if (open && paymentCode && visitData && !loading) {
            const timer = setTimeout(() => {
                window.print()
            }, 800)
            return () => clearTimeout(timer)
        }
    }, [open, paymentCode, visitData, loading])

    const fetchPaymentCode = async () => {
        try {
            // First, check if this visit already has a payment code
            const { data: existingCode } = await (await import('@/lib/supabase')).supabase
                .from('payment_codes')
                .select('code, is_used, expires_at, used_at')
                .eq('visit_id', visitId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            // If code exists (used or not), show it
            if (existingCode) {
                console.log('✅ Found existing payment code:', existingCode.code, 'is_used:', existingCode.is_used)
                setPaymentCode(existingCode.code)
                setIsPaid(existingCode.is_used)  // Set paid status

                // If already paid, don't generate new code
                if (existingCode.is_used) {
                    console.log('💰 Payment code already used on:', existingCode.used_at)
                    toast.info('Kunjungan ini sudah dibayar')
                    return
                }

                // If not paid but not expired, reuse it
                const expiresAt = new Date(existingCode.expires_at)
                if (expiresAt > new Date()) {
                    return  // Reuse existing code
                }
            }

            // Only generate new code if no existing code or expired
            if (!existingCode || new Date(existingCode.expires_at) < new Date()) {
                console.log('🔄 Generating new payment code...')
                const response = await fetch('/api/doctor/generate-payment-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visit_id: visitId }),
                })

                const data = await response.json()

                if (response.ok) {
                    console.log('✅ New payment code generated:', data.code)
                    setPaymentCode(data.code)
                    setIsPaid(false)
                } else {
                    toast.error(data.error || 'Gagal generate kode pembayaran')
                }
            }
        } catch (error) {
            console.error('Error fetching payment code:', error)
            toast.error('Terjadi kesalahan saat generate kode pembayaran')
        }
    }

    const fetchVisitData = async () => {
        setLoading(true)
        try {
            const { data: visit, error } = await (await import('@/lib/supabase')).supabase
                .from('visits')
                .select(`
          no_reg,
          created_at,
          patients:patient_id (
            nrm,
            nama,
            tanggal_lahir,
            jenis_kelamin
          ),
          poli:poli_id (nama),
          doctors:dokter_id (users:user_id (nama))
        `)
                .eq('id', visitId)
                .single()

            if (error || !visit) {
                toast.error('Gagal memuat data kunjungan')
                return
            }

            setVisitData({
                patient: visit.patients as any,
                no_reg: visit.no_reg,
                poli: (visit.poli as any)?.nama || '-',
                doctor: (visit.doctors as any)?.users?.nama || '-',
                created_at: visit.created_at
            })
        } catch (error) {
            console.error('Error fetching visit data:', error)
            toast.error('Terjadi kesalahan saat memuat data')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(paymentCode)
        setCopied(true)
        toast.success('Kode pembayaran berhasil disalin')
        setTimeout(() => setCopied(false), 2000)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '-'
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return `${age} tahun`
    }

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
                {/* Header - Hide on print */}
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-xl font-bold">Bukti Kunjungan Pasien</h2>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} size="sm" disabled={loading}>
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak
                        </Button>
                        <Button onClick={onClose} variant="outline" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Tutup
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div id="print-content" className="p-6 print:p-0">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Memuat data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Hospital Header - Compact */}
                            <div className="text-center mb-4 border-b-2 border-gray-800 pb-3">
                                <h1 className="text-xl font-bold text-gray-800">KLINIK PRATAMA</h1>
                                <p className="text-xs text-gray-600">Jl. Contoh No. 123, Kota | Telp: (021) 1234-5678</p>
                            </div>

                            {/* Title */}
                            <div className="text-center mb-4">
                                <h2 className="text-lg font-bold">BUKTI KUNJUNGAN PASIEN</h2>
                            </div>

                            {/* Main Content - 2 Columns for Landscape */}
                            <div className="grid grid-cols-2 gap-6 mb-4">
                                {/* Left Column - Patient Info */}
                                {visitData && (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Data Pasien</h3>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Nama:</span>
                                                <span className="font-semibold text-gray-900">{visitData.patient.nama}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">NRM:</span>
                                                <span className="font-semibold text-gray-900">{visitData.patient.nrm}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">No. Reg:</span>
                                                <span className="font-semibold text-gray-900">{visitData.no_reg}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tanggal:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {new Date(visitData.created_at).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Poli:</span>
                                                <span className="font-semibold text-gray-900">{visitData.poli}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Dokter:</span>
                                                <span className="font-semibold text-gray-900">{visitData.doctor}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Right Column - Payment Code */}
                                <div className="flex flex-col justify-center">
                                    <h3 className="text-center text-base font-bold text-gray-800 mb-3">
                                        KODE PEMBAYARAN
                                    </h3>

                                    <div className="flex justify-center mb-3">
                                        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-blue-600 rounded-lg px-6 py-4 shadow-lg">
                                            <p className="text-xl font-bold text-blue-600 tracking-wider text-center font-mono">
                                                {paymentCode || 'Loading...'}
                                            </p>

                                            {/* LUNAS Watermark Overlay */}
                                            {isPaid && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                                                    <div className="transform -rotate-12">
                                                        <div className="border-8 border-green-600 rounded-lg px-8 py-4 bg-white/90">
                                                            <p className="text-5xl font-black text-green-600 tracking-wider">
                                                                LUNAS
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Copy button - only visible on screen */}
                                            <button
                                                onClick={handleCopyCode}
                                                className="absolute -top-2 -right-2 bg-white border-2 border-blue-600 rounded-full p-1.5 shadow-md hover:bg-blue-50 transition-colors print:hidden"
                                                title="Salin kode"
                                            >
                                                {copied ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-blue-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2">
                                        <p className="text-xs text-gray-700 text-center font-medium">
                                            ⚠️ Tunjukkan kode ini ke kasir
                                        </p>
                                        <p className="text-xs text-gray-600 text-center">
                                            Berlaku 3 hari
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer - Compact */}
                            <div className="mt-4 pt-3 border-t border-gray-300">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <div>
                                        <p>Dicetak: {new Date().toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-center mb-5">Dokter</p>
                                        <div className="mt-12 border-t border-gray-400 pt-1 w-32">
                                            <p className="text-center text-xs">{visitData?.doctor || '(.....................)'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Print Note */}
                            <div className="mt-2 text-center">
                                <p className="text-xs text-gray-500 italic">
                                    Bukti ini sah tanpa tanda tangan basah
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Print Styles */}
                <style jsx global>{`
                    @media print {
                        /* Hide everything */
                        body * {
                            visibility: hidden;
                        }
                        
                        /* Show only print content */
                        #print-content,
                        #print-content * {
                            visibility: visible;
                        }
                        
                        /* Ensure print content is positioned correctly */
                        #print-content {
                            position: relative;
                            left: 0;
                            top: 0;
                            width: 100%;
                            margin: 0;
                            padding: 0;
                        }
                        
                        /* Hide buttons */
                        .print\\:hidden {
                            display: none !important;
                        }
                        
                        /* Remove padding for print */
                        .print\\:p-0 {
                            padding: 0 !important;
                        }
                        
                        @page {
                            margin: 0.5cm;
                            size: A5 landscape;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
