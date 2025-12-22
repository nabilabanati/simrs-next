"use client"

import React from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { ClipboardList } from "lucide-react"
import type { DoctorVisit } from "@/types/doctor"

interface DoctorVisitsTableProps {
    visits: DoctorVisit[]
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
                return "bg-green-50 text-green-700 border border-green-200"
            case "sedang_dikerjakan":
                return "bg-yellow-50 text-yellow-700 border border-yellow-200"
            default:
                return "bg-gray-50 text-gray-700 border border-gray-200"
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NO</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NO. ANTRIAN</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NO. REG</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TANGGAL</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NRM</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NAMA PASIEN</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">J.K.</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS TTV</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">AKSI</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {visits.map((v, index) => {
                            const isTTVDone = v.ttvStatus === "selesai"

                            return (
                                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {(currentPage - 1) * itemsPerPage + (index + 1)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{v.noAntrian}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{v.noRegistrasi}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{v.tanggalKunjungan}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{v.nrm}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{v.nama}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{v.jenisKelamin}</td>

                                    {/* TTV Status */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full font-medium ${getTTVStatusBadge(
                                                v.ttvStatus
                                            )}`}
                                        >
                                            {getTTVStatusText(v.ttvStatus)}
                                        </span>
                                    </td>

                                    {/* Action Button */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title={
                                                isTTVDone
                                                    ? "Lihat Detail Pasien"
                                                    : "Menunggu TTV dari perawat"
                                            }
                                            disabled={!isTTVDone}
                                            onClick={() => router.push(`/doctor/patients/${v.id}?from=dashboard`)}
                                        >
                                            <ClipboardList
                                                className={`w-5 h-5 ${isTTVDone ? "text-blue-600" : "text-gray-400"
                                                    }`}
                                            />
                                        </Button>
                                    </td>

                                    {/* Visit Status */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full font-medium ${v.status === "completed"
                                                ? "bg-green-50 text-green-700 border border-green-200"
                                                : "bg-red-50 text-red-700 border border-red-200"
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
        </div>
    )
}
