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
    Download,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchPoli, fetchAllDoctors, fetchPaymentMethods } from '@/lib/api-client';
import type { Poli, Doctor, PaymentMethod } from '@/lib/api-client';
import AddVisitModal from '@/components/modals/add-visit-modal';
import PatientSearchModal from '@/components/modals/patient-search-modal';
import QueueTicketModal from '@/components/modals/queue-ticket-modal';

export default function CounterPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQueue, setCurrentQueue] = useState(1);
    const [selectedLoket, setSelectedLoket] = useState(1); // Loket selector (1-5)
    const [currentCounter, setCurrentCounter] = useState(1); // Synced with loket
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    // Queue states
    const [waitingCount, setWaitingCount] = useState(0); // Waiting tickets for selected loket

    // Filter states
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [filterClinic, setFilterClinic] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // API data states
    const [polis, setPolis] = useState<Poli[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // Modal states
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [showQueueTicket, setShowQueueTicket] = useState(false);
    const [queueTicketData, setQueueTicketData] = useState<any>(null);

    // Load API data and patients on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [polisData, doctorsData, paymentsData] = await Promise.all([
                    fetchPoli(),
                    fetchAllDoctors(),
                    fetchPaymentMethods(),
                ]);
                setPolis(polisData);
                setDoctors(doctorsData);
                setPaymentMethods(paymentsData);
                await fetchTodayVisits();
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    // Fetch today's visits from database with related data
    const fetchTodayVisits = async () => {
        setLoading(true);
        try {
            // Get today's date at midnight
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            const { data, error } = await supabase
                .from('visits')
                .select(`
                    *,
                    patients!inner(id, nrm, nama, jenis_kelamin, created_at),
                    poli(id, nama),
                    doctors(id, user_id),
                    payment_methods:penjamin_id(id, nama)
                `)
                .gte('created_at', todayISO)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Fetched visits:', data); // Debug log
            
            // Get unique doctor user_ids
            const doctorUserIds = [...new Set(
                (data || [])
                    .map(v => v.doctors?.user_id)
                    .filter(Boolean)
            )];

            console.log('Doctor user IDs:', doctorUserIds); // Debug log

            // Fetch all doctor names in one query
            let userNameMap = new Map();
            
            if (doctorUserIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, nama')
                    .in('id', doctorUserIds);

                console.log('Fetched users:', usersData); // Debug log
                
                if (!usersError && usersData) {
                    userNameMap = new Map(
                        usersData.map(u => [u.id, u.nama])
                    );
                }
            }

            // Map visits with doctor names
            const visitsWithData = (data || []).map((visit: any) => {
                let doctorName = '-';
                
                if (visit.doctors?.user_id) {
                    doctorName = userNameMap.get(visit.doctors.user_id) || `User ID: ${visit.doctors.user_id}`;
                } else if (visit.dokter_id) {
                    doctorName = `Doctor ID: ${visit.dokter_id}`;
                }

                console.log('Visit doctor mapping:', {
                    visit_id: visit.id,
                    doctor_user_id: visit.doctors?.user_id,
                    mapped_name: doctorName
                }); // Debug log

                return {
                    id: visit.id,
                    visit_id: visit.id,
                    patient_id: visit.patients?.id,
                    nrm: visit.patients?.nrm || '-',
                    nama: visit.patients?.nama || '-',
                    jenis_kelamin: visit.patients?.jenis_kelamin || 'L',
                    created_at: visit.created_at,
                    poli_name: visit.poli?.nama || '-',
                    poli_id: visit.poli_id,
                    doctor_name: doctorName,
                    dokter_id: visit.dokter_id,
                    payment_name: visit.payment_methods?.nama || '-',
                    tindak_lanjut: visit.status || '-',
                    status: visit.status || 'pending',
                    no_reg: visit.no_reg || '-', // Registration number
                    keluhan: visit.keluhan || '-',
                };
            });

            // Filter to show only one visit per patient (the latest one)
            const uniqueVisits = visitsWithData.reduce((acc: any[], visit: any) => {
                const existingIndex = acc.findIndex(v => v.patient_id === visit.patient_id);
                
                if (existingIndex === -1) {
                    acc.push(visit);
                } else {
                    const existing = acc[existingIndex];
                    if (new Date(visit.created_at) > new Date(existing.created_at)) {
                        acc[existingIndex] = visit;
                    }
                }
                
                return acc;
            }, []);

            setPatients(uniqueVisits);
            setFilteredData(uniqueVisits);
        } catch (error) {
            console.error('Error fetching today visits:', error);
            // Fallback to empty array on error
            setPatients([]);
            setFilteredData([]);
        } finally {
            setLoading(false);
        }
    };

    // Initialize time on client-side only to prevent hydration error
    useEffect(() => {
        setCurrentTime(new Date());
    }, []);

    // Sync counter number with selected loket
    useEffect(() => {
        setCurrentCounter(selectedLoket);
    }, [selectedLoket]);

    // Handlers for new registration flow
    const handlePatientSelected = (patient: any) => {
        setSelectedPatient(patient);
        setShowSearchModal(false);
        setShowVisitModal(true);
    };

    const handleCreateNewPatient = () => {
        router.push('/counter/patients/create');
    };

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

    // Fetch waiting tickets count for selected loket
    const fetchWaitingCount = async () => {
        try {
            const { data, error } = await supabase
                .from('queue_tickets')
                .select('id', { count: 'exact' })
                .eq('loket_id', selectedLoket)
                .eq('status', 'waiting');

            if (error) throw error;
            setWaitingCount(data?.length || 0);
        } catch (error) {
            console.error('Error fetching waiting count:', error);
        }
    };

    // Fetch current queue number for selected loket
    const fetchCurrentQueue = async () => {
        try {
            const { data, error } = await supabase
                .from('queue_tickets')
                .select('queue_number')
                .eq('loket_id', selectedLoket)
                .eq('status', 'called')
                .order('called_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                // No called tickets yet for this loket
                if (error.code === 'PGRST116') {
                    setCurrentQueue(0);
                } else {
                    throw error;
                }
            } else {
                setCurrentQueue(data.queue_number);
            }
        } catch (error) {
            console.error('Error fetching current queue:', error);
        }
    };

    // Fetch waiting count and current queue when loket changes
    useEffect(() => {
        fetchWaitingCount();
        fetchCurrentQueue();
    }, [selectedLoket]);

    // Queue functions
    const handleCallNext = async () => {
        try {
            const response = await fetch('/api/queue/call-next', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loket_id: selectedLoket }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 404) {
                    alert(`Tidak ada antrian yang menunggu di Loket ${selectedLoket}`);
                } else {
                    alert('Gagal memanggil antrian: ' + data.error);
                }
                return;
            }

            // Update current queue
            setCurrentQueue(data.ticket.queue_number);
            
            // Announce via text-to-speech
            announceQueue(data.ticket.queue_number, selectedLoket);
            
            // Broadcast for display page
            broadcastQueueCall(data.ticket);
            
            // Update waiting count
            await fetchWaitingCount();
        } catch (error) {
            console.error('Error calling next:', error);
            alert('Terjadi kesalahan saat memanggil antrian');
        }
    };

    const handleRepeatCall = () => {
        if (currentQueue < 1) {
            alert('Belum ada antrian yang dipanggil.');
            return;
        }
        announceQueue(currentQueue, selectedLoket);
        // Broadcast again
        broadcastQueueCall({
            queue_number: currentQueue,
            loket_id: selectedLoket,
        });
    };

    const handleResetQueue = () => {
        setShowResetModal(true);
    };

    const confirmReset = async () => {
        try {
            // Delete ALL tickets from all lokets
            const { error: deleteError } = await supabase
                .from('queue_tickets')
                .delete()
                .gte('queue_number', 0); // Delete all where queue_number >= 0

            if (deleteError) {
                console.error('Delete error:', deleteError);
                throw deleteError;
            }

            // Reset ALL counters
            const { error: updateError } = await supabase
                .from('queue_counters')
                .update({ current_queue: 0, updated_at: new Date().toISOString() })
                .gte('id', '00000000-0000-0000-0000-000000000000'); // Update all

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            setCurrentQueue(0);
            setWaitingCount(0);
            setShowResetModal(false);
            alert('Semua antrian di semua loket telah direset.');
            
            // Refresh data
            await fetchWaitingCount();
            await fetchCurrentQueue();
        } catch (error: any) {
            console.error('Error resetting queue:', error);
            alert('Terjadi kesalahan saat mereset antrian: ' + (error?.message || 'Unknown error'));
        }
    };

    const announceQueue = (queueNum: number, loket: number) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const queueInIndonesian = numberToIndonesian(queueNum);
            const loketInIndonesian = numberToIndonesian(loket);
            const speech = new SpeechSynthesisUtterance(
                `Nomor antrian ${queueInIndonesian}, silakan menuju loket ${loketInIndonesian}`
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

    const broadcastQueueCall = (ticket: any) => {
        const callData = {
            queue_number: ticket.queue_number,
            loket_id: ticket.loket_id,
            timestamp: Date.now(),
        };

        // Broadcast via localStorage for cross-tab
        localStorage.setItem('queueCalled', JSON.stringify(callData));

        // Dispatch custom event for same-tab
        window.dispatchEvent(
            new CustomEvent('queueCalled', {
                detail: callData,
            })
        );
    };



    const handleSaveVisit = async (visitData: any) => {
        if (!selectedPatient) return;

        try {
            // Use 'visits' table as per existing schema
            const { data: insertedData, error } = await supabase.from('visits').insert({
                patient_id: selectedPatient.patient_id || selectedPatient.id,
                poli_id: visitData.poliId,
                dokter_id: visitData.dokterId,
                penjamin_id: visitData.penjaminId,
                harga: visitData.harga,
                kunjungan_ke: visitData.kunjunganKe,
                keluhan: visitData.keluhan,
                no_reg: visitData.noRegistrasi,
                status: 'pending',
                created_at: new Date().toISOString(),
            }).select();

            if (error) throw error;

            setShowVisitModal(false);
            setSelectedPatient(null);
            
            // Show queue ticket modal
            const queueNumber = visitData.noRegistrasi ? visitData.noRegistrasi.split('-')[2] : '000';
            setQueueTicketData({
                queueNumber,
                nrm: selectedPatient.nrm,
                patientName: selectedPatient.nama,
                poliName: visitData.poliName,
                doctorName: visitData.dokterName,
            });
            setShowQueueTicket(true);
            
            // Refresh the table to show the new visit
            await fetchTodayVisits();
        } catch (error: any) {
            console.error('Error saving visit:', error);
            alert('Gagal menyimpan kunjungan: ' + error.message);
        }
    };

    const timeString = currentTime?.toLocaleTimeString('id-ID', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }) || '--:--:--';

    const dateString = currentTime?.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }) || '-';

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
                <header className="bg-blue-600 text-white p-6 shadow-lg rounded-lg mb-6">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Counter {currentCounter}</h1>
                            <p className="text-blue-100 text-sm mt-1">Sistem Manajemen Antrian</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{timeString}</div>
                            <div className="text-sm text-blue-100">{dateString}</div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Filter Section and Queue Display */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                            {/* Filter Section */}
                            <div className="xl:col-span-2 bg-blue-50 p-6 rounded-lg border border-blue-200">
                                <h2 className="text-lg font-bold text-blue-600 mb-6">FILTER DATA PASIEN</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {/* Date Range */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">TANGGAL REGISTRASI</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600 font-medium">s.d.</span>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Filter */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">CARA BAYAR</label>
                                        <select
                                            value={filterPayment}
                                            onChange={(e) => setFilterPayment(e.target.value)}
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Semua</option>
                                            {polis.map((p: Poli) => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Doctor Filter */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">DOKTER</label>
                                        <select
                                            value={filterDoctor}
                                            onChange={(e) => setFilterDoctor(e.target.value)}
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    </div>
                                </div>
                            </div>

                            {/* Queue Display */}
                            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg flex flex-col justify-center items-center min-h-[250px]">
                                {/* Loket Selector */}
                                <div className="w-full mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pilih Loket
                                    </label>
                                    <select
                                        value={selectedLoket}
                                        onChange={(e) => setSelectedLoket(Number(e.target.value))}
                                        className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value={1}>Loket 1</option>
                                        <option value={2}>Loket 2</option>
                                        <option value={3}>Loket 3</option>
                                        <option value={4}>Loket 4</option>
                                        <option value={5}>Loket 5</option>
                                    </select>
                                </div>

                                <div className="text-left mb-6 w-full">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Antrian Menunggu di Loket
                                        <span className="font-bold text-blue-600 ml-2">{selectedLoket}</span>
                                        <span className="mx-2">:</span>
                                        <span className="font-bold text-blue-600">{waitingCount}</span>
                                    </p>
                                </div>

                                <div className="text-center mb-8">
                                    <div className="text-9xl font-black text-blue-600 tracking-wider">
                                        {String(currentQueue).padStart(3, '0')}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <Button
                                        onClick={handleResetQueue}
                                        className="w-24 h-12 bg-red-600 hover:bg-red-700 text-white"
                                        title="Reset Antrian"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        onClick={handleRepeatCall}
                                        className="w-24 h-12 bg-blue-600 hover:bg-blue-700 text-white"
                                        title="Panggil Antrian"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        onClick={handleCallNext}
                                        className="w-24 h-12 bg-green-600 hover:bg-green-700 text-white"
                                        title="Antrian Selanjutnya"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-blue-600 uppercase">
                                KUNJUNGAN HARI INI
                            </h2>
                            <div className="flex gap-3">
                                <Button
                                    onClick={exportToExcel}
                                    variant="outline"
                                    className="px-4 py-2 text-sm"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Export Excel
                                </Button>
                                <Button onClick={() => setShowSearchModal(true)} className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Pendaftaran
                                </Button>
                            </div>
                        </div>

                        {/* Patient Table */}
                        <Card className="border overflow-hidden py-0">
                            <Table>
                                <TableHeader className="bg-blue-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NO. REG</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">TANGGAL</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NRM</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">NAMA PASIEN</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">J.K.</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">POLIKLINIK</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">DOKTER PJ</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">CARA BAYAR</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase">TINDAK LANJUT</TableHead>
                                        <TableHead className="px-6 py-3 text-xs font-bold text-gray-700 uppercase text-center">AKSI</TableHead>
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
                                                <TableCell className="px-6 py-4 text-center">{idx + 1}</TableCell>
                                                <TableCell className="px-6 py-4 font-semibold text-blue-600">
                                                    {patient.no_reg}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">
                                                    {new Date(patient.created_at).toLocaleDateString('id-ID')}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 font-medium">{patient.nrm}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.nama}</TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    {patient.jenis_kelamin === 'L' ? 'L' : 'P'}
                                                </TableCell>
                                                <TableCell className="px-6 py-4">{patient.poli_name}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.doctor_name}</TableCell>
                                                <TableCell className="px-6 py-4">{patient.payment_name}</TableCell>
                                                <TableCell className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${
                                                        patient.tindak_lanjut === 'Pulang' ? 'bg-blue-100 text-blue-800' :
                                                        patient.tindak_lanjut === 'Pindah Poli' ? 'bg-yellow-100 text-yellow-800' :
                                                        patient.tindak_lanjut === 'Rawat Inap' ? 'bg-green-100 text-green-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {patient.tindak_lanjut}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() => {
                                                            const printWindow = window.open('', '', 'width=800,height=600');
                                                            if (printWindow) {
                                                                printWindow.document.write(`
                                                                    <html>
                                                                    <head>
                                                                        <title>Antrian - ${patient.no_reg}</title>
                                                                        <style>
                                                                            @page { size: 80mm 150mm; margin: 5mm; }
                                                                            body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; }
                                                                            .ticket { border: 2px dashed #000; padding: 15px; }
                                                                            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                                                                            .reg-no { text-align: center; border: 2px solid #000; padding: 15px; margin: 10px 0; background: #f0f0f0; }
                                                                            .reg-no p:first-child { font-size: 10px; margin: 0 0 5px 0; }
                                                                            .reg-no p:last-child { font-size: 24px; font-weight: bold; margin: 0; }
                                                                            .info { margin: 10px 0; font-size: 12px; }
                                                                            .info div { border-bottom: 1px solid #ccc; padding: 5px 0; display: flex; }
                                                                            .info div span:first-child { width: 80px; font-weight: bold; }
                                                                            .footer { text-align: center; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
                                                                            .footer p { margin: 5px 0; font-size: 10px; }
                                                                        </style>
                                                                    </head>
                                                                    <body>
                                                                        <div class="ticket">
                                                                            <div class="header">
                                                                                <h2 style="margin: 0;">RUMAH SAKIT</h2>
                                                                                <p style="margin: 5px 0 0 0;">Antrian Poliklinik</p>
                                                                            </div>
                                                                            <div class="reg-no">
                                                                                <p>Nomor Antrian</p>
                                                                                <p style="font-size: 48px;">${patient.no_reg ? patient.no_reg.split('-')[2] : '000'}</p>
                                                                                <p style="font-size: 12px; margin-top: 5px;">${patient.poli_name}</p>
                                                                            </div>
                                                                            <div class="info">
                                                                                <div><span>NRM:</span><span>${patient.nrm}</span></div>
                                                                                <div><span>Nama:</span><span>${patient.nama.toUpperCase()}</span></div>
                                                                                <div><span>Dokter:</span><span>${patient.doctor_name}</span></div>
                                                                            </div>
                                                                            <div class="footer">
                                                                                <p><strong>${new Date(patient.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                                                                                <p><strong>${new Date(patient.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong></p>
                                                                                <p style="margin-top: 10px;">Harap menunggu panggilan</p>
                                                                                <p>Terima kasih</p>
                                                                            </div>
                                                                        </div>
                                                                    </body>
                                                                    </html>
                                                                `);
                                                                printWindow.document.close();
                                                                printWindow.print();
                                                            }
                                                        }}
                                                    >
                                                        🖨️ Print
                                                    </Button>
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
                {/* Patient Search Modal */}
                {showSearchModal && (
                    <PatientSearchModal
                        onClose={() => setShowSearchModal(false)}
                        onPatientSelected={handlePatientSelected}
                        onCreateNew={handleCreateNewPatient}
                    />
                )}

                {/* Visit Form Modal */}
                {showVisitModal && selectedPatient && (
                    <AddVisitModal
                        patient={selectedPatient}
                        onClose={() => {
                            setShowVisitModal(false);
                            setSelectedPatient(null);
                        }}
                        onSave={handleSaveVisit}
                    />
                )}

                {/* Reset Confirmation Modal */}
                {showResetModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Konfirmasi Reset Semua Antrian
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Apakah Anda yakin ingin mereset <strong>SEMUA antrian di SEMUA loket</strong>? 
                                Semua data antrian akan dihapus dan nomor antrian akan kembali ke 0.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    onClick={() => setShowResetModal(false)}
                                    variant="outline"
                                    className="px-6"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={confirmReset}
                                    className="px-6 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Ya, Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Queue Ticket Modal */}
                {showQueueTicket && queueTicketData && (
                    <QueueTicketModal
                        queueNumber={queueTicketData.queueNumber}
                        nrm={queueTicketData.nrm}
                        patientName={queueTicketData.patientName}
                        poliName={queueTicketData.poliName}
                        doctorName={queueTicketData.doctorName}
                        onClose={() => setShowQueueTicket(false)}
                    />
                )}
            </div>
        </CounterLayout>
    );
}
