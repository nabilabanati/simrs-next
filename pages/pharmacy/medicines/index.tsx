'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PharmacyLayout from '@/components/layout/PharmacyLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Pill, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Medicine {
    id: string;
    kode: string;
    nama: string;
    harga: number;
    total_stock: number;
    is_low_stock: boolean;
}

export default function MedicineList() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchMedicines = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) {
            setRefreshing(true);
        }

        try {
            const response = await fetch('/api/pharmacy/stock');
            const data = await response.json();

            if (response.ok) {
                setMedicines(data.medicines || []);
                setFilteredMedicines(data.medicines || []);
            } else {
                toast.error('Gagal memuat data obat');
            }
        } catch (error) {
            console.error('Error fetching medicines:', error);
            toast.error('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = medicines.filter(
                (m) =>
                    m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.kode.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredMedicines(filtered);
        } else {
            setFilteredMedicines(medicines);
        }
    }, [searchQuery, medicines]);

    return (
        <PharmacyLayout>
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Master Data Obat</h1>
                            <p className="text-gray-600 mt-1">Kelola data obat</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => fetchMedicines(true)}
                                disabled={refreshing}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => router.push('/pharmacy/medicines/add')}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Obat
                            </Button>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Pill className="w-5 h-5" />
                                Daftar Obat
                            </CardTitle>
                            <Input
                                placeholder="Cari obat..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-xs"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : filteredMedicines.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {searchQuery ? 'Tidak ada obat yang cocok' : 'Tidak ada data obat'}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Obat</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Stok</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMedicines.map((medicine) => (
                                        <TableRow key={medicine.id}>
                                            <TableCell className="font-medium">{medicine.kode}</TableCell>
                                            <TableCell>{medicine.nama}</TableCell>
                                            <TableCell>Rp {medicine.harga.toLocaleString('id-ID')}</TableCell>
                                            <TableCell>
                                                <span className={medicine.is_low_stock ? 'text-red-600 font-bold' : ''}>
                                                    {medicine.total_stock}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PharmacyLayout>
    );
}
