'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Eye, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PatientsListPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPatients(data || []);
            setFilteredData(data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
            toast.error('Gagal memuat data pasien');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!searchInput.trim()) {
            setFilteredData(patients);
            return;
        }

        const search = searchInput.toLowerCase().trim();
        const filtered = patients.filter((patient) =>
            patient.nrm?.toLowerCase().includes(search) ||
            patient.nama?.toLowerCase().includes(search) ||
            patient.nik?.toLowerCase().includes(search)
        );
        setFilteredData(filtered);
    };

    const handleReset = () => {
        setSearchInput('');
        setFilteredData(patients);
    };

    const exportToCSV = () => {
        const headers = ['NRM', 'NIK', 'Nama', 'Jenis Kelamin', 'Tanggal Lahir', 'Alamat'];
        const rows = filteredData.map((patient) => [
            patient.nrm,
            patient.nik,
            patient.nama,
            patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
            patient.tanggal_lahir,
            patient.alamat,
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pasien_${new Date().getTime()}.csv`;
        link.click();
    };

    const exportToExcel = () => {
        const headers = ['NRM', 'NIK', 'Nama', 'Jenis Kelamin', 'Tanggal Lahir', 'Alamat'];
        const rows = filteredData.map((patient) => [
            patient.nrm,
            patient.nik,
            patient.nama,
            patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
            patient.tanggal_lahir,
            patient.alamat,
        ]);

        let html = '<table border="1"><tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr>';

        rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell || ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</table>';

        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pasien_${new Date().getTime()}.xls`;
        link.click();
    };

    return (
        <CounterLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Data Pasien</h1>
                        <p className="text-gray-600 mt-1">Kelola data pasien rumah sakit</p>
                    </div>
                    <Button
                        onClick={() => router.push('/counter/patients/create')}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Pasien
                    </Button>
                </div>

                {/* Search & Export */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cari Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari berdasarkan NRM, Nama, atau NIK..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700">
                                Cari
                            </Button>
                            <Button onClick={handleReset} variant="outline">
                                Reset
                            </Button>
                            <div className="flex gap-2">
                                <Button onClick={exportToCSV} variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-1" />
                                    CSV
                                </Button>
                                <Button onClick={exportToExcel} variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-1" />
                                    Excel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Patient Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader className="bg-purple-50">
                                    <TableRow>
                                        <TableHead className="font-bold">NO</TableHead>
                                        <TableHead className="font-bold">NRM</TableHead>
                                        <TableHead className="font-bold">NIK</TableHead>
                                        <TableHead className="font-bold">NAMA</TableHead>
                                        <TableHead className="font-bold">JENIS KELAMIN</TableHead>
                                        <TableHead className="font-bold">TGL LAHIR</TableHead>
                                        <TableHead className="font-bold">ALAMAT</TableHead>
                                        <TableHead className="font-bold">AKSI</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                Tidak ada data pasien
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((patient, idx) => (
                                            <TableRow key={patient.id}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell className="font-medium">{patient.nrm}</TableCell>
                                                <TableCell>{patient.nik}</TableCell>
                                                <TableCell>{patient.nama}</TableCell>
                                                <TableCell>
                                                    {patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {patient.alamat || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/counter/patients/detail/${patient.id}`)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/counter/patients/edit/${patient.id}`)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Summary */}
                        {filteredData.length > 0 && (
                            <div className="mt-4 text-sm text-gray-600">
                                Menampilkan {filteredData.length} dari {patients.length} pasien
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </CounterLayout>
    );
}
