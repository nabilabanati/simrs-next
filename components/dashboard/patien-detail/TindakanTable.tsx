// components/patient-detail/TindakanTable.tsx

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TindakanTable({ pasienId }: { pasienId: string }) {
  // ini dummy, nanti pakai history dari poli
  const tindakan = [
    {
      id: "1",
      tanggal: "2025-06-18",
      lokasi: "Poli Umum",
      tindakan: "Pemeriksaan Fisik",
    },
    {
      id: "2",
      tanggal: "2025-07-18",
      lokasi: "Poli Penyakit Dalam",
      tindakan: "Pemeriksaan Fisik",
    },
  ]

  return (
    <div className="bg-white border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-blue-50">
          <tr>
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Lokasi</th>
            <th className="px-4 py-3">Tindakan</th>
            <th className="px-4 py-3">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {tindakan.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="px-4 py-3">{t.tanggal}</td>
              <td className="px-4 py-3">{t.lokasi}</td>
              <td className="px-4 py-3">{t.tindakan}</td>

              <td className="px-4 py-3">
                <Link href={`${t.id}`}>
                  <Button variant="outline">Lihat Detail</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
