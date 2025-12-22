import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

interface CompleteMedicalRecordModalProps {
    open: boolean
    onClose: () => void
    patientId: string
}

export default function CompleteMedicalRecordModal({ open, onClose, patientId }: CompleteMedicalRecordModalProps) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (open && patientId) {
            fetchPatientMedicalRecord()
        }
    }, [open, patientId])

    useEffect(() => {
        if (data?.visits && data.visits.length > 0) {
            console.log("First visit data:", data.visits[0]);
            console.log("Triase data:", data.visits[0].triase);
            console.log("Medical records:", data.visits[0].medical_records);
        }
    }, [data])

    async function fetchPatientMedicalRecord() {
        setLoading(true)
        try {
            const response = await fetch(`/api/doctor/patient-medical-record?patient_id=${patientId}`)
            const result = await response.json()

            if (response.ok) {
                setData(result.data)
            } else {
                console.error("Error fetching patient medical record:", result.error)
            }
        } catch (error) {
            console.error("Error fetching patient medical record:", error)
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
                        <span>Rekam Medis Lengkap Pasien</span>
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
                            <p className="text-center text-sm text-gray-600">Riwayat Lengkap Pelayanan Kesehatan</p>
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
                            <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Riwayat Kunjungan</h3>

                            {data?.visits && data.visits.length > 0 ? (
                                data.visits.map((visit: any, index: number) => (
                                    <div key={visit.id} className="mb-6 border border-gray-300 p-4">
                                        <h4 className="font-bold text-md mb-3">
                                            Kunjungan #{data.visits.length - index} - {new Date(visit.created_at).toLocaleDateString("id-ID", {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </h4>

                                        {/* Visit Info */}
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                            <div>
                                                <p><span className="font-semibold">No. Registrasi:</span> {visit.no_reg || "-"}</p>
                                                <p><span className="font-semibold">Poli:</span> {visit.poli?.nama || "-"}</p>
                                                <p><span className="font-semibold">Dokter:</span> {visit.doctors?.users?.nama || "-"}</p>
                                                <p><span className="font-semibold">Perawat:</span> {visit.nurses?.users?.nama || "-"}</p>
                                            </div>
                                            <div>
                                                <p><span className="font-semibold">Status:</span> {visit.status === "selesai" ? "Selesai" : "Dalam Proses"}</p>
                                                <p><span className="font-semibold">Status TTV:</span> {visit.ttv_status === "selesai" ? "Sudah Diisi" : "Belum Diisi"}</p>
                                            </div>
                                        </div>

                                        {/* TTV Data - Table Format */}
                                        {visit.triase && (
                                            <div className="mb-3">
                                                <p className="font-semibold text-sm mb-2">Tanda-Tanda Vital (TTV):</p>
                                                {visit.triase.nurses?.users?.nama && (
                                                    <p className="text-xs text-gray-600 mb-2">
                                                        Diperiksa oleh: <span className="font-semibold">{visit.triase.nurses.users.nama}</span>
                                                    </p>
                                                )}
                                                <table className="w-full text-sm border-collapse border border-gray-300">
                                                    <tbody>
                                                        <tr>
                                                            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50 w-1/4">Tekanan Darah</td>
                                                            <td className="border border-gray-300 px-3 py-2 w-1/4">{visit.triase.tensi || "-"}</td>
                                                            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50 w-1/4">Nadi</td>
                                                            <td className="border border-gray-300 px-3 py-2 w-1/4">{visit.triase.nadi ? `${visit.triase.nadi} x/menit` : "-"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">Suhu</td>
                                                            <td className="border border-gray-300 px-3 py-2">{visit.triase.suhu ? `${visit.triase.suhu}°C` : "-"}</td>
                                                            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">Pernapasan</td>
                                                            <td className="border border-gray-300 px-3 py-2">{visit.triase.resp ? `${visit.triase.resp} x/menit` : "-"}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50">SpO2</td>
                                                            <td className="border border-gray-300 px-3 py-2">{visit.triase.spo2 ? `${visit.triase.spo2}%` : "-"}</td>
                                                            <td className="border border-gray-300 px-3 py-2 font-semibold bg-gray-50"></td>
                                                            <td className="border border-gray-300 px-3 py-2"></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                {visit.triase.catatan && (
                                                    <div className="mt-2 text-sm bg-yellow-50 p-2 rounded">
                                                        <p className="font-semibold">Catatan Perawat:</p>
                                                        <p className="text-gray-700">{visit.triase.catatan}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SOAP */}
                                        {visit.medical_record && (
                                            <div className="mb-3">
                                                <p className="font-semibold text-sm mb-2">Catatan Medis (SOAP):</p>
                                                <div className="text-sm bg-gray-50 p-3 space-y-2">
                                                    <p><span className="font-semibold">Subjective (Keluhan):</span> {visit.medical_record.anamnesis || "-"}</p>
                                                    <p><span className="font-semibold">Objective (Pemeriksaan):</span> {visit.medical_record.pemeriksaan_fisik || "-"}</p>
                                                    <p><span className="font-semibold">Assessment (Diagnosis):</span> {visit.medical_record.assessment || "-"}</p>
                                                    <p><span className="font-semibold">Plan (Rencana):</span> {visit.medical_record.plan || "-"}</p>
                                                    {visit.medical_record.disposition && (
                                                        <p><span className="font-semibold">Tindakan:</span> {
                                                            visit.medical_record.disposition === 'pulang' ? 'Pulang' :
                                                                visit.medical_record.disposition === 'rujuk_rs' ? 'Rujuk ke RS' :
                                                                    visit.medical_record.disposition === 'konsul_internal' ? 'Pindah Poli' : '-'
                                                        }</p>
                                                    )}
                                                    {visit.medical_record.disposition_notes && (
                                                        <p><span className="font-semibold">Catatan Tindakan:</span> {visit.medical_record.disposition_notes}</p>
                                                    )}
                                                    {visit.medical_record.referred_to && (
                                                        <p><span className="font-semibold">Rujukan ke:</span> {visit.medical_record.referred_to}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Referrals */}
                                        {visit.referrals && visit.referrals.length > 0 && (
                                            <div className="mb-3">
                                                <p className="font-semibold text-sm mb-2">Rujukan:</p>
                                                {visit.referrals.map((ref: any) => (
                                                    <div key={ref.id} className="text-sm bg-purple-50 p-2 mb-2 border-l-4 border-purple-500">
                                                        <p><span className="font-semibold">Jenis:</span> {ref.referral_type === 'internal' ? 'Rujukan Internal (Pindah Poli)' : 'Rujukan Eksternal (RS Lain)'}</p>
                                                        {ref.referral_type === 'internal' ? (
                                                            <>
                                                                <p><span className="font-semibold">Dari Poli:</span> {ref.from_poli?.nama || '-'}</p>
                                                                <p><span className="font-semibold">Ke Poli:</span> {ref.to_poli?.nama || '-'}</p>
                                                                <p><span className="font-semibold">Dokter Tujuan:</span> {ref.to_doctor?.users?.nama || '-'}</p>
                                                            </>
                                                        ) : (
                                                            <p><span className="font-semibold">Tujuan:</span> {ref.external_destination || '-'}</p>
                                                        )}
                                                        {ref.notes && <p><span className="font-semibold">Catatan:</span> {ref.notes}</p>}
                                                        <p><span className="font-semibold">Status:</span> {
                                                            ref.status === 'pending' ? 'Menunggu' :
                                                                ref.status === 'completed' ? 'Selesai' :
                                                                    ref.status === 'cancelled' ? 'Dibatalkan' : '-'
                                                        }</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Prescriptions */}
                                        {visit.prescriptions && visit.prescriptions.length > 0 && (
                                            <div className="mb-3">
                                                <p className="font-semibold text-sm mb-2">Resep Obat:</p>
                                                {visit.prescriptions.map((presc: any) => (
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
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">Belum ada riwayat kunjungan</p>
                            )}
                        </div>

                        {/* Lab Results */}
                        <div className="mb-6">
                            <h3 className="text-lg font-bold mb-3 bg-gray-100 px-3 py-2">Hasil Laboratorium</h3>
                            <p className="text-gray-500 text-center py-4">Tidak ada data laboratorium</p>
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
