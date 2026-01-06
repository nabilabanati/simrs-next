'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NurseLayout from '@/components/layout/NurseLayout';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '@/components/dashboard/poli/Breadcrumb';
import DashboardHeader from '@/components/dashboard/poli/DashboardHeader';
import SearchInput from '@/components/dashboard/poli/SearchInput';
import NurseSummaryCards from '@/components/dashboard/nurse/NurseSummaryCards';
import NurseVisitsTable from '@/components/dashboard/nurse/NurseVisitsTable';
import TTVModal from '@/components/dashboard/nurse/TTVModal';
import TTVDetailModal from '@/components/modals/TTVDetailModal';
import type { Visit } from '@/types/nurse';


export default function NurseDashboard() {
    const router = useRouter();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nurseId, setNurseId] = useState('');
    const [nurseName, setNurseName] = useState('');
    const [poliId, setPoliId] = useState('');
    const [poliName, setPoliName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailVisit, setDetailVisit] = useState<Visit | null>(null);

    // Fetch nurse profile and poli
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);

        // Check if user has nurse role
        if (userData.role !== 'nurse') {
            toast.error('Akses ditolak. Anda bukan perawat.');
            router.push('/login');
            return;
        }

        setNurseName(userData.nama || 'Perawat');

        fetch(`/api/nurse/profile?user_id=${userData.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.nurse_id) {
                    setNurseId(data.nurse_id);
                }
                if (data.poli) {
                    setPoliId(data.poli.id);
                    setPoliName(data.poli.nama);
                }
            })
            .catch(error => {
                console.error('Error fetching nurse profile:', error);
                toast.error('Gagal memuat profil perawat');
            });
    }, [router]);

    // Fetch visits
    const fetchVisits = async (isRefresh = false) => {
        if (!poliId) return;

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const res = await fetch(`/api/nurse/visits?poli_id=${poliId}`);
            const data = await res.json();

            if (data.visits) {
                setVisits(data.visits);
            }
        } catch (error) {
            console.error('Error fetching visits:', error);
            toast.error('Gagal memuat data kunjungan');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (poliId) {
            fetchVisits();

            // Auto-refresh every 5 seconds
            const interval = setInterval(() => {
                fetchVisits(true);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [poliId]);

    // Handle pick patient for TTV
    const handlePickPatient = async (visit: Visit) => {
        try {
            const res = await fetch('/api/nurse/pick-patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: visit.id,
                    nurse_id: nurseId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Gagal mengambil pasien');
                return;
            }

            setSelectedVisit(visit);
            setIsModalOpen(true);
            toast.success('Pasien berhasil diambil');
            fetchVisits(true);
        } catch (error) {
            console.error('Error picking patient:', error);
            toast.error('Terjadi kesalahan saat mengambil pasien');
        }
    };

    // Handle resume TTV
    const handleResumeTTV = (visit: Visit) => {
        setSelectedVisit(visit);
        setIsModalOpen(true);
    };

    // Handle cancel TTV
    const handleCancelTTV = async (visitId: string) => {
        try {
            const res = await fetch('/api/nurse/cancel-ttv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visit_id: visitId }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || 'Gagal membatalkan TTV');
                return;
            }

            toast.success('TTV berhasil dibatalkan');
            fetchVisits(true);
        } catch (error) {
            console.error('Error canceling TTV:', error);
            toast.error('Terjadi kesalahan saat membatalkan TTV');
        }
    };

    // Handle view TTV detail
    const handleViewDetail = (visit: Visit) => {
        setDetailVisit(visit);
        setDetailModalOpen(true);
    };

    // Handle TTV form submit
    const handleTTVSubmit = async (formData: any) => {
        if (!selectedVisit) return;

        try {
            const res = await fetch('/api/nurse/save-ttv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: selectedVisit.id,
                    nurse_id: nurseId,
                    ...formData,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Gagal menyimpan TTV');
                return;
            }

            toast.success('TTV berhasil disimpan');
            setIsModalOpen(false);
            setSelectedVisit(null);
            fetchVisits(true);
        } catch (error) {
            console.error('Error saving TTV:', error);
            toast.error('Terjadi kesalahan saat menyimpan TTV');
        }
    };

    // Filter visits based on search query
    const filteredVisits = visits.filter(visit => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            visit.no_reg.toLowerCase().includes(query) ||
            visit.patient.nrm.toLowerCase().includes(query) ||
            visit.patient.nama.toLowerCase().includes(query)
        );
    });

    return (
        <NurseLayout>
            <div className="min-h-screen bg-white">
                <div className="px-12 pb-12 py-12 pr-12 pl-12 pt-16">
                    <div suppressHydrationWarning>
                        <Breadcrumb
                            items={[
                                { label: `${poliName}` },
                                { label: "Dashboard Perawat" },
                            ]}
                        />
                    </div>

                    <div suppressHydrationWarning>
                        <DashboardHeader
                            title="Dashboard Perawat"
                            userName={nurseName}
                            greeting="Selamat Datang"
                        />
                    </div>

                    <NurseSummaryCards
                        totalPatients={visits.length}
                        waitingTTV={visits.filter(v => v.ttv_status === 'belum').length}
                        completedTTV={visits.filter(v => v.ttv_status === 'selesai').length}
                    />

                    <div className="mt-8 mb-4 max-w-xs">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Cari No. Reg, NRM, atau Nama Pasien"
                        />
                    </div>


                    <NurseVisitsTable
                        visits={filteredVisits}
                        loading={loading}
                        searchQuery={searchQuery}
                        nurseId={nurseId}
                        onPickPatient={handlePickPatient}
                        onResumeTTV={handleResumeTTV}
                        onCancelTTV={handleCancelTTV}
                        onViewDetail={handleViewDetail}
                    />

                </div>

                <TTVModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedVisit(null);
                    }}
                    selectedVisit={selectedVisit}
                    onSubmit={handleTTVSubmit}
                />

                <TTVDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => {
                        setDetailModalOpen(false);
                        setDetailVisit(null);
                    }}
                    visit={detailVisit}
                />
            </div>
        </NurseLayout>
    );
}
