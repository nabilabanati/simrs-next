'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Search, User, Eye } from "lucide-react";
import { toast } from "sonner";
import NurseLayout from "@/components/layout/NurseLayout";
import Breadcrumb from "@/components/dashboard/poli/Breadcrumb";
import TTVDetailModal from "@/components/modals/TTVDetailModal";

interface Visit {
    id: string;
    no_reg: string;
    created_at: string;
    ttv_status: string;
    patient: {
        nrm: string;
        nama: string;
        jenis_kelamin: string;
    };
    triase?: {
        tensi: string;
        nadi: number;
        suhu: number;
        spo2: number;
        resp: number;
        catatan: string;
        nurses?: {
            users?: {
                nama: string;
            };
        };
    };
}

export default function NurseHistoryPage() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [poliName, setPoliName] = useState<string>("Poli");
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const ITEMS_PER_PAGE = 15;

    // Auth check
    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        if (!u || u.role !== "nurse") {
            router.push("/login");
            return;
        }
        setUser(u);
    }, [router]);

    // Fetch visit history
    useEffect(() => {
        if (!user) return;
        fetchVisitHistory();
    }, [user]);

    const fetchVisitHistory = async () => {
        setLoading(true);
        try {
            // Fetch nurse profile to get poli
            const profileRes = await fetch(`/api/nurse/profile?user_id=${user.id}`);
            const profileData = await profileRes.json();

            if (profileData.poli) {
                setPoliName(profileData.poli.nama);

                // Fetch ALL visit history from this poli (not limited to today)
                const visitsRes = await fetch(`/api/nurse/visit-history?poli_id=${profileData.poli.id}`);
                const visitsData = await visitsRes.json();

                if (visitsData.visits) {
                    // Show all visits, sorted by date (newest first)
                    const sortedVisits = visitsData.visits.sort((a: Visit, b: Visit) => {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    });
                    setVisits(sortedVisits);
                }
            }
        } catch (error) {
            console.error("Error fetching visit history:", error);
            toast.error("Terjadi kesalahan saat memuat data");
            setVisits([]);
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        let badgeClass = '';
        let label = '';

        switch (status) {
            case 'selesai':
                badgeClass = 'bg-green-50 text-green-700 border border-green-200';
                label = 'Selesai';
                break;
            case 'sedang_dikerjakan':
                badgeClass = 'bg-yellow-50 text-yellow-700 border border-yellow-200';
                label = 'Sedang Dikerjakan';
                break;
            default:
                badgeClass = 'bg-red-50 text-red-700 border border-red-200';
                label = 'Belum';
        }

        return (
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${badgeClass}`}>
                {label}
            </span>
        );
    };

    // Filter visits by search query
    const filteredVisits = useMemo(() => {
        if (!searchQuery) return visits;

        const query = searchQuery.toLowerCase();
        return visits.filter((visit) => {
            return (
                visit.patient.nama.toLowerCase().includes(query) ||
                visit.patient.nrm.toLowerCase().includes(query) ||
                visit.no_reg.toLowerCase().includes(query)
            );
        });
    }, [visits, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE);
    const paginatedVisits = filteredVisits.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleViewDetail = (visit: Visit) => {
        setSelectedVisit(visit);
        setDetailModalOpen(true);
    };

    if (!user || loading) {
        return (
            <NurseLayout>
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Memuat data...</p>
                    </div>
                </div>
            </NurseLayout>
        );
    }

    return (
        <NurseLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    {/* Breadcrumb */}
                    <Breadcrumb
                        items={[
                            { label: `${poliName}`, href: "/nurse" },
                            { label: "Riwayat Kunjungan" },
                        ]}
                    />

                    {/* Header */}
                    <div className="mb-8 mt-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Riwayat Kunjungan Pasien
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Daftar semua pasien yang datang ke poli
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari No. Reg, NRM, atau Nama Pasien"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            NO
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            TANGGAL
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            NO. REG
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            NRM
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            NAMA PASIEN
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            J.K.
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            PERAWAT
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            STATUS TTV
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            AKSI
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedVisits.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                <div className="flex flex-col items-center">
                                                    <User className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p className="font-medium">
                                                        {searchQuery
                                                            ? "Tidak ada pasien yang sesuai dengan pencarian"
                                                            : "Belum ada riwayat kunjungan pasien"}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVisits.map((visit, index) => {
                                            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                                            return (
                                                <tr
                                                    key={visit.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {globalIndex}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(visit.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {visit.no_reg}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {visit.patient.nrm}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                        {visit.patient.nama}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {visit.patient.jenis_kelamin}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {visit.triase?.nurses?.users?.nama || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {getStatusBadge(visit.ttv_status)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {visit.ttv_status === 'selesai' && visit.triase ? (
                                                            <button
                                                                onClick={() => handleViewDetail(visit)}
                                                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                                title="Lihat Detail TTV"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    &lt;
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 rounded text-sm ${currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                                        return (
                                            <span key={page} className="px-2">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    &gt;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TTV Detail Modal */}
            <TTVDetailModal
                isOpen={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedVisit(null);
                }}
                visit={selectedVisit}
            />
        </NurseLayout>
    );
}
