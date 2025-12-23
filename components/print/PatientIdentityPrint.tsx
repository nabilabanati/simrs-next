import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X } from 'lucide-react'

interface PatientIdentityPrintProps {
    open: boolean
    onClose: () => void
    patientData: {
        nrm: string
        nik: string
        nama: string
        tanggal_lahir: string
        jenis_kelamin: string
        pekerjaan: string
        golongan_darah: string
        no_telp: string
        alamat: string
        province: string
        regency: string
        district: string
        village: string
        kode_pos: string
        // Penanggung Jawab
        nama_pj: string
        no_telp_pj: string
        penanggung_jawab: string
        pekerjaan_pj: string
        // Penjamin
        penjamin_nama: string
        penjamin_tipe: string
        nomor_bpjs?: string
        nama_asuransi?: string
        nomor_polis?: string
        catatan_khusus?: string
    }
}

export default function PatientIdentityPrint({ open, onClose, patientData }: PatientIdentityPrintProps) {
    const handlePrint = () => {
        window.print()
    }

    // Calculate age from birth date
    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '-'
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
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Build full address
    const getFullAddress = () => {
        const parts = []
        if (patientData.alamat) parts.push(patientData.alamat)
        if (patientData.village) parts.push(`Desa ${patientData.village}`)
        if (patientData.district) parts.push(`Kecamatan ${patientData.district}`)
        if (patientData.regency) parts.push(patientData.regency)
        if (patientData.province) parts.push(patientData.province)
        if (patientData.kode_pos) parts.push(patientData.kode_pos)
        return parts.length > 0 ? parts.join(', ') : '-'
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
                {/* Header - Hide on print */}
                <div className="flex justify-between items-center mb-4 print:hidden">
                    <h2 className="text-xl font-bold">Kartu Identitas Pasien</h2>
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

                {/* Document Content - Print optimized */}
                <div className="bg-white p-8 print:p-0 text-center">
                    {/* Hospital Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
                        <h1 className="text-2xl font-bold text-gray-800">LAYANAN KESEHATAN</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Jl.  No. 123, Kota , Provinsi
                        </p>
                        <p className="text-sm text-gray-600">
                            Telp: (021) 1234-5678 | Email: info@layanankesehatan.com
                        </p>
                    </div>

                    {/* Document Title */}
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold underline">KARTU IDENTITAS PASIEN</h2>
                    </div>

                    {/* Patient Information */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            DATA PASIEN
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex">
                                <span className="w-40 font-medium">No. Rekam Medis</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold">{patientData.nrm}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Jenis Kelamin</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">NIK</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.nik || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Pekerjaan</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.pekerjaan || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Nama Pasien</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold">{patientData.nama}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Golongan Darah</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.golongan_darah || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Tanggal Lahir</span>
                                <span className="mr-2">:</span>
                                <span>{formatDate(patientData.tanggal_lahir)}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">No. Telepon</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.no_telp || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Umur</span>
                                <span className="mr-2">:</span>
                                <span>{calculateAge(patientData.tanggal_lahir)} tahun</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex">
                                <span className="w-40 font-medium">Alamat</span>
                                <span className="mr-2">:</span>
                                <span className="flex-1">{getFullAddress()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Penanggung Jawab Information */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            PENANGGUNG JAWAB
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex">
                                <span className="w-40 font-medium">Nama PJ</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.nama_pj || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">No. Telepon PJ</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.no_telp_pj || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Hubungan</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.penanggung_jawab || '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-40 font-medium">Pekerjaan PJ</span>
                                <span className="mr-2">:</span>
                                <span>{patientData.pekerjaan_pj || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Penjamin Information */}
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                            INFORMASI PENJAMIN
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex">
                                <span className="w-40 font-medium">Jenis Penjamin</span>
                                <span className="mr-2">:</span>
                                <span className="font-semibold">{patientData.penjamin_nama || 'UMUM'}</span>
                            </div>
                            
                            {/* BPJS Info */}
                            {patientData.penjamin_tipe?.toLowerCase() === 'bpjs' && patientData.nomor_bpjs && (
                                <div className="flex">
                                    <span className="w-40 font-medium">No. BPJS</span>
                                    <span className="mr-2">:</span>
                                    <span>{patientData.nomor_bpjs}</span>
                                </div>
                            )}

                            {/* Asuransi Info */}
                            {patientData.penjamin_tipe?.toLowerCase() === 'asuransi' && (
                                <>
                                    {patientData.nama_asuransi && (
                                        <div className="flex">
                                            <span className="w-40 font-medium">Nama Asuransi</span>
                                            <span className="mr-2">:</span>
                                            <span>{patientData.nama_asuransi}</span>
                                        </div>
                                    )}
                                    {patientData.nomor_polis && (
                                        <div className="flex">
                                            <span className="w-40 font-medium">No. Polis</span>
                                            <span className="mr-2">:</span>
                                            <span>{patientData.nomor_polis}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Special Notes */}
                    {patientData.catatan_khusus && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                                CATATAN KHUSUS
                            </h3>
                            <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border border-gray-200">
                                {patientData.catatan_khusus}
                            </p>
                        </div>
                    )}
                </div>

                {/* Print Styles */}
                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        .print\\:max-w-full,
                        .print\\:max-w-full * {
                            visibility: visible;
                        }
                        .print\\:max-w-full {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        .print\\:p-0 {
                            padding: 0 !important;
                        }
                        @page {
                            margin: 1cm;
                        }
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
