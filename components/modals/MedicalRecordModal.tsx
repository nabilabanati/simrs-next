import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

interface MedicalRecordModalProps {
    open: boolean
    onClose: () => void
    visitId: string
}

export default function MedicalRecordModal({ open, onClose, visitId }: MedicalRecordModalProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (open && visitId) {
            fetchVisitDetail()
        }
    }, [open, visitId])

    async function fetchVisitDetail() {
        setLoading(true)
        try {
            const response = await fetch(`/api/doctor/visit-detail?visit_id=${visitId}`)
            const result = await response.json()

            if (response.ok) {
                console.log("Visit detail data:", result.data);
                console.log("SOAP data:", result.data?.soap);
                setData(result.data)
            } else {
                console.error("Error fetching visit detail:", result.error)
            }
        } catch (error) {
            console.error("Error fetching visit detail:", error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

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

    if (!data && !loading) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="!w-[85vw] !max-w-[1400px] max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full">
                {/* Header - Hidden on print */}
                <DialogHeader className="print:hidden">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Rekam Medis Kunjungan</span>
                        <div className="flex gap-2">
                            <Button onClick={handlePrint} size="sm">
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button onClick={onClose} variant="ghost" size="sm">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Detail rekam medis untuk kunjungan pasien
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-gray-600">Memuat data...</p>
                    </div>
                ) : (
                    <div className="medical-record-content">
                        {/* Print Styles */}
                        <style jsx>{`
                            @media print {
                                body * {
                                    visibility: hidden;
                                }
                                .medical-record-content,
                                .medical-record-content * {
                                    visibility: visible;
                                }
                                .medical-record-content {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    padding: 20px;
                                }
                                .print\\:hidden {
                                    display: none !important;
                                }
                                table {
                                    page-break-inside: auto;
                                }
                                tr {
                                    page-break-inside: avoid;
                                    page-break-after: auto;
                                }
                            }
                        `}</style>

                        {/* Header */}
                        <div className="border-b-2 border-gray-800 pb-4 mb-6">
                            <h1 className="text-2xl font-bold text-center mb-2">RUMAH SAKIT</h1>
                            <h2 className="text-xl font-semibold text-center mb-1">REKAM MEDIS PASIEN</h2>
                            <p className="text-center text-sm text-gray-600">Riwayat Kunjungan Pasien</p>
                        </div>

                        {/* Patient Information */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Informasi Pasien</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p><span className="font-semibold">No. RM:</span> {data?.patient?.nrm || "-"}</p>
                                    <p><span className="font-semibold">NIK:</span> {data?.patient?.nik || "-"}</p>
                                    <p><span className="font-semibold">Nama:</span> {data?.patient?.nama || "-"}</p>
                                    <p><span className="font-semibold">Tanggal Lahir:</span> {data?.patient?.tanggal_lahir ? new Date(data.patient.tanggal_lahir).toLocaleDateString("id-ID") : "-"} ({calculateAge(data?.patient?.tanggal_lahir)})</p>
                                    <p><span className="font-semibold">Tempat Lahir:</span> {data?.patient?.tempat_lahir || "-"}</p>
                                </div>
                                <div>
                                    <p><span className="font-semibold">Jenis Kelamin:</span> {data?.patient?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</p>
                                    <p><span className="font-semibold">Golongan Darah:</span> {data?.patient?.golongan_darah || "-"}</p>
                                    <p><span className="font-semibold">No. Telepon:</span> {data?.patient?.no_telepon || "-"}</p>
                                    <p><span className="font-semibold">Alamat:</span> {data?.patient?.alamat || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Visit History */}
                        <div className="mb-6">
                            {/* TTV Data - Table Format */}
                            {data?.triase && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Tanda-Tanda Vital (TTV)</h3>
                                    {data.triase.nurses?.users?.nama && (
                                        <p className="text-xs text-gray-600 mb-2">
                                            Diperiksa oleh: <span className="font-semibold">{data.triase.nurses.users.nama}</span>
                                        </p>
                                    )}
                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                        <tbody>
                                            <tr>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50 w-1/4">Tekanan Darah</td>
                                                <td className="border border-gray-300 px-3 py-2 w-1/4">{data.triase.tensi || "-"}</td>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50 w-1/4">Nadi</td>
                                                <td className="border border-gray-300 px-3 py-2 w-1/4">{data.triase.nadi ? `${data.triase.nadi} x/menit` : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">Suhu</td>
                                                <td className="border border-gray-300 px-3 py-2">{data.triase.suhu ? `${data.triase.suhu}°C` : "-"}</td>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">Pernapasan</td>
                                                <td className="border border-gray-300 px-3 py-2">{data.triase.resp ? `${data.triase.resp} x/menit` : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">SpO2</td>
                                                <td className="border border-gray-300 px-3 py-2">{data.triase.spo2 ? `${data.triase.spo2}%` : "-"}</td>
                                                <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50"></td>
                                                <td className="border border-gray-300 px-3 py-2"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    {data.triase.catatan && (
                                        <div className="mt-2 text-sm bg-yellow-50 p-2 rounded">
                                            <p className="font-semibold">Catatan Perawat:</p>
                                            <p className="text-gray-700">{data.triase.catatan}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Doctor Info */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Dokter Pemeriksa</h3>
                                <p className="text-sm">{data?.doctor?.nama || "-"}</p>
                            </div>

                            {/* SOAP */}
                            {data?.soap && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Catatan Medis (SOAP)</h3>
                                    <div className="text-sm bg-gray-50 p-3 space-y-2">
                                        <p><span className="font-semibold">Subjective (Keluhan):</span> {data.soap.anamnesis || "-"}</p>
                                        <p><span className="font-semibold">Objective (Pemeriksaan):</span> {data.soap.pemeriksaan_fisik || "-"}</p>
                                        <p><span className="font-semibold">Assessment (Diagnosis):</span> {data.soap.assessment || "-"}</p>
                                        <p><span className="font-semibold">Plan (Rencana):</span> {data.soap.plan || "-"}</p>
                                        {data.soap.disposition && (
                                            <p><span className="font-semibold">Tindakan:</span> {
                                                data.soap.disposition === 'pulang' ? 'Pulang' :
                                                    data.soap.disposition === 'rujuk_rs' ? 'Rujuk ke RS' :
                                                        data.soap.disposition === 'konsul_internal' ? 'Pindah Poli' : '-'
                                            }</p>
                                        )}
                                        {data.soap.disposition_notes && (
                                            <p><span className="font-semibold">Catatan Tindakan:</span> {data.soap.disposition_notes}</p>
                                        )}
                                        {data.soap.referred_to && (
                                            <p><span className="font-semibold">Rujukan ke:</span> {data.soap.referred_to}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Prescriptions */}
                            {data?.prescriptions && data.prescriptions.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Resep Obat</h3>
                                    {data.prescriptions.map((presc: any) => (
                                        <div key={presc.id} className="text-sm bg-blue-50 p-2 mb-2">
                                            <p className="font-semibold">No. Resep: {presc.no_order}</p>
                                            {presc.prescription_items && presc.prescription_items.length > 0 && (
                                                <ul className="list-disc list-inside mt-1">
                                                    {presc.prescription_items.map((item: any) => (
                                                        <li key={item.id}>
                                                            {item.medicines?.nama} - {item.qty} {item.satuan}
                                                            {item.instruksi && ` - ${item.instruksi}`}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
                            <p>Dicetak pada: {new Date().toLocaleDateString("id-ID", {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
