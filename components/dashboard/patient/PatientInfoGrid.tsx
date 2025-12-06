// components/dashboard/patient/PatientInfoGrid.tsx

import type { PatientData } from "@/lib/shared/types/patient"

interface PatientInfoGridProps {
    patient: PatientData | undefined
}

export default function PatientInfoGrid({ patient }: PatientInfoGridProps) {
    if (!patient) return null

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
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                    <table className="w-full text-sm text-left text-gray-700">
                        <tbody>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top w-40 whitespace-nowrap">No. Reg</th>
                                <td className="py-2 text-gray-600">PD/{patient.nrm}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">NIK</th>
                                <td className="py-2 text-gray-600">{patient.nik}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Tgl. Lahir / Umur</th>
                                <td className="py-2 text-gray-600">
                                    {formatDate(patient.tanggalLahir)} / {calculateAge(patient.tanggalLahir)} Tahun
                                </td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Jenis Kelamin</th>
                                <td className="py-2 text-gray-600">
                                    {patient.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                </td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Alamat</th>
                                <td className="py-2 text-gray-600">{patient.alamat}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                    <table className="w-full text-sm text-left text-gray-700">
                        <tbody>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top w-40 whitespace-nowrap">Dokter PJ</th>
                                <td className="py-2 text-gray-600">dr. Sho</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Jenis</th>
                                <td className="py-2 text-gray-600">{patient.penjamin}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Asal Rujukan</th>
                                <td className="py-2 text-gray-600">{patient.asalRujukan}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">No. Rujukan</th>
                                <td className="py-2 text-gray-600">{patient.noRujukan}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">No. BPJS / No. SEP</th>
                                <td className="py-2 text-gray-600">{patient.nomor_surat || '-'}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Alergi</th>
                                <td className="py-2 text-gray-600">Ibuprofen</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Penyakit Khusus</th>
                                <td className="py-2 text-gray-600">{patient.catatanKhusus}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Column 3 */}
                <div className="space-y-4">
                    <table className="w-full text-sm text-left text-gray-700">
                        <tbody>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top w-40 whitespace-nowrap">Penanggung Jawab</th>
                                <td className="py-2 text-gray-600">{patient.namaPJ}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">No. Telp PJ</th>
                                <td className="py-2 text-gray-600">{patient.noTelpPJ}</td>
                            </tr>
                            <tr>
                                <th className="py-2 pr-4 font-bold text-gray-700 align-top">Hubungan dengan Pasien</th>
                                <td className="py-2 text-gray-600">{patient.penanggungJawab}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="text-sm text-gray-500">
                        * Untuk mengganti data Penanggung Jawab silahkan hubungi pendaftran
                    </div>
                </div>
            </div>
        </div>
    )
}
