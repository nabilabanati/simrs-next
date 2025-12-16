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
import { Plus, Search, Download, Eye, Pencil, Printer } from 'lucide-react';
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
                    <h1 className="text-2xl font-bold text-blue-600 uppercase">Data Pasien</h1>
                    <Button
                        onClick={() => router.push('/counter/patients/create')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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
                            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
                                Cari
                            </Button>
                            <Button onClick={handleReset} variant="outline">
                                Reset
                            </Button>
                            <Button onClick={exportToExcel} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Excel
                            </Button>
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
                                <TableHeader className="bg-blue-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NRM</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NIK</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NAMA</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">JENIS KELAMIN</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">TGL LAHIR</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">ALAMAT</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase text-center">AKSI</TableHead>
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
                                                <TableCell className="px-6 py-4 text-center">{idx + 1}</TableCell>
                                                <TableCell className="px-6 py-4 font-medium">{patient.nrm}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nik}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nama}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {patient.jenis_kelamin === 'L' ? 'L' : 'P'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 max-w-xs truncate">
                                                    {patient.alamat || '-'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/counter/patients/detail/${patient.id}`)}
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/counter/patients/edit/${patient.id}`)}
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            onClick={() => {
                                                                const printWindow = window.open('', '', 'width=800,height=600');
                                                                if (printWindow) {
                                                                    printWindow.document.write(`
                                                                        <html>
                                                                        <head>
                                                                            <title>Identitas Pasien - ${patient.nrm}</title>
                                                                            <style>
                                                                                @page { size: A6 landscape; margin: 5mm; }
                                                                                body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
                                                                                .card { border: 4px solid #2563eb; border-radius: 8px; padding: 15px; max-width: 148mm; height: auto; }
                                                                                .header { text-align: center; border-bottom: 4px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
                                                                                .header h1 { color: #2563eb; margin: 0; font-size: 20px; text-transform: uppercase; }
                                                                                .header p { margin: 3px 0 0 0; font-size: 11px; color: #666; }
                                                                                .content { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                                                                                .section { margin-bottom: 10px; }
                                                                                .section-title { font-size: 11px; color: #2563eb; font-weight: bold; border-bottom: 2px solid #2563eb; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase; }
                                                                                .field { margin-bottom: 6px; }
                                                                                .field label { font-size: 9px; color: #666; text-transform: uppercase; display: block; margin-bottom: 1px; }
                                                                                .field p { font-size: 11px; font-weight: bold; margin: 0; }
                                                                                .nrm { font-size: 20px; color: #2563eb; }
                                                                                .full-width { grid-column: 1 / -1; }
                                                                                .footer { text-align: center; margin-top: 10px; padding-top: 8px; border-top: 2px solid #2563eb; font-size: 9px; color: #999; }
                                                                            </style>
                                                                        </head>
                                                                        <body>
                                                                            <div class="card">
                                                                                <div class="header">
                                                                                    <h1>Kartu Identitas Pasien</h1>
                                                                                    <p>Rumah Sakit</p>
                                                                                </div>
                                                                                <div class="content">
                                                                                    <!-- Left Column -->
                                                                                    <div>
                                                                                        <div class="section">
                                                                                            <div class="section-title">Data Pribadi</div>
                                                                                            <div class="field">
                                                                                                <label>No. Rekam Medis</label>
                                                                                                <p class="nrm">${patient.nrm}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>NIK</label>
                                                                                                <p>${patient.nik || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Nama Lengkap</label>
                                                                                                <p>${patient.nama.toUpperCase()}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Jenis Kelamin</label>
                                                                                                <p>${patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Tempat, Tanggal Lahir</label>
                                                                                                <p>${patient.tempat_lahir || '-'}, ${patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Golongan Darah</label>
                                                                                                <p>${patient.golongan_darah || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Pekerjaan</label>
                                                                                                <p>${patient.pekerjaan || '-'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <!-- Right Column -->
                                                                                    <div>
                                                                                        <div class="section">
                                                                                            <div class="section-title">Kontak & Alamat</div>
                                                                                            <div class="field">
                                                                                                <label>No. Telepon</label>
                                                                                                <p>${patient.no_hp || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Email</label>
                                                                                                <p>${patient.email || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Alamat</label>
                                                                                                <p>${patient.alamat || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Kode Pos</label>
                                                                                                <p>${patient.kode_pos || '-'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        
                                                                                        <div class="section">
                                                                                            <div class="section-title">Penanggung Jawab</div>
                                                                                            <div class="field">
                                                                                                <label>Nama</label>
                                                                                                <p>${patient.nama_pj || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>Hubungan</label>
                                                                                                <p>${patient.penanggung_jawab || '-'}</p>
                                                                                            </div>
                                                                                            <div class="field">
                                                                                                <label>No. Telepon PJ</label>
                                                                                                <p>${patient.no_hp_pj || '-'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div class="footer">
                                                                                    Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                                                                </div>
                                                                            </div>
                                                                        </body>
                                                                        </html>
                                                                    `);
                                                                    printWindow.document.close();
                                                                    printWindow.print();
                                                                }
                                                            }}
                                                            title="Print Identitas"
                                                        >
                                                            <Printer className="w-4 h-4" />
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
