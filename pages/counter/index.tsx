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
import {
    RotateCcw,
    Volume2,
    SkipForward,
    Plus,
    Eye,
    MoreVertical,
    Download,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchClinics, fetchAllDoctors, fetchPaymentMethods } from '@/lib/api-client';
import type { Clinic } from '@/pages/api/clinics';
import type { Doctor } from '@/pages/api/doctors';
import type { PaymentMethod } from '@/pages/api/payment-methods';
import AddVisitModal from '@/components/modals/add-visit-modal';

export default function CounterPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQueue, setCurrentQueue] = useState(1);
    const [currentCounter, setCurrentCounter] = useState(1);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    // Filter states
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [filterClinic, setFilterClinic] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // API data states
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Load API data and patients on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [clinicsData, doctorsData, paymentsData] = await Promise.all([
                    fetchClinics(),
                    fetchAllDoctors(),
                    fetchPaymentMethods(),
                ]);
                setClinics(clinicsData);
                setDoctors(doctorsData);
                setPaymentMethods(paymentsData);
                await fetchPatients();
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    // Fetch patients from database
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
        } finally {
            setLoading(false);
        }
    };

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('div[class*="relative"]')) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Apply filters
    const applyFilter = () => {
        let filtered = patients.filter((patient) => {
            let matches = true;

            // Date range filter
            if (dateFrom || dateTo) {
                const patientDate = new Date(patient.created_at);

                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    if (patientDate < fromDate) matches = false;
                }

                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (patientDate > toDate) matches = false;
                }
            }

            // Search filter
            if (searchInput) {
                const search = searchInput.toLowerCase().trim();
                const searchMatch =
                    patient.nrm?.toLowerCase().includes(search) ||
                    patient.nama?.toLowerCase().includes(search) ||
                    patient.nik?.toLowerCase().includes(search);
                if (!searchMatch) matches = false;
            }

            return matches;
        });

        setFilteredData(filtered);
    };

    // Reset filters
    const resetFilter = () => {
        setDateFrom('');
        setDateTo('');
        setFilterPayment('');
        setFilterClinic('');
        setFilterDoctor('');
        setSearchInput('');
        setFilteredData(patients);
    };

    // Export functions
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
        link.download = `pasien_counter_${new Date().getTime()}.csv`;
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
        link.download = `pasien_counter_${new Date().getTime()}.xls`;
        link.click();
    };

    // Queue functions
    const handleCallNext = () => {
        if (currentQueue >= 50) {
            alert('Antrian sudah mencapai batas maksimal hari ini.');
            return;
        }
        const nextQueue = currentQueue + 1;
        setCurrentQueue(nextQueue);
        announceQueue(nextQueue);
        broadcastQueueUpdate(nextQueue);
    };

    const handleRepeatCall = () => {
        if (currentQueue < 1) {
            alert('Belum ada antrian yang dipanggil.');
            return;
        }
        announceQueue(currentQueue);
        broadcastQueueUpdate(currentQueue);
    };

    const handleResetQueue = () => {
        if (confirm('Yakin ingin reset antrian? Semua data antrian akan dikembalikan ke awal.')) {
            setCurrentQueue(1);
            broadcastQueueUpdate(1);
            alert('Antrian telah direset ke nomor 001.');
        }
    };

    const announceQueue = (queueNum: number) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const queueInIndonesian = numberToIndonesian(queueNum);
            const counterInIndonesian = numberToIndonesian(currentCounter);
            const speech = new SpeechSynthesisUtterance(
                `Nomor antrian ${queueInIndonesian}, silakan menuju counter ${counterInIndonesian}`
            );
            speech.lang = 'id-ID';
            speech.rate = 0.7;
            window.speechSynthesis.speak(speech);
        }
    };

    const numberToIndonesian = (num: number): string => {
        const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
        const teens = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
        const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

        if (num === 0) return 'nol';
        if (num < 10) return units[num];
        if (num === 10) return 'sepuluh';
        if (num === 11) return 'sebelas';
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const unit = num % 10;
            return tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
        }
        return String(num);
    };

    const broadcastQueueUpdate = (queueNum: number) => {
        const updateData = {
            currentNumber: queueNum,
            counter: currentCounter,
            timestamp: Date.now(),
        };

        // Broadcast via localStorage
        localStorage.setItem('counterQueueUpdate', JSON.stringify(updateData));

        // Dispatch custom event for real-time update
        window.dispatchEvent(
            new CustomEvent('queueUpdate', {
                detail: updateData,
            })
        );
    };

    const handleAddVisit = (patient: any) => {
        setSelectedPatient(patient);
        setShowAddModal(true);
    };

    const handleSaveVisit = () => {
        setShowAddModal(false);
        alert('Kunjungan berhasil ditambahkan!');
    };

    const timeString = currentTime.toLocaleTimeString('id-ID', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const dateString = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const getActionBadgeClass = (action: string) => {
        switch (action) {
            case 'Pulang':
                return 'bg-blue-100 text-blue-800';
            case 'Pindah Poli':
                return 'bg-yellow-100 text-yellow-800';
            case 'Rawat Inap':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <CounterLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-lg rounded-lg mb-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Counter {currentCounter}</h1>
                            <p className="text-purple-200 text-sm mt-1">Sistem Manajemen Antrian</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{timeString}</div>
                            <div className="text-sm text-purple-200">{dateString}</div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Filter Section and Queue Display */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                            {/* Filter Section */}
                            <div className="xl:col-span-2 bg-purple-50 p-6 rounded-lg border border-purple-200">
                                <h2 className="text-lg font-bold text-purple-600 mb-6">FILTER DATA PASIEN</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {/* Date Range */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">TANGGAL REGISTRASI</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-gray-600 font-medium">s.d.</span>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Filter */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">CARA BAYAR</label>
                                        <select
                                            value={filterPayment}
                                            onChange={(e) => setFilterPayment(e.target.value)}
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Semua</option>
                                            {paymentMethods.map((pm) => (
                                                <option key={pm.id} value={pm.name}>{pm.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Clinic Filter */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">POLIKLINIK</label>
                                        <select
                                            value={filterClinic}
                                            onChange={(e) => setFilterClinic(e.target.value)}
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Semua</option>
                                            {clinics.map((c) => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Doctor Filter */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">DOKTER</label>
                                        <select
                                            value={filterDoctor}
                                            onChange={(e) => setFilterDoctor(e.target.value)}
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Semua</option>
                                            {doctors.map((d) => (
                                                <option key={d.id} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Search and Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Ketik NRM, Nama Pasien, atau NIK"
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={applyFilter}
                                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                                        >
                                            Cari
                                        </Button>
                                        <Button
                                            onClick={resetFilter}
                                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                                        >
                                            Reset
                                        </Button>
                                        <Button
                                            onClick={exportToCSV}
                                            variant="outline"
                                            className="px-4 py-2 text-sm"
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            CSV
                                        </Button>
                                        <Button
                                            onClick={exportToExcel}
                                            variant="outline"
                                            className="px-4 py-2 text-sm"
                                        >
                                            <Download className="w-4 h-4 mr-1" />
                                            Excel
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Queue Display */}
                            <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg flex flex-col justify-center items-center min-h-[250px]">
                                <div className="text-left mb-6 w-full">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Sisa Antrian Counter
                                        <span className="font-bold text-purple-600 ml-2">{currentCounter}</span>
                                        <span className="mx-2">:</span>
                                        <span className="font-bold text-purple-600">{50 - currentQueue}</span>
                                    </p>
                                </div>

                                <div className="text-center mb-8">
                                    <div className="text-9xl font-bold text-purple-600 tracking-wider">
                                        {String(currentQueue).padStart(3, '0')}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={handleResetQueue}
                                        className="w-24 h-14 bg-red-600 hover:bg-red-700 text-white"
                                        title="Reset Antrian"
                                    >
                                        <RotateCcw className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        onClick={handleRepeatCall}
                                        className="w-24 h-14 bg-purple-600 hover:bg-purple-700 text-white"
                                        title="Panggil Antrian"
                                    >
                                        <Volume2 className="w-6 h-6" />
                                    </Button>
                                    <Button
                                        onClick={handleCallNext}
                                        className="w-24 h-14 bg-green-600 hover:bg-green-700 text-white"
                                        title="Antrian Selanjutnya"
                                    >
                                        <SkipForward className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-purple-600 uppercase">
                                DATA PASIEN
                            </h2>
                            <Button onClick={() => router.push('/pasien/create')} className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Pasien
                            </Button>
                        </div>

                        {/* Patient Table */}
                        <Card className="border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-purple-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">AKSI</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">TANGGAL</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NRM</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NAMA PASIEN</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NIK</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">J.K.</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">POLIKLINIK</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">DOKTER PJ</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">CARA BAYAR</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">TINDAK LANJUT</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-8">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                                                Tidak ada data pasien
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((patient, idx) => (
                                            <TableRow key={patient.id}>
                                                <TableCell className="px-6 py-4">
                                                    <div className="relative z-20">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === patient.id ? null : patient.id)}
                                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded inline-flex items-center"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openDropdownId === patient.id && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                                                <button
                                                                    onClick={() => {
                                                                        handleAddVisit(patient);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 border-b border-gray-100"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Tambah Kunjungan
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        router.push(`/pasien/detail?nrm=${patient.nrm}`);
                                                                        setOpenDropdownId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Lihat Detail
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">{idx + 1}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {new Date(patient.created_at).toLocaleDateString('id-ID')}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 font-medium">{patient.nrm}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nama}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nik}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {patient.jenis_kelamin === 'L' ? 'L' : 'P'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">-</TableCell>
                                                <TableCell className="px-6 py-4">-</TableCell>
                                                <TableCell className="px-6 py-4">-</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        -
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Menampilkan 1 - {filteredData.length} dari {filteredData.length} data
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Modals */}
                {showAddModal && selectedPatient && (
                    <AddVisitModal
                        patient={selectedPatient}
                        onClose={() => setShowAddModal(false)}
                        onSave={handleSaveVisit}
                    />
                )}
            </div>
        </CounterLayout>
    );
}
