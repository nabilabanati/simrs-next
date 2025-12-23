'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CounterLayout } from '@/components/layout/CounterLayout';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Clock, Download, Activity, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchPoli, fetchAllDoctors, fetchPaymentMethods } from '@/lib/api-client';
import type { Poli, Doctor, PaymentMethod } from '@/lib/api-client';
<<<<<<< HEAD
=======
import AddVisitModal from '@/components/modals/add-visit-modal';
import PatientSearchModal from '@/components/modals/patient-search-modal';
import QueueTicketModal from '@/components/modals/queue-ticket-modal';
import { toast } from 'sonner';
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9

export default function AdminCounterPage() {
  const router = useRouter();
  
  // Data States
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Statistics States
  const [stats, setStats] = useState({
    totalVisits: 0,
    servedPatients: 0,
    activeLokets: 0,
    waitingQueue: 0,
  });
  
  const [loketStats, setLoketStats] = useState<Record<number, any>>({});
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');

  // Filter States
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLoket, setSelectedLoket] = useState<number | 'all'>('all');
  const [filterPoli, setFilterPoli] = useState('');
  const [filterDokter, setFilterDokter] = useState('');
  const [filterPenjamin, setFilterPenjamin] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // API data states
  const [polis, setPolis] = useState<Poli[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Current Time
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Initialize time
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

<<<<<<< HEAD
  // Load API data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [polisData, doctorsData, paymentsData] = await Promise.all([
          fetchPoli(),
          fetchAllDoctors(),
          fetchPaymentMethods(),
=======
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

    // Auth check
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);

        // Check if user has loket role
        if (userData.role !== 'loket') {
            toast.error('Akses ditolak. Anda bukan petugas loket.');
            router.push('/login');
            return;
        }
    }, [router]);

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
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9
        ]);
        setPolis(polisData);
        setDoctors(doctorsData);
        setPaymentMethods(paymentsData);
        
        await fetchLoketStatistics();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();

    // Set interval for refreshing stats every 30 seconds
    const interval = setInterval(fetchLoketStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load visits when tab changes
  useEffect(() => {
    fetchVisits();
  }, [activeTab]);

  // Refetch when date range changes (only in all mode)
  useEffect(() => {
    if (activeTab === 'all') {
      fetchVisits();
    }
  }, [dateFrom, dateTo]);

  // Fetch Loket Statistics
  const fetchLoketStatistics = async () => {
    try {
      // Fetch waiting counts
      const { data: waitingData } = await supabase
        .from('queue_tickets')
        .select('loket_id, status')
        .eq('status', 'waiting');

      // Fetch current queues (called)
      const { data: currentQueues } = await supabase
        .from('queue_tickets')
        .select('loket_id, queue_number, status')
        .eq('status', 'called')
        .order('called_at', { ascending: false });

      // Fetch all visits created today for count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: visitsTodayCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Process per-loket stats
      const loketData: Record<number, any> = {};
      const activeLoketIds = new Set<number>();

<<<<<<< HEAD
      // Initialize 5 lokets
      [1, 2, 3, 4, 5].forEach(id => {
        loketData[id] = {
          id,
          waiting: 0,
          currentQueue: '-',
          status: 'idle',
=======
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
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9
        };
      });

<<<<<<< HEAD
      // Map waiting counts
      waitingData?.forEach((ticket: any) => {
        if (loketData[ticket.loket_id]) {
          loketData[ticket.loket_id].waiting++;
=======
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
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9
        }
      });

      // Map current queue
      currentQueues?.forEach((ticket: any) => {
        if (loketData[ticket.loket_id] && loketData[ticket.loket_id].currentQueue === '-') {
          loketData[ticket.loket_id].currentQueue = ticket.queue_number;
          loketData[ticket.loket_id].status = 'active';
          activeLoketIds.add(ticket.loket_id);
        }
      });

      setLoketStats(loketData);
      setStats({
        totalVisits: visitsTodayCount || 0,
        servedPatients: visitsTodayCount || 0,
        activeLokets: activeLoketIds.size,
        waitingQueue: waitingData?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch Visits from ALL lokets
  const fetchVisits = async () => {
    setLoading(true);
    try {
      // Fetch all visits with full details
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .order('created_at', { ascending: false });

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        throw visitsError;
      }

      console.log('Raw visits:', visitsData);

      if (!visitsData || visitsData.length === 0) {
        setVisits([]);
        setLoading(false);
        return;
      }

      // Apply date filter on client side
      let filteredByDate = visitsData;
      if (activeTab === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filteredByDate = visitsData.filter(v => new Date(v.created_at) >= today);
      } else {
        if (dateFrom) {
          const from = new Date(dateFrom);
          filteredByDate = filteredByDate.filter(v => new Date(v.created_at) >= from);
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          filteredByDate = filteredByDate.filter(v => new Date(v.created_at) <= to);
        }
      }

      // Fetch related data
      const patientIds = [...new Set(filteredByDate.map(v => v.patient_id).filter(Boolean))];
      const poliIds = [...new Set(filteredByDate.map(v => v.poli_id).filter(Boolean))];
      const doctorIds = [...new Set(filteredByDate.map(v => v.dokter_id).filter(Boolean))];
      const penjaminIds = [...new Set(filteredByDate.map(v => v.penjamin_id).filter(Boolean))];
      const queueTicketIds = [...new Set(filteredByDate.map(v => v.queue_ticket_id).filter(Boolean))];

      // Fetch all related data in parallel
      const [patientsRes, polisRes, doctorsRes, penjaminsRes, queueTicketsRes] = await Promise.all([
        patientIds.length > 0 ? supabase.from('patients').select('*').in('id', patientIds) : { data: [] },
        poliIds.length > 0 ? supabase.from('poli').select('*').in('id', poliIds) : { data: [] },
        doctorIds.length > 0 ? supabase.from('doctors').select('id, user_id').in('id', doctorIds) : { data: [] },
        penjaminIds.length > 0 ? supabase.from('penjamin').select('*').in('id', penjaminIds) : { data: [] },
        queueTicketIds.length > 0 ? supabase.from('queue_tickets').select('*').in('id', queueTicketIds) : { data: [] }
      ]);

      console.log('Doctors raw:', doctorsRes.data);

      // Get user IDs from doctors to fetch user names
      const userIds = [...new Set((doctorsRes.data || []).map(d => d.user_id).filter(Boolean))];
      const usersRes = userIds.length > 0 ? await supabase.from('users').select('id, nama').in('id', userIds) : { data: [] };

      console.log('Users fetched:', usersRes.data);

<<<<<<< HEAD
      // Create maps for quick lookup
      const patientsMap = new Map((patientsRes.data || []).map(p => [p.id, p]));
      const polisMap = new Map((polisRes.data || []).map(p => [p.id, p]));
      const usersMap = new Map((usersRes.data || []).map(u => [u.id, u]));
      const doctorsMap = new Map((doctorsRes.data || []).map(d => [d.id, { ...d, nama: usersMap.get(d.user_id)?.nama || '-' }]));
      const penjaminsMap = new Map((penjaminsRes.data || []).map(p => [p.id, p]));
      const queueTicketsMap = new Map((queueTicketsRes.data || []).map(q => [q.id, q]));
=======
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
                                                    <span className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${patient.tindak_lanjut === 'Pulang' ? 'bg-blue-100 text-blue-800' :
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
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9

      console.log('Doctors map:', doctorsMap);
      console.log('Queue tickets map:', queueTicketsMap);

      // Combine data
      const enrichedVisits = filteredByDate.map(visit => ({
        ...visit,
        patients: patientsMap.get(visit.patient_id) || null,
        poli: polisMap.get(visit.poli_id) || null,
        doctors: doctorsMap.get(visit.dokter_id) || null,
        payment_methods: penjaminsMap.get(visit.penjamin_id) || null,
        queue_tickets: queueTicketsMap.get(visit.queue_ticket_id) || null,
      }));

      console.log('Enriched visits:', enrichedVisits);
      setVisits(enrichedVisits);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // Apply filters
  const filteredVisits = visits.filter(visit => {
    // Skip rows with too many empty fields
    const emptyFields = [
      !visit.patients?.nrm,
      !visit.patients?.nama,
      !visit.poli?.nama,
      !visit.doctors?.nama,
      !visit.no_reg,
    ].filter(Boolean).length;
    
    if (emptyFields > 2) return false; // Skip if more than 2 important fields are empty
    
    // Loket filter
    if (selectedLoket !== 'all' && visit.queue_tickets?.loket_id !== selectedLoket) return false;
    if (filterPoli && visit.poli?.nama !== filterPoli) return false;
    if (filterDokter && visit.doctors?.nama !== filterDokter) return false;
    if (filterPenjamin && visit.payment_methods?.nama !== filterPenjamin) return false;
    if (searchInput) {
      const search = searchInput.toLowerCase();
      const nrm = visit.patients?.nrm?.toLowerCase() || '';
      const nama = visit.patients?.nama?.toLowerCase() || '';
      const noReg = visit.no_reg?.toLowerCase() || '';
      if (!nrm.includes(search) && !nama.includes(search) && !noReg.includes(search)) {
        return false;
      }
    }
    return true;
  });
=======
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
>>>>>>> 5e6cb2d6aef843d5c8cd3b57915e1468006536a9

  // Export to Excel
  const exportToExcel = () => {
    const headers = ['Loket', 'No. Reg', 'Tgl', 'NRM', 'Nama', 'JK', 'Poli', 'Dokter', 'Bayar'];
    const rows = filteredVisits.map((v) => [
      v.queue_tickets?.loket_id ? `Loket ${v.queue_tickets.loket_id}` : '-',
      v.no_reg || '-',
      new Date(v.created_at).toLocaleDateString('id-ID'),
      v.patients?.nrm || '-',
      v.patients?.nama || '-',
      v.patients?.jenis_kelamin || '-',
      v.poli?.nama || '-',
      v.doctors?.nama || '-',
      v.payment_methods?.nama || 'UMUM',
    ]);

    let html = '<table border="1"><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    rows.forEach(row => {
      html += '<tr>' + row.map(cell => `<td>${cell || ''}</td>`).join('') + '</tr>';
    });
    html += '</table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_counter_${new Date().getTime()}.xls`;
    link.click();
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

  return (
    <CounterLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-600 text-white p-6 shadow-lg rounded-lg mb-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Monitoring Loket</h1>
              <p className="text-blue-100 text-sm mt-1">Pusat kendali dan monitoring 5 loket pendaftaran</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{timeString}</div>
              <div className="text-sm text-blue-100">{dateString}</div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Kunjungan</p>
                  <p className="text-3xl font-bold">{stats.totalVisits}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Pasien Terlayani</p>
                  <p className="text-3xl font-bold">{stats.servedPatients}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Loket Aktif</p>
                  <p className="text-3xl font-bold">{stats.activeLokets}/5</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <LayoutGrid className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-none text-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Antrian</p>
                  <p className="text-3xl font-bold">{stats.waitingQueue}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 max-w-7xl mx-auto">
          {/* Per-Loket Monitor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((id) => (
              <Card key={id} className="shadow-md border-t-4 border-t-blue-500 hover:shadow-xl transition-all">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800">Loket {id}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      loketStats[id]?.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {loketStats[id]?.status === 'active' ? 'Aktif' : 'Idle'}
                    </span>
                  </div>
                  <div className="text-center py-2 bg-gray-50 rounded-lg mb-3">
                    <p className="text-xs text-gray-500 uppercase">Antrian Saat Ini</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {loketStats[id]?.currentQueue || '-'}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 border-t pt-3">
                    <span>Menunggu: <strong className="text-orange-600">{loketStats[id]?.waiting || 0}</strong></span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-blue-600 hover:text-blue-800"
                      onClick={() => router.push(`/counter/loket-${id}`)}
                    >
                      Detail →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter Section */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
            <h2 className="text-lg font-bold text-blue-600 mb-6">FILTER DATA PASIEN</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  TANGGAL REGISTRASI
                  {activeTab === 'today' && (
                    <span className="text-xs text-gray-500 ml-2">(Hanya untuk Tab Semua)</span>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    disabled={activeTab === 'today'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white"
                  />
                  <span className="text-sm text-gray-600 font-medium">s.d.</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled={activeTab === 'today'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white"
                  />
                </div>
              </div>

              {/* Loket Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">LOKET</label>
                <select
                  value={selectedLoket}
                  onChange={(e) => setSelectedLoket(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">Semua Loket</option>
                  <option value="1">Loket 1</option>
                  <option value="2">Loket 2</option>
                  <option value="3">Loket 3</option>
                  <option value="4">Loket 4</option>
                  <option value="5">Loket 5</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">CARA BAYAR</label>
                <select
                  value={filterPenjamin}
                  onChange={(e) => setFilterPenjamin(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.nama}>{pm.nama}</option>
                  ))}
                </select>
              </div>

              {/* Poli Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">POLIKLINIK</label>
                <select
                  value={filterPoli}
                  onChange={(e) => setFilterPoli(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua</option>
                  {polis.map((poli) => (
                    <option key={poli.id} value={poli.name}>{poli.name}</option>
                  ))}
                </select>
              </div>

              {/* Doctor Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">DOKTER</label>
                <select
                  value={filterDokter}
                  onChange={(e) => setFilterDokter(e.target.value)}
                  className="w-full py-3 px-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Semua</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search and Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari NRM, Nama, atau No. Registrasi..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => fetchVisits()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                >
                  Cari
                </Button>
                <Button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSelectedLoket('all');
                    setFilterPoli('');
                    setFilterDokter('');
                    setFilterPenjamin('');
                    setSearchInput('');
                    fetchVisits();
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Tab and Action Buttons */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('today')}
                variant={activeTab === 'today' ? 'default' : 'outline'}
                className={activeTab === 'today' ? 'bg-blue-600' : ''}
              >
                HARI INI
              </Button>
              <Button
                onClick={() => setActiveTab('all')}
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className={activeTab === 'all' ? 'bg-blue-600' : ''}
              >
                SEMUA
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="px-4 py-2 text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Export Excel
            </Button>
          </div>

          {/* Data Table */}
          <Card className="border overflow-auto py-0">
            <Table className="min-w-full">
              <TableHeader className="bg-blue-50">
                <TableRow>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-12">NO</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-20">LOKET</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">NO. REG</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">TGL</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-20">NRM</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">NAMA</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-12">JK</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">POLI</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">DOKTER</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">BAYAR</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Tidak ada data pasien
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVisits.map((visit, idx) => (
                    <TableRow key={visit.id} className="text-sm hover:bg-blue-50/50">
                      <TableCell className="px-2 py-2 text-center">{idx + 1}</TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        {visit.queue_tickets && visit.queue_tickets.loket_id ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Loket {visit.queue_tickets.loket_id}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-semibold text-blue-600 text-xs">
                        {visit.no_reg || '-'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs">
                        {new Date(visit.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-medium text-xs">{visit.patients?.nrm || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.patients?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs">
                        {visit.patients?.jenis_kelamin === 'L' ? 'L' : 'P'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.poli?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.doctors?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.payment_methods?.nama || 'UMUM'}</TableCell>
                      <TableCell className="px-2 py-2">
                        {visit.queue_tickets && visit.queue_tickets.status ? (
                          <span className={`inline-flex items-center gap-1 py-1 px-2 rounded-full text-xs font-medium ${
                            visit.queue_tickets.status === 'called' ? 'bg-green-100 text-green-800' :
                            visit.queue_tickets.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            visit.queue_tickets.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {visit.queue_tickets.status === 'called' ? 'dipanggil' :
                             visit.queue_tickets.status === 'waiting' ? 'menunggu' :
                             visit.queue_tickets.status === 'finished' ? 'selesai' : visit.queue_tickets.status}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </CounterLayout>
  );
}
