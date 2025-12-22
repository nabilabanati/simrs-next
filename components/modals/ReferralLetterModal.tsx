import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'

interface ReferralLetterModalProps {
    open: boolean
    onClose: () => void
    visitData: {
        patient: {
            nrm: string
            nama: string
            tanggal_lahir: string
            jenis_kelamin: string
        }
        sourcePoli: string
        sourceDoctor: string
        targetPoli: string
        targetDoctor: string
        diagnosis: string
        consultationNotes: string
        date: string
    }
}

export default function ReferralLetterModal({ open, onClose, visitData }: ReferralLetterModalProps) {
    const handlePrint = () => {
        window.print()
    }

    // Calculate age from birth date
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
                {/* Header - Hide on print */}
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-xl font-bold">Surat Konsultasi</h2>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint} size="sm">
                            <Printer className="w-4 h-4 mr-2" />
                            Cetak
                        </Button>
                        <Button onClick={onClose} variant="outline" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Tutup
                        </Button>
                    </div>
                </div>

                {/* Letter Content - Print optimized */}
                <div id="print-content" className="bg-white p-8 print:p-0">
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

                    {/* Letter Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold underline">SURAT KONSULTASI</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Tanggal: {formatDate(visitData.date)}
                        </p>
                    </div>

                    {/* Patient Information */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            DATA PASIEN
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex">
                                <span className="w-32 font-medium">No. Rekam Medis</span>
                                <span className="mr-2">:</span>
                                <span>{visitData.patient.nrm}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Jenis Kelamin</span>
                                <span className="mr-2">:</span>
                                <span>{visitData.patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Nama Pasien</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold">{visitData.patient.nama}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Umur</span>
                                <span className="mr-2">:</span>
                                <span>{calculateAge(visitData.patient.tanggal_lahir)} tahun</span>
                            </div>
                        </div>
                    </div>

                    {/* Referral Information */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            INFORMASI RUJUKAN
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex">
                                <span className="w-32 font-medium">Dari Poli</span>
                                <span className="mr-2">:</span>
                                <span>{visitData.sourcePoli}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Dokter Pengirim</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold">{visitData.sourceDoctor}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Ke Poli</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold text-blue-700">{visitData.targetPoli}</span>
                            </div>
                            <div className="flex">
                                <span className="w-32 font-medium">Dokter Tujuan</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold text-blue-700">{visitData.targetDoctor}</span>
                            </div>
                        </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            DIAGNOSIS
                        </h3>
                        <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                            {visitData.diagnosis || '-'}
                        </p>
                    </div>

                    {/* Consultation Reason */}
                    <div className="mb-8">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            ALASAN KONSULTASI
                        </h3>
                        <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                            {visitData.consultationNotes || '-'}
                        </p>
                    </div>

                    {/* Signature Section */}
                    <div className="mt-12 flex justify-end">
                        <div className="text-center">
                            <p className="text-sm mb-16">
                                {visitData.sourcePoli}, {formatDate(visitData.date)}
                            </p>
                            <div className="border-t border-gray-800 pt-2 w-48">
                                <p className="text-sm font-semibold">{visitData.sourceDoctor}</p>
                                <p className="text-xs text-gray-600">Dokter Pengirim</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 pt-4 border-t border-gray-300">
                        <p className="text-xs text-gray-500 italic text-center">
                            Surat konsultasi ini dibuat secara elektronik dan sah tanpa tanda tangan basah
                        </p>
                    </div>
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
