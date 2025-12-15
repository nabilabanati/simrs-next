'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Pill, Eye, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Prescription {
    id: string;
    no_order: string;
    status: string;
    created_at: string;
    visit: {
        no_reg: string;
        patient: {
            nrm: string;
            nama: string;
        };
    };
    created_by_user: {
        nama: string;
    };
    prescription_items: any[];
}

export default function PharmacyDashboard() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch prescriptions
    const fetchPrescriptions = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setRefreshing(true);
        }

        try {
            const response = await fetch(`/api/pharmacy/prescriptions?status=${statusFilter}`);
            const data = await response.json();

            if (response.ok) {
                setPrescriptions(data.prescriptions || []);
            } else {
                toast.error('Gagal memuat data resep');
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }

        fetchPrescriptions();
    }, [statusFilter, router]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPrescriptions(false); // Silent refresh
        }, 10000);

        return () => clearInterval(interval);
    }, [statusFilter]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string; className: string }> = {
            'pending': { variant: 'secondary', label: 'Menunggu', className: 'bg-yellow-500 hover:bg-yellow-600' },
            'ready': { variant: 'default', label: 'Siap', className: 'bg-blue-500 hover:bg-blue-600' },
            'dispensed': { variant: 'outline', label: 'Selesai', className: 'bg-green-500 hover:bg-green-600' },
        };

        const config = variants[status] || { variant: 'secondary', label: status, className: '' };

        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    // Calculate statistics
    const totalPrescriptions = prescriptions.length;
    const pendingCount = prescriptions.filter(p => p.status === 'pending').length;
    const readyCount = prescriptions.filter(p => p.status === 'ready').length;
    const dispensedCount = prescriptions.filter(p => p.status === 'dispensed').length;

    return (
        <PharmacyLayout>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard Farmasi</h1>
                            <p className="text-gray-600 mt-1">Manajemen Resep & Stok Obat</p>
                        </div>
                        <Button
                            onClick={() => fetchPrescriptions(true)}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">Total Resep</p>
                            <p className="text-3xl font-bold text-blue-600">{totalPrescriptions}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">Menunggu</p>
                            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">Siap Diambil</p>
                            <p className="text-3xl font-bold text-blue-600">{readyCount}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-600">Selesai</p>
                            <p className="text-3xl font-bold text-green-600">{dispensedCount}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Prescription List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Pill className="w-5 h-5" />
                                Daftar Resep
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="pending">Menunggu</SelectItem>
                                        <SelectItem value="ready">Siap</SelectItem>
                                        <SelectItem value="dispensed">Selesai</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : prescriptions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Tidak ada resep
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No. Order</TableHead>
                                        <TableHead>No. Reg</TableHead>
                                        <TableHead>Nama Pasien</TableHead>
                                        <TableHead>Dokter</TableHead>
                                        <TableHead>Jumlah Item</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prescriptions.map((prescription) => (
                                        <TableRow key={prescription.id}>
                                            <TableCell className="font-medium">{prescription.no_order}</TableCell>
                                            <TableCell>{prescription.visit?.no_reg || '-'}</TableCell>
                                            <TableCell>{prescription.visit?.patient?.nama || '-'}</TableCell>
                                            <TableCell>{prescription.created_by_user?.nama || '-'}</TableCell>
                                            <TableCell>{prescription.prescription_items?.length || 0} item</TableCell>
                                            <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                                            <TableCell>
                                                {new Date(prescription.created_at).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    onClick={() => router.push(`/pharmacy/prescriptions/${prescription.id}`)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Detail
                                                </Button>
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
                    Auto-refresh setiap 10 detik
                </div>
            </div>
        </PharmacyLayout>
    );
}
