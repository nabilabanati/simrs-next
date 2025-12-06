// components/dashboard/patient/PatientDetailHeader.tsx

import type { PatientData } from "@/lib/shared/types/patient"

interface PatientDetailHeaderProps {
    patient: PatientData | undefined
}

export default function PatientDetailHeader({ patient }: PatientDetailHeaderProps) {
    if (!patient) return null

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-semibold text-gray-800">NY. {patient.nama}</h1>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    AMI
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">NRM: {patient.nrm}</p>
            <p className="text-sm text-gray-500">
                Tanggal Terdaftar: {formatDate(patient.tanggalTerdaftar)}
            </p>
        </div>
    )
}
