"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DetailModalProps {
  open: boolean
  onClose: () => void
  data: any
}

export default function DetailModal({ open, onClose, data }: DetailModalProps) {
  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Pemeriksaan</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><b>Tanggal:</b> {data.tanggal}</p>
            <p><b>Lokasi:</b> {data.lokasi}</p>
            <p><b>Tindakan:</b> {data.tindakan}</p>
            <p><b>Dokter:</b> {data.dokter}</p>
            <p><b>Diagnosis:</b> {data.diagnosis}</p>
          </div>
          <div>
            <p><b>Tekanan Darah:</b> {data.td}</p>
            <p><b>Nadi:</b> {data.nadi}</p>
            <p><b>Suhu:</b> {data.suhu}</p>
            <p><b>Berat Badan:</b> {data.bb}</p>
            <p><b>Tinggi Badan:</b> {data.tb}</p>
          </div>
        </div>

        <div className="mt-4">
          <p><b>Keluhan:</b> {data.keluhan}</p>
          <p><b>Pemeriksaan:</b> {data.pemeriksaan}</p>
          <p><b>Resep:</b> {data.resep}</p>
          <p><b>Anjuran:</b> {data.anjuran}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
