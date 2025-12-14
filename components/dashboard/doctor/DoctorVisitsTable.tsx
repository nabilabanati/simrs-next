"use client"

import React from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { ClipboardList } from "lucide-react"

interface Visit {
    id: string
    no: number
    noAntrian: string
    noRegistrasi: string
    tanggalKunjungan: string
    nrm: string
    nama: string
    jenisKelamin: string
    ttvStatus: "belum" | "sedang_dikerjakan" | "selesai"
    status: "waiting" | "completed"
}

interface DoctorVisitsTableProps {
    visits: Visit[]
    currentPage?: number
    itemsPerPage?: number
    loading?: boolean
}

export default function DoctorVisitsTable({
    visits,
    currentPage = 1,
    itemsPerPage = 10,
    loading = false,
}: DoctorVisitsTableProps) {
    const router = useRouter()

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500">
                Memuat data pasien...
            </div>
        )
    }

    if (visits.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">
                Tidak ada pasien hari ini
            </div>
        )
    }

    const getTTVStatusBadge = (status: string) => {
        switch (status) {
            case "selesai":
                return "bg-green-100 text-green-700"
            case "sedang_dikerjakan":
                return "bg-yellow-100 text-yellow-700"
            default:
                return "bg-gray-100 text-gray-700"
        }
    }

    const getTTVStatusText = (status: string) => {
        switch (status) {
            case "selesai":
                return "Selesai"
            case "sedang_dikerjakan":
                return "Sedang Dikerjakan"
            default:
                return "Belum"
        }
    }

    return (
        <div className="overflow-x-auto bg-white border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-blue-50">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium">NO</th>
                        <th className="px-4 py-3 text-left font-medium">NO.ANTRIAN</th>
                        <th className="px-4 py-3 text-left font-medium">NO.REGISTRASI</th>
                        <th className="px-4 py-3 text-left font-medium">TANGGAL</th>
                        <th className="px-4 py-3 text-left font-medium">NRM</th>
                        <th className="px-4 py-3 text-left font-medium">NAMA</th>
                        <th className="px-4 py-3 text-left font-medium">J.K.</th>
                        <th className="px-4 py-3 text-left font-medium">STATUS TTV</th>
                        <th className="px-4 py-3 text-left font-medium">AKSI</th>
                        <th className="px-4 py-3 text-left font-medium">STATUS</th>
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {visits.map((v, index) => {
                        const isTTVDone = v.ttvStatus === "selesai"

                        return (
                            <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">
                                    {(currentPage - 1) * itemsPerPage + (index + 1)}
                                </td>
                                <td className="px-4 py-3">{v.noAntrian}</td>
                                <td className="px-4 py-3">{v.noRegistrasi}</td>
                                <td className="px-4 py-3">{v.tanggalKunjungan}</td>
                                <td className="px-4 py-3">{v.nrm}</td>
                                <td className="px-4 py-3">{v.nama}</td>
                                <td className="px-4 py-3">{v.jenisKelamin}</td>

                                {/* TTV Status */}
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full font-medium ${getTTVStatusBadge(
                                            v.ttvStatus
                                        )}`}
                                    >
                                        {getTTVStatusText(v.ttvStatus)}
                                    </span>
                                </td>

                                {/* Action Button */}
                                <td className="px-4 py-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title={
                                            isTTVDone
                                                ? "Lihat Detail Pasien"
                                                : "Menunggu TTV dari perawat"
                                        }
                                        disabled={!isTTVDone}
                                        onClick={() => router.push(`/doctor/patients/${v.id}`)}
                                    >
                                        <ClipboardList
                                            className={`w-5 h-5 ${isTTVDone ? "text-blue-600" : "text-gray-400"
                                                }`}
                                        />
                                    </Button>
                                </td>

                                {/* Visit Status */}
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full font-medium ${v.status === "completed"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                            }`}
                                    >
                                        {v.status === "completed"
                                            ? "Sudah Ditangani"
                                            : "Menunggu Penanganan"}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
