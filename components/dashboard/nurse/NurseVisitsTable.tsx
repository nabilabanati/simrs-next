'use client';

import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Eye } from 'lucide-react';
import type { Visit } from '@/types/nurse';

interface NurseVisitsTableProps {
    visits: Visit[];
    loading: boolean;
    searchQuery: string;
    nurseId: string;
    onPickPatient: (visit: Visit) => void;
    onResumeTTV: (visit: Visit) => void;
    onCancelTTV: (visitId: string) => void;
    onViewDetail: (visit: Visit) => void;
}

export default function NurseVisitsTable({
    visits,
    loading,
    searchQuery,
    nurseId,
    onPickPatient,
    onResumeTTV,
    onCancelTTV,
    onViewDetail,
}: NurseVisitsTableProps) {
    const router = useRouter();

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

    return (

        <div>
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : visits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'Tidak ada pasien yang sesuai dengan pencarian' : 'Tidak ada pasien di poli ini'}
                </div>
            ) : (
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
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {visits.map((visit, index) => (
                                    <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{index + 1}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{visit.no_reg.split('-')[0] || '-'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{visit.no_reg}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {(() => {
                                                const date = new Date(visit.created_at);
                                                const day = String(date.getDate()).padStart(2, '0');
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const year = date.getFullYear();
                                                return `${day}/${month}/${year}`;
                                            })()}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{visit.patient.nrm}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{visit.patient.nama}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {visit.patient.jenis_kelamin === 'L' ? 'L' : 'P'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">{getStatusBadge(visit.ttv_status)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            {visit.ttv_status === 'belum' && (
                                                <Button
                                                    onClick={() => onPickPatient(visit)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-blue-50"
                                                >
                                                    <ClipboardList className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {visit.ttv_status === 'selesai' && visit.triase && (
                                                <Button
                                                    onClick={() => onViewDetail(visit)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-blue-50"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {visit.ttv_status === 'sedang_dikerjakan' && (
                                                <div className="flex gap-2">
                                                    {visit.triase?.perawat_id === nurseId ? (
                                                        <>
                                                            <Button
                                                                onClick={() => onResumeTTV(visit)}
                                                                size="sm"
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                Lanjutkan
                                                            </Button>
                                                            <Button
                                                                onClick={() => onCancelTTV(visit.id)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                            >
                                                                Batal
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-500 italic">
                                                            Sedang dikerjakan perawat lain
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

    );
}
