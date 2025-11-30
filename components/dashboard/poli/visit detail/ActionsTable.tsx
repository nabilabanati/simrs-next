"use client"

import ActionsAccordion from "./ActionsAccordion"
import DetailModal from "./DetailModal"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Eye, Pen, Trash, Printer } from "lucide-react"

interface ActionRow {
  noReg: string
  tanggal: string
  lokasi: string
  tindakan: string
  dokter: string
  catatan: string
  modalData: any
  status: string
}

interface ActionsTableProps {
  data: ActionRow[]
}

export default function ActionsTable({ data }: ActionsTableProps) {
  const [openModal, setOpenModal] = useState(false)
  const [selectedData, setSelectedData] = useState<any>(null)

  function showDetail(row: ActionRow) {
    setSelectedData(row.modalData)
    setOpenModal(true)
  }

  return (
    <>
      <div className="overflow-x-auto border rounded-lg bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50">
            <tr className="text-xs font-bold text-gray-700">
              <th className="px-4 py-3">No.Reg</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Tindakan</th>
              <th className="px-4 py-3">Dokter</th>
              <th className="px-4 py-3 w-64">Catatan Medis</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3">{row.noReg}</td>
                <td className="px-4 py-3">{row.tanggal}</td>
                <td className="px-4 py-3">{row.lokasi}</td>
                <td className="px-4 py-3">{row.tindakan}</td>
                <td className="px-4 py-3">{row.dokter}</td>

                {/* Accordion */}
                <td className="px-4 py-3">
                  <ActionsAccordion title={row.catatan}>
                    <button
                      onClick={() => showDetail(row)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Lihat Detail Lengkap
                    </button>
                  </ActionsAccordion>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 space-x-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4 text-gray-700" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Pen className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash className="w-4 h-4 text-red-600" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Printer className="w-4 h-4 text-gray-700" />
                  </Button>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      row.status === "Dirujuk"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <DetailModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        data={selectedData}
      />
    </>
  )
}
