// components/dashboard/patient/TindakanList.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import type { PatientVisit } from "@/lib/shared/types/visit"

interface TindakanListProps {
    tindakanList: PatientVisit[]
    poliSlug: string
    pasienId: string
}

export default function TindakanList({ tindakanList, poliSlug, pasienId }: TindakanListProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null)
    const itemsPerPage = 10

    // Format date to Indonesian
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Filter by search and date
    const filteredList = tindakanList.filter(t => {
        const matchSearch = searchQuery === "" ||
            t.noRegistrasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.poli === 'penyakit-dalam' ? 'Poli Penyakit Dalam' : 'Poli Umum').toLowerCase().includes(searchQuery.toLowerCase())

        const matchDate = selectedDate === "" || t.tanggalKunjungan === selectedDate

        return matchSearch && matchDate
    })

    // Pagination
    const totalPages = Math.ceil(filteredList.length / itemsPerPage)
    const paginatedList = filteredList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const resetFilters = () => {
        setSearchQuery("")
        setSelectedDate("")
        setCurrentPage(1)
    }

    const getStatusBadge = (status: string) => {
        if (status === "completed") {
            return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Pulang</span>
        }
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Dirujuk</span>
    }

    return (
        <div className="mb-6 gap-6 text-sm">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Data Tindakan</h2>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Tambah Tindakan</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cari Tindakan / Dokter / Lokasi
                        </label>
                        <input
                            type="text"
                            placeholder="Cari"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tanggal Tindakan
                        </label>
                        <div className="flex items-center space-x-3">
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-blue-50">
                                <tr className="border-b border-gray-200 text-sm">
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">No.Reg</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">Tanggal Tindakan</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">Lokasi Pelayanan</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">Nama Tindakan</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">Dokter PJ</th>
                                    <th scope="col" className="py-3 px-4 text-start text-xs font-bold text-gray-700 w-[300px] max-w-[300px]">Catatan Medis</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">Aksi</th>
                                    <th scope="col" className="px-6 py-3 text-start text-xs font-bold text-gray-700 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">
                                            Tidak ada data tindakan
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedList.map((tindakan) => (
                                        <tr key={tindakan.noRegistrasi} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                                            <td className="py-4 px-4">{tindakan.noRegistrasi}</td>
                                            <td className="py-4 px-4">{formatDate(tindakan.tanggalKunjungan)}</td>
                                            <td className="py-4 px-4">
                                                {tindakan.poli === 'penyakit-dalam' ? 'Poli Penyakit Dalam' : 'Poli Umum'}
                                            </td>
                                            <td className="py-4 px-4">Pemeriksaan Fisik</td>
                                            <td className="py-4 px-4">dr. Sho</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-between gap-x-3 w-full">
                                                    <span>Tensi cukup tinggi, Hipertensi</span>
                                                    <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                                                    </svg>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 relative">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800"
                                                    onClick={() => setOpenActionMenu(openActionMenu === tindakan.noRegistrasi ? null : tindakan.noRegistrasi)}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                {openActionMenu === tindakan.noRegistrasi && (
                                                    <div className="absolute right-0 bg-white shadow-lg rounded-lg mt-2 py-2 z-10 min-w-32">
                                                        <Link
                                                            href={`/poliklinik/${poliSlug}/${pasienId}/${tindakan.noRegistrasi}`}
                                                            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Lihat
                                                        </Link>
                                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                            Edit
                                                        </a>
                                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            Hapus
                                                        </a>
                                                        <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                                                            </svg>
                                                            Print
                                                        </a>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {getStatusBadge(tindakan.status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-6">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            {currentPage}
                        </button>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
