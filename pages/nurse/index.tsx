'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import NurseLayout from '@/components/layout/NurseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Visit {
    id: string;
    no_reg: string;
    status: string;
    ttv_status: string;
    ttv_done: boolean;
    created_at: string;
    patient: {
        id: string;
        nrm: string;
        nama: string;
        nik: string;
        tanggal_lahir: string;
        jenis_kelamin: string;
    };
    poli: {
        id: string;
        nama: string;
    };
    triase?: {
        id: string;
        tensi: string;
        nadi: number;
        suhu: number;
        spo2: number;
        resp: number;
        catatan: string;
    };
}

export default function NurseDashboard() {
    const router = useRouter();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nurseId, setNurseId] = useState('');
    const [poliId, setPoliId] = useState('');
    const [poliName, setPoliName] = useState('');

    // Fetch nurse profile and poli
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);

        fetch(`/api/nurse/profile?user_id=${userData.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.nurse_id) {
                    setNurseId(data.nurse_id);
                }
                if (data.poli) {
                    setPoliId(data.poli.id);
                    setPoliName(data.poli.nama);
                } else {
                    toast.error('Anda belum ditugaskan ke poli manapun');
                }
            })
            .catch(err => {
                console.error('Error fetching profile:', err);
                toast.error('Gagal memuat profil perawat');
            });
    }, [router]);

    // Fetch visits
    const fetchVisits = async (showRefreshIndicator = false) => {
        if (!poliId) return;

        if (showRefreshIndicator) {
            setRefreshing(true);
        }

        try {
            const response = await fetch(`/api/nurse/visits?poli_id=${poliId}`);
            const data = await response.json();

            if (response.ok) {
                setVisits(data.visits || []);
            } else {
                toast.error('Gagal memuat data kunjungan');
            }
        } catch (error) {
            console.error('Error fetching visits:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (poliId) {
            fetchVisits();
        }
    }, [poliId]);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        if (!poliId) return;

        const interval = setInterval(() => {
            fetchVisits(false); // Silent refresh
        }, 5000);

        return () => clearInterval(interval);
    }, [poliId]);

    const handlePickPatient = async (visitId: string) => {
        if (!nurseId) {
            toast.error('Nurse ID tidak ditemukan');
            return;
        }

        try {
            const response = await fetch('/api/nurse/pick-patient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visit_id: visitId, nurse_id: nurseId }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Pasien berhasil diambil');
                router.push(`/nurse/ttv/${visitId}`);
            } else {
                toast.error(data.message || 'Gagal mengambil pasien');
                fetchVisits(true); // Refresh to show updated status
            }
        } catch (error) {
            console.error('Error picking patient:', error);
            toast.error('Terjadi kesalahan saat mengambil pasien');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            'belum': { variant: 'secondary', label: 'Belum' },
            'sedang_dikerjakan': { variant: 'default', label: 'Sedang Dikerjakan' },
            'selesai': { variant: 'outline', label: 'Selesai' },
        };

        const config = variants[status] || { variant: 'secondary', label: status };

        return (
            <Badge variant={config.variant} className={
                status === 'belum' ? 'bg-yellow-500 hover:bg-yellow-600' :
                    status === 'sedang_dikerjakan' ? 'bg-blue-500 hover:bg-blue-600' :
                        'bg-green-500 hover:bg-green-600'
            }>
                {config.label}
            </Badge>
        );
    };

    return (
        <NurseLayout>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard Perawat</h1>
                            {poliName && (
                                <p className="text-gray-600 mt-1">Poli: {poliName}</p>
                            )}
                        </div>
                        <Button
                            onClick={() => fetchVisits(true)}
                            disabled={refreshing}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">Total Pasien Hari Ini</p>
                            <p className="text-3xl font-bold text-purple-600">{visits.length}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">Menunggu TTV</p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {visits.filter(v => v.ttv_status === 'belum').length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">TTV Selesai</p>
                            <p className="text-3xl font-bold text-green-600">
                                {visits.filter(v => v.ttv_status === 'selesai').length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Daftar Pasien
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : visits.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Tidak ada pasien di poli ini
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Reg</TableHead>
                                        <TableHead>NRM</TableHead>
                                        <TableHead>Nama Pasien</TableHead>
                                        <TableHead>Jenis Kelamin</TableHead>
                                        <TableHead>Status TTV</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visits.map((visit) => (
                                        <TableRow key={visit.id}>
                                            <TableCell className="font-medium">{visit.no_reg}</TableCell>
                                            <TableCell>{visit.patient.nrm}</TableCell>
                                            <TableCell>{visit.patient.nama}</TableCell>
                                            <TableCell>
                                                {visit.patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(visit.ttv_status)}</TableCell>
                                            <TableCell>
                                                {visit.ttv_status === 'belum' && (
                                                    <Button
                                                        onClick={() => handlePickPatient(visit.id)}
                                                        size="sm"
                                                        className="bg-purple-600 hover:bg-purple-700"
                                                    >
                                                        Isi TTV
                                                    </Button>
                                                )}
                                                {visit.ttv_status === 'selesai' && visit.triase && (
                                                    <Button
                                                        onClick={() => router.push(`/nurse/ttv/${visit.id}`)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Lihat
                                                    </Button>
                                                )}
                                                {visit.ttv_status === 'sedang_dikerjakan' && (
                                                    <span className="text-sm text-gray-500 italic">
                                                        Sedang dikerjakan...
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Auto-refresh setiap 5 detik
                </div>
            </div>
        </NurseLayout>
    );
}
