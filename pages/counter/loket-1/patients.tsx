'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoketLayout } from '@/components/layout/LoketLayout';
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
    const loketId = 1;
    
    const [patients, setPatients] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');

    // Filters
    const [filterGender, setFilterGender] = useState('');
    const [filterPenjamin, setFilterPenjamin] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchPatients();
    }, [currentPage, itemsPerPage]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            // Get total count
            const { count } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true });

            setTotalCount(count || 0);

            // Fetch paginated data
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, error } = await supabase
                .from('patients')
                .select(`
                    *,
                    patient_penjamin(
                        nomor_bpjs,
                        nomor_polis,
                        nama_asuransi,
                        penjamin:penjamin_id(
                            nama,
                            tipe
                        )
                    )
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            console.log('📊 Fetched patients:', data);
            console.log('❌ Error:', error);

            if (error) {
                console.error('🔴 Supabase error:', error);
                // If join fails, try simple query
                const { data: simpleData, error: simpleError } = await supabase
                    .from('patients')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(from, to);
                
                if (simpleError) throw simpleError;
                const fetchedData = simpleData || [];
                console.log('✅ Setting', fetchedData.length, 'patients (simple query)');
                setPatients(fetchedData);
                setFilteredData(fetchedData);
                return;
            }
            
            const fetchedData = data || [];
            console.log('✅ Setting', fetchedData.length, 'patients to state');
            setPatients(fetchedData);
            setFilteredData(fetchedData);
        } catch (error) {
            console.error('Error fetching patients:', error);
            toast.error('Gagal memuat data pasien');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (data: any[] = patients) => {
        let filtered = [...data];

        // Search filter
        if (searchInput.trim()) {
            const search = searchInput.toLowerCase().trim();
            filtered = filtered.filter((patient) =>
                patient.nrm?.toLowerCase().includes(search) ||
                patient.nama?.toLowerCase().includes(search) ||
                patient.nik?.toLowerCase().includes(search)
            );
        }

        // Gender filter
        if (filterGender) {
            filtered = filtered.filter((patient) => patient.jenis_kelamin === filterGender);
        }

        // Penjamin filter
        if (filterPenjamin && filterPenjamin !== '') {
            filtered = filtered.filter((patient) => {
                // Get penjamin from relation
                const penjaminNama = patient.patient_penjamin?.[0]?.penjamin?.nama_penjamin;
                if (penjaminNama) {
                    return penjaminNama === filterPenjamin;
                }
                // Fallback to direct field
                return (patient.penjamin || 'UMUM') === filterPenjamin;
            });
        }

        // Date filter
        if (filterDateFrom) {
            filtered = filtered.filter((patient) => {
                const createdDate = new Date(patient.created_at);
                return createdDate >= new Date(filterDateFrom);
            });
        }
        if (filterDateTo) {
            filtered = filtered.filter((patient) => {
                const createdDate = new Date(patient.created_at);
                return createdDate <= new Date(filterDateTo + 'T23:59:59');
            });
        }

        setFilteredData(filtered);
    };

    const handleSearch = () => {
        applyFilters();
    };

    const handleReset = () => {
        setSearchInput('');
        setFilterGender('');
        setFilterPenjamin('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilteredData(patients);
    };

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age + ' th';
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

    // Fetch region names for a patient
    const fetchRegionNamesForPrint = async (patient: any) => {
        const regionNames = {
            province: '',
            regency: '',
            district: '',
            village: ''
        };

        try {
            const fetchRegionName = async (url: string) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) return '';
                    const data = await response.json();
                    return data.name || '';
                } catch (error) {
                    return '';
                }
            };

            const promises = [];
            
            if (patient.province_id) {
                promises.push(fetchRegionName(`https://www.emsifa.com/api-wilayah-indonesia/api/province/${patient.province_id}.json`));
            } else {
                promises.push(Promise.resolve(''));
            }

            if (patient.regency_id) {
                promises.push(fetchRegionName(`https://www.emsifa.com/api-wilayah-indonesia/api/regency/${patient.regency_id}.json`));
            } else {
                promises.push(Promise.resolve(''));
            }

            if (patient.district_id) {
                promises.push(fetchRegionName(`https://www.emsifa.com/api-wilayah-indonesia/api/district/${patient.district_id}.json`));
            } else {
                promises.push(Promise.resolve(''));
            }

            if (patient.village_id) {
                promises.push(fetchRegionName(`https://www.emsifa.com/api-wilayah-indonesia/api/village/${patient.village_id}.json`));
            } else {
                promises.push(Promise.resolve(''));
            }

            const [province, regency, district, village] = await Promise.all(promises);
            
            regionNames.province = province;
            regionNames.regency = regency;
            regionNames.district = district;
            regionNames.village = village;
        } catch (error) {
            console.error('Error fetching region names:', error);
        }

        return regionNames;
    };

    // Build full address with region names
    const buildFullAddress = (patient: any, regionNames: any) => {
        const parts = [];
        if (patient.alamat) parts.push(patient.alamat);
        if (regionNames.village) parts.push(`Desa ${regionNames.village}`);
        if (regionNames.district) parts.push(`Kecamatan ${regionNames.district}`);
        if (regionNames.regency) parts.push(regionNames.regency);
        if (regionNames.province) parts.push(regionNames.province);
        if (patient.kode_pos) parts.push(patient.kode_pos);
        return parts.length > 0 ? parts.join(', ') : '-';
    };

    const renderContent = () => (
        <div className="space-y-6">
            {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/counter/loket-1')}
                            className="flex items-center gap-2"
                        >
                            ← Kembali ke Loket 1
                        </Button>
                        <h1 className="text-2xl font-bold text-blue-600 uppercase">Data Pasien</h1>
                    </div>
                    <Button
                        onClick={() => router.push('/counter/loket-1/patients/create')}
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
                        <div className="space-y-4">
                            {/* Search */}
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
                                <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700 text-white">
                                    Cari
                                </Button>
                                <Button onClick={handleReset} className="bg-red-500 hover:bg-red-600 text-white">
                                    Reset
                                </Button>
                                <Button onClick={exportToExcel} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Download className="w-4 h-4 mr-1" />
                                    Excel
                                </Button>
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="w-full">
                                    <label className="block text-sm font-medium mb-2">JENIS KELAMIN</label>
                                    <select
                                        value={filterGender}
                                        onChange={(e) => { setFilterGender(e.target.value); setTimeout(() => applyFilters(), 0); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Semua</option>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                                <div className="w-full">
                                    <label className="block text-sm font-medium mb-2">CARA BAYAR</label>
                                    <select
                                        value={filterPenjamin}
                                        onChange={(e) => { setFilterPenjamin(e.target.value); setTimeout(() => applyFilters(), 0); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Semua</option>
                                        <option value="UMUM">UMUM</option>
                                        <option value="BPJS">BPJS</option>
                                        <option value="Asuransi">Asuransi</option>
                                        <option value="Instansi">Instansi</option>
                                        <option value="Jasa Raharja">Jasa Raharja</option>
                                    </select>
                                </div>
                                <div className="w-full">
                                    <label className="block text-sm font-medium mb-2">TANGGAL REGISTRASI</label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="date"
                                            value={filterDateFrom}
                                            onChange={(e) => { setFilterDateFrom(e.target.value); setTimeout(() => applyFilters(), 0); }}
                                            className="w-full bg-white"
                                        />
                                        <span className="text-sm text-gray-600">s.d.</span>
                                        <Input
                                            type="date"
                                            value={filterDateTo}
                                            onChange={(e) => { setFilterDateTo(e.target.value); setTimeout(() => applyFilters(), 0); }}
                                            className="w-full bg-white"
                                        />
                                    </div>
                                </div>
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
                                <TableHeader className="bg-blue-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NRM</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NAMA</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NIK</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase text-center">JK</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase text-center">UMUR</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO. TELP</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">PENJAMIN</TableHead>
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
                                                <TableCell className="px-6 py-4 text-center">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                                                <TableCell className="px-6 py-4 font-medium">{patient.nrm}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nama}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nik}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {patient.jenis_kelamin === 'L' ? 'L' : 'P'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {calculateAge(patient.tanggal_lahir)}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {patient.no_telp || patient.no_telp_pj || '-'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {patient.patient_penjamin?.[0]?.penjamin?.nama || patient.penjamin || 'UMUM'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/counter/patients/detail/${patient.id}`)}
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="text-green-600 hover:text-green-700 w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/counter/patients/edit/${patient.id}`)}
                                                            title="Edit"
                                                        >
                                                            <Pencil className="text-yellow-600 hover:text-yellow-700 w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-blue-600 hover:text-blue-700"
                                                            onClick={async () => {
                                                                // Fetch region names first
                                                                const regionNames = await fetchRegionNamesForPrint(patient);
                                                                const fullAddress = buildFullAddress(patient, regionNames);
                                                                
                                                                const printWindow = window.open('', '', 'width=800,height=600');
                                                                if (printWindow) {
                                                                    printWindow.document.write(`
                                                                        <html>
                                                                        <head>
                                                                            <title>Kartu Identitas Pasien - ${patient.nrm}</title>
                                                                            <style>
                                                                                @page { margin: 1cm; }
                                                                                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                                                                                .container { max-width: 800px; margin: 0 auto; }
                                                                                .header { text-center: center; border-bottom: 2px solid #1f2937; padding-bottom: 15px; margin-bottom: 30px; }
                                                                                .header h1 { color: #1f2937; margin: 0; font-size: 24px; font-weight: bold; }
                                                                                .header p { margin: 5px 0 0 0; font-size: 12px; color: #6b7280; }
                                                                                .title { text-align: center; margin-bottom: 30px; }
                                                                                .title h2 { font-size: 20px; font-weight: bold; text-decoration: underline; margin: 0; }
                                                                                .title p { font-size: 12px; color: #6b7280; margin-top: 10px; }
                                                                                .section { margin-bottom: 25px; }
                                                                                .section-title { font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; font-size: 14px; }
                                                                                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 30px; }
                                                                                .field { display: flex; font-size: 13px; margin-bottom: 8px; }
                                                                                .field .label { width: 160px; font-weight: 500; }
                                                                                .field .colon { margin: 0 8px; }
                                                                                .field .value { flex: 1; font-weight: 600; }
                                                                                .full-width { grid-column: 1 / -1; }
                                                                                .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #d1d5db; font-size: 10px; color: #9ca3af; font-style: italic; }
                                                                            </style>
                                                                        </head>
                                                                        <body>
                                                                            <div class="container">
                                                                                <div class="header">
                                                                                    <h1>LAYANAN KESEHATAN</h1>
                                                                                    <p>Jl.  No. 123, Kota , Provinsi</p>
                                                                                    <p>Telp: (021) 1234-5678 | Email: info@layanankesehatan.com</p>
                                                                                </div>
                                                                                
                                                                                <div class="title">
                                                                                    <h2>KARTU IDENTITAS PASIEN</h2>
                                                                                </div>

                                                                                <div class="section">
                                                                                    <div class="section-title">DATA PASIEN</div>
                                                                                    <div class="grid">
                                                                                        <div class="field">
                                                                                            <span class="label">No. Rekam Medis</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.nrm}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Jenis Kelamin</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">NIK</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.nik || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Pekerjaan</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.pekerjaan || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Nama Pasien</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.nama.toUpperCase()}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Golongan Darah</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.golongan_darah || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Tanggal Lahir</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.tanggal_lahir ? new Date(patient.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">No. Telepon</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.no_telp || patient.no_telp_pj || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Umur</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${calculateAge(patient.tanggal_lahir)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="field full-width" style="margin-top: 10px;">
                                                                                        <span class="label">Alamat</span>
                                                                                        <span class="colon">:</span>
                                                                                        <span class="value">${fullAddress}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div class="section">
                                                                                    <div class="section-title">PENANGGUNG JAWAB</div>
                                                                                    <div class="grid">
                                                                                        <div class="field">
                                                                                            <span class="label">Nama PJ</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.nama_pj || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">No. Telepon PJ</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.no_telp_pj || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Hubungan</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.penanggung_jawab || '-'}</span>
                                                                                        </div>
                                                                                        <div class="field">
                                                                                            <span class="label">Pekerjaan PJ</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.pekerjaan_pj || '-'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div class="section">
                                                                                    <div class="section-title">INFORMASI PENJAMIN</div>
                                                                                    <div class="field">
                                                                                        <span class="label">Jenis Penjamin</span>
                                                                                        <span class="colon">:</span>
                                                                                        <span class="value">${patient.patient_penjamin?.[0]?.penjamin?.nama || patient.penjamin || 'UMUM'}</span>
                                                                                    </div>
                                                                                    ${patient.patient_penjamin?.[0]?.penjamin?.tipe?.toLowerCase() === 'bpjs' && patient.patient_penjamin?.[0]?.nomor_bpjs ? `
                                                                                    <div class="field">
                                                                                        <span class="label">No. BPJS</span>
                                                                                        <span class="colon">:</span>
                                                                                        <span class="value">${patient.patient_penjamin[0].nomor_bpjs}</span>
                                                                                    </div>
                                                                                    ` : ''}
                                                                                    ${patient.patient_penjamin?.[0]?.penjamin?.tipe?.toLowerCase() === 'asuransi' ? `
                                                                                        ${patient.patient_penjamin[0]?.nama_asuransi ? `
                                                                                        <div class="field">
                                                                                            <span class="label">Nama Asuransi</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.patient_penjamin[0].nama_asuransi}</span>
                                                                                        </div>
                                                                                        ` : ''}
                                                                                        ${patient.patient_penjamin[0]?.nomor_polis ? `
                                                                                        <div class="field">
                                                                                            <span class="label">No. Polis</span>
                                                                                            <span class="colon">:</span>
                                                                                            <span class="value">${patient.patient_penjamin[0].nomor_polis}</span>
                                                                                        </div>
                                                                                        ` : ''}
                                                                                    ` : ''}
                                                                                </div>

                                                                                <div class="footer">
                                                                                    Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah
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

                        {/* Summary & Pagination */}
                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-gray-700">
                                Menampilkan <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length === patients.length ? totalCount : filteredData.length)}</span> dari <span className="font-medium">{filteredData.length === patients.length ? totalCount : filteredData.length}</span> data
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-700">Tampilkan:</label>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                  
                                <div className="flex gap-1">
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Previous
                                    </Button>
                                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                                        Page {currentPage} of {Math.ceil((filteredData.length === patients.length ? totalCount : filteredData.length) / itemsPerPage) || 1}
                                    </span>
                                    <Button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil((filteredData.length === patients.length ? totalCount : filteredData.length) / itemsPerPage)))}
                                        disabled={currentPage >= Math.ceil((filteredData.length === patients.length ? totalCount : filteredData.length) / itemsPerPage)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
    );

    return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;
}
