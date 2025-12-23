import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, Printer } from 'lucide-react'

interface AccumulatedInvoiceData {
    patient: {
        nrm: string
        nama: string
        tanggal_lahir: string
        jenis_kelamin: string
    }
    visits: Array<{
        visit_id: string
        poli_name: string
        doctor_name: string
        poli_fee: number
        medicine_cost: number
        subtotal: number
        date: string
    }>
    total: number
    registration_fee?: number
    penjamin_name?: string
    is_accumulated: boolean
}

interface AccumulatedInvoiceModalProps {
    open: boolean
    onClose: () => void
    visitId: string
}

export default function AccumulatedInvoiceModal({ open, onClose, visitId }: AccumulatedInvoiceModalProps) {
    const [loading, setLoading] = useState(true)
    const [invoice, setInvoice] = useState<AccumulatedInvoiceData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open && visitId) {
            fetchAccumulatedInvoice()
        }
    }, [open, visitId])

    // Auto-print when invoice is loaded
    useEffect(() => {
        if (open && invoice && !loading) {
            const timer = setTimeout(() => {
                window.print()
            }, 800)
            return () => clearTimeout(timer)
        }
    }, [open, invoice, loading])

    const fetchAccumulatedInvoice = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/doctor/get-accumulated-invoice?visit_id=${visitId}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch invoice')
            }

            setInvoice(data.data)
        } catch (err: any) {
            console.error('Error fetching accumulated invoice:', err)
            setError(err.message || 'Gagal memuat invoice')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!w-[85vw] !max-w-[1400px] max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full">
                {/* Header - Hide on print */}
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-xl font-bold">Invoice Lengkap (Rujukan Internal)</h2>
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
                <div id="print-content" className="p-8 print:p-0">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Memuat invoice...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : invoice ? (
                        <>
                            {/* Hospital Header */}
                            <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                                <h1 className="text-2xl font-bold text-gray-800">RUMAH SAKIT</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Jl. Contoh No. 123, Kota, Provinsi
                                </p>
                                <p className="text-sm text-gray-600">
                                    Telp: (021) 1234-5678 | Email: info@rsayeye.com
                                </p>
                            </div>

                            {/* Invoice Title */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold">INVOICE PEMBAYARAN</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    (Rujukan Internal - Akumulasi Biaya)
                                </p>
                            </div>

                            {/* Patient Info */}
                            <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
                                <h3 className="font-semibold text-gray-800 mb-2">Data Pasien</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="font-medium">No. Rekam Medis:</span> {invoice.patient.nrm}
                                    </div>
                                    <div>
                                        <span className="font-medium">Nama:</span> {invoice.patient.nama}
                                    </div>
                                </div>
                            </div>

                            {/* Itemized Breakdown */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-2">
                                    Rincian Biaya
                                </h3>

                                {invoice.visits.map((visit, index) => (
                                    <div key={visit.visit_id} className="mb-4 border border-gray-200 rounded p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-gray-700">
                                                    Kunjungan {index + 1}: {visit.poli_name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Dokter: {visit.doctor_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(visit.date)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-1 text-sm mt-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Biaya Konsultasi Poli</span>
                                                <span className="font-medium">{formatCurrency(visit.poli_fee)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Biaya Obat</span>
                                                <span className="font-medium">{formatCurrency(visit.medicine_cost)}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                                <span className="font-semibold">Subtotal</span>
                                                <span className="font-semibold">{formatCurrency(visit.subtotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Registration Fee (if applicable) */}
                            {invoice.registration_fee && invoice.registration_fee > 0 && (
                                <div className="mb-4 border border-blue-200 bg-blue-50 rounded p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-gray-700">Biaya Pendaftaran</span>
                                            <p className="text-sm text-gray-600">Penjamin: {invoice.penjamin_name}</p>
                                        </div>
                                        <span className="font-semibold text-gray-900">{formatCurrency(invoice.registration_fee)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="border-t-2 border-gray-800 pt-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold">TOTAL PEMBAYARAN</span>
                                    <span className="text-2xl font-bold text-blue-700">
                                        {formatCurrency(invoice.total)}
                                    </span>
                                </div>
                            </div>

                            {/* Note */}
                            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Catatan:</strong> Invoice ini mencakup biaya dari {invoice.visits.length} kunjungan
                                    dalam rangkaian rujukan internal. Pembayaran dilakukan sekali untuk seluruh rangkaian perawatan.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-4 border-t border-gray-300">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <div>
                                        <p>Tanggal Cetak: {formatDate(new Date().toISOString())}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">Petugas Kasir</p>
                                        <div className="mt-12 border-t border-gray-400 pt-1">
                                            <p>(...........................)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Print Note */}
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500 italic">
                                    Invoice ini dibuat secara elektronik dan sah tanpa tanda tangan basah
                                </p>
                            </div>
                        </>
                    ) : null}
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
                            margin: 1cm;
                            size: A4 portrait;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
