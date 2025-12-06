// components/dashboard/patien-detail/TindakanAccordion.tsx

"use client"

import { useState } from "react"
import type { PatientVisit } from "@/lib/shared/types/visit"

interface TindakanData {
    id?: string
    tanggal?: string
    tanggalKunjungan?: string
    lokasi?: string
    poli?: string
    tindakan?: string
    dokter?: string
    keluhan?: string
    pemeriksaan?: string
    td?: string
    nadi?: string
    suhu?: string
    bb?: string
    tb?: string
    respirasi?: string
    diagnosis?: string
    resep?: string
    anjuran?: string
    nama?: string
    nrm?: string
    noAntrian?: string
    noRegistrasi?: string
}

interface Props {
    tindakan?: TindakanData | PatientVisit
}

export default function TindakanAccordion({ tindakan }: Props) {
    const [isOpen, setIsOpen] = useState(true)

    if (!tindakan) {
        return (
            <div className="bg-white border rounded-lg p-6 text-center text-gray-500">
                Data tindakan tidak ditemukan
            </div>
        )
    }

    // Normalize data - handle both TindakanData and PatientVisit
    const displayDate = (tindakan as any).tanggal || (tindakan as any).tanggalKunjungan || "-"
    const displayLokasi = (tindakan as any).lokasi || (tindakan as any).poli || "-"

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between"
            >
                <div className="text-left">
                    <h3 className="font-semibold text-gray-800">
                        Detail Tindakan - {displayDate}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {displayLokasi} {(tindakan as any).dokter && `| ${(tindakan as any).dokter}`}
                    </p>
                </div>
                <svg
                    className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Content */}
            {isOpen && (
                <div className="p-6 space-y-6">
                    {/* Informasi Umum */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Informasi Umum</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><strong>Tanggal:</strong> {displayDate}</p>
                                <p><strong>Lokasi:</strong> {displayLokasi}</p>
                                {(tindakan as any).nama && <p><strong>Pasien:</strong> {(tindakan as any).nama}</p>}
                            </div>
                            <div>
                                {(tindakan as any).tindakan && <p><strong>Tindakan:</strong> {(tindakan as any).tindakan}</p>}
                                {(tindakan as any).dokter && <p><strong>Dokter:</strong> {(tindakan as any).dokter}</p>}
                                {(tindakan as any).nrm && <p><strong>NRM:</strong> {(tindakan as any).nrm}</p>}
                                {(tindakan as any).noRegistrasi && <p><strong>No. Registrasi:</strong> {(tindakan as any).noRegistrasi}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Pemeriksaan Fisik - only if data exists */}
                    {((tindakan as any).td || (tindakan as any).nadi || (tindakan as any).suhu) && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">Pemeriksaan Fisik</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                {(tindakan as any).td && (
                                    <div>
                                        <p className="text-gray-600">Tekanan Darah</p>
                                        <p className="font-medium">{(tindakan as any).td}</p>
                                    </div>
                                )}
                                {(tindakan as any).nadi && (
                                    <div>
                                        <p className="text-gray-600">Nadi</p>
                                        <p className="font-medium">{(tindakan as any).nadi}</p>
                                    </div>
                                )}
                                {(tindakan as any).suhu && (
                                    <div>
                                        <p className="text-gray-600">Suhu</p>
                                        <p className="font-medium">{(tindakan as any).suhu}</p>
                                    </div>
                                )}
                                {(tindakan as any).bb && (
                                    <div>
                                        <p className="text-gray-600">Berat Badan</p>
                                        <p className="font-medium">{(tindakan as any).bb}</p>
                                    </div>
                                )}
                                {(tindakan as any).tb && (
                                    <div>
                                        <p className="text-gray-600">Tinggi Badan</p>
                                        <p className="font-medium">{(tindakan as any).tb}</p>
                                    </div>
                                )}
                                {(tindakan as any).respirasi && (
                                    <div>
                                        <p className="text-gray-600">Respirasi</p>
                                        <p className="font-medium">{(tindakan as any).respirasi}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Anamnesis & Diagnosis - only if data exists */}
                    {((tindakan as any).keluhan || (tindakan as any).pemeriksaan || (tindakan as any).diagnosis) && (
                        <div className="space-y-4 text-sm">
                            {(tindakan as any).keluhan && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Keluhan</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                                        {(tindakan as any).keluhan}
                                    </p>
                                </div>
                            )}

                            {(tindakan as any).pemeriksaan && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Pemeriksaan</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                                        {(tindakan as any).pemeriksaan}
                                    </p>
                                </div>
                            )}

                            {(tindakan as any).diagnosis && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Diagnosis</h4>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                                        {(tindakan as any).diagnosis}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Resep */}
                    {(tindakan as any).resep && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Resep</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                {(tindakan as any).resep}
                            </p>
                        </div>
                    )}

                    {/* Anjuran */}
                    {(tindakan as any).anjuran && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Anjuran</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                                {(tindakan as any).anjuran}
                            </p>
                        </div>
                    )}

                    {/* Status - if from PatientVisit */}
                    {(tindakan as PatientVisit).status && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Status</h4>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm ${(tindakan as PatientVisit).status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {(tindakan as PatientVisit).status === "completed" ? "Selesai" : "Menunggu"}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
