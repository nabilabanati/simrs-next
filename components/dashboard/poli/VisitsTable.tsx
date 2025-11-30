"use client"

import React from "react"
import { useRouter } from "next/router"
import type { PatientVisit } from "@/lib/shared/types/visit"
import { Button } from "@/components/ui/button"
import { ClipboardList } from "lucide-react"

interface VisitsTableProps {
  visits: PatientVisit[]
  currentPage?: number
  itemsPerPage?: number
  loading?: boolean
}

export default function VisitsTable({
  visits,
  currentPage = 1,
  itemsPerPage = 10,
  loading = false,
}: VisitsTableProps) {
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Memuat data pasien...
      </div>
    )
  }

  const sortedVisits = [...visits].sort((a, b) => {
    if (a.status === "waiting" && b.status === "completed") return -1
    if (a.status === "completed" && b.status === "waiting") return 1
    return Number(a.noAntrian) - Number(b.noAntrian)
  })

  const router = useRouter()
  return (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">NO</th>
            <th className="px-4 py-3 text-left font-medium">NO.ANTREAN</th>
            <th className="px-4 py-3 text-left font-medium">NO.REGISTRASI</th>
            <th className="px-4 py-3 text-left font-medium">TANGGAL</th>
            <th className="px-4 py-3 text-left font-medium">NRM</th>
            <th className="px-4 py-3 text-left font-medium">NAMA</th>
            <th className="px-4 py-3 text-left font-medium">J.K.</th>
            <th className="px-4 py-3 text-left font-medium">AKSI</th>
            <th className="px-4 py-3 text-left font-medium">STATUS</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {sortedVisits.map((v, index) => (
            <tr key={v.noRegistrasi} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                {(currentPage - 1) * itemsPerPage + (index + 1)}
              </td>
              <td className="px-4 py-3">{v.noAntrian}</td>
              <td className="px-4 py-3">{v.noRegistrasi}</td>
              <td className="px-4 py-3">{v.tanggalKunjungan}</td>
              <td className="px-4 py-3">{v.nrm}</td>
              <td className="px-4 py-3">{v.nama}</td>
              <td className="px-4 py-3">{v.jenisKelamin}</td>

              <td className="px-4 py-4">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Detail Kunjungan"
                  onClick={() =>
                    router.push(
                      `/poliklinik/${v.poli}/${v.idPasien}/${v.noRegistrasi}`
                    )
                  }
                >
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </Button>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    v.status === "completed"
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
