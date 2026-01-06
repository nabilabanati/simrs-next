'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Volume2, Users, Clock, Download } from 'lucide-react';
import PatientSearchModal from '@/components/modals/patient-search-modal';
import AddVisitModal from '@/components/modals/add-visit-modal';
import QueueTicketModal from '@/components/modals/queue-ticket-modal';
import { fetchPoli, fetchDoctors, fetchPenjamin } from '@/lib/api-client/index';
import type { Poli, Doctor } from '@/lib/types';
import { toast } from 'sonner';

// Type for penjamin data (payment methods)
interface PaymentMethod {
  id: string;
  name?: string;
  nama?: string;
  tipe?: string;
}

interface LoketInterfaceProps {
  loketId: number; // 1-5
}

interface QueueItem {
  id: string;
  queue_number: number;
  created_at: string;
  status: string;
}

interface CurrentTicket {
  id: string;
  queue_number: number;
  called_at: string;
  status: string;
}

export default function LoketInterface({ loketId }: LoketInterfaceProps) {
  const router = useRouter();
  const [currentTicket, setCurrentTicket] = useState<CurrentTicket | null>(null);
  const [waitingQueue, setWaitingQueue] = useState<QueueItem[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Modal states
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [savedVisitData, setSavedVisitData] = useState<any | null>(null);

  // API data
  const [polis, setPolis] = useState<Poli[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Registration history data
  const [visits, setVisits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterPoli, setFilterPoli] = useState('');
  const [filterDokter, setFilterDokter] = useState('');
  const [filterPenjamin, setFilterPenjamin] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilter, setShowFilter] = useState(true);

  // ===== CLIENT-SIDE AUTH CHECK =====
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userStr = localStorage.getItem('user');
        
        if (!userStr) {
          console.log('[LoketInterface] No user in localStorage, redirecting to login');
          router.push(`/login?redirect=/counter/loket-${loketId}`);
          return;
        }

        const user = JSON.parse(userStr);
        
        // Check if user has correct role
        if (!['loket', 'admin_loket'].includes(user.role)) {
          console.log('❌ [LoketInterface] Invalid role, redirecting to unauthorized');
          router.push('/unauthorized');
          return;
        }

        // For role 'loket', check assignment
        if (user.role === 'loket') {
          const { supabase } = await import('@/lib/supabase');
          const { data: assignments } = await supabase
            .from('user_loket_assignment')
            .select('loket_id')
            .eq('user_id', user.id);

          const assignedLokets = assignments?.map(a => a.loket_id) || [];
          
          if (!assignedLokets.includes(loketId)) {
            console.log(`[LoketInterface] User not assigned to loket ${loketId}`);
            router.push('/unauthorized');
            return;
          }
        }

        console.log(`✅ [LoketInterface] Auth check passed for loket ${loketId}`);
        setIsAuthChecking(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [loketId, router]);

  // Initialize time
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load API data
  useEffect(() => {
    if (isAuthChecking) return; // Don't load data until auth is checked
    
    const loadData = async () => {
      try {
        const [polisData, doctorsData, paymentsData] = await Promise.all([
          fetchPoli(),
          fetchDoctors(),
          fetchPenjamin(),
        ]);
        setPolis(polisData);
        setDoctors(doctorsData);
        setPaymentMethods(paymentsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Gagal memuat data master');
      }
    };
    loadData();
  }, [isAuthChecking]);

  // Fetch queue data
  const fetchQueue = async () => {
    try {
      const response = await fetch(`/api/counter/get-queue?loket_id=${loketId}`);
      const data = await response.json();

      if (response.ok) {
        setCurrentTicket(data.current_ticket);
        setWaitingQueue(data.waiting_queue || []);
        setWaitingCount(data.waiting_count || 0);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  // Auto-refresh queue every 5 seconds
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [loketId]);

  // Fetch visits (registration history) for this loket
  const fetchVisits = async (tab: 'today' | 'all') => {
    setLoadingVisits(true);
    try {
      const params = new URLSearchParams({
        loket_id: loketId.toString(), // Filter by this loket
        page: '1',
        limit: '100',
      });

      if (tab === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.append('date_from', today.toISOString());
      }

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (filterPoli) params.append('poli_id', filterPoli);
      if (filterDokter) params.append('dokter_id', filterDokter);
      if (filterPenjamin) params.append('penjamin_id', filterPenjamin);

      const url = `/api/admin/loket/dashboard?${params}`;
      console.log('🔵 Fetching visits from:', url);
      console.log('📊 Filter params:', {
        loket_id: loketId,
        tab,
        dateFrom,
        dateTo,
        filterPoli,
        filterDokter,
        filterPenjamin,
        searchInput
      });

      const response = await fetch(url);
      const result = await response.json();

      console.log('✅ API Response Status:', response.status);
      console.log('📦 API Response Data:', result);

      if (response.ok) {
        let data = result.data || [];
        console.log('📋 Total data dari API:', data.length);

        // Client-side search filter
        if (searchInput.trim()) {
          const search = searchInput.toLowerCase();
          data = data.filter((visit: any) =>
            visit.patient?.nrm?.toLowerCase().includes(search) ||
            visit.patient?.nama?.toLowerCase().includes(search) ||
            visit.no_reg?.toLowerCase().includes(search)
          );
          console.log('🔍 Data setelah search:', data.length);
        }

        console.log('✅ Final visits to display:', data.length);
        setVisits(data);
      } else {
        console.error('❌ API Error Response:', result);
        toast.error('Gagal memuat data kunjungan: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error('Gagal memuat data kunjungan: ' + (error instanceof Error ? error.message : 'Network error'));
    } finally {
      setLoadingVisits(false);
    }
  };

  useEffect(() => {
    fetchVisits(activeTab);
  }, [activeTab, loketId, dateFrom, dateTo, filterPoli, filterDokter, filterPenjamin, searchInput]);

  // Call next patient
  const handleCallNext = async () => {
    console.time('⏱️ Call Next Patient');
    
    // Optimistic UI Update - Get next waiting ticket from local state
    if (!waitingQueue || waitingQueue.length === 0) {
      toast.error(`Tidak ada antrian yang menunggu di Loket ${loketId}`);
      return;
    }
    
    const nextInQueue = waitingQueue[0];
    const optimisticTicket = {
      id: nextInQueue.id,
      queue_number: nextInQueue.queue_number,
      loket_id: loketId,
      status: 'called' as const,
      called_at: new Date().toISOString(),
      created_at: nextInQueue.created_at
    };
    
    // Update UI IMMEDIATELY (optimistic)
    const previousTicket = currentTicket;
    setCurrentTicket(optimisticTicket);
    setWaitingQueue(prev => prev.slice(1)); // Remove first item
    setWaitingCount(prev => Math.max(0, prev - 1));
    
    // Show success immediately
    toast.success(`Antrian ${optimisticTicket.queue_number} dipanggil`);
    announceQueue(optimisticTicket.queue_number, loketId);
    broadcastQueueCall(optimisticTicket);
    
    console.timeEnd('Call Next Patient');
    console.log('UI updated optimistically (instant!)');
    
    // Call API in background to sync with database
    setLoading(true);
    try {
      const response = await fetch('/api/counter/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loket_id: loketId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Rollback optimistic update on error
        console.error('API call failed, rolling back...');
        setCurrentTicket(previousTicket);
        setWaitingQueue(prev => [nextInQueue, ...prev]);
        setWaitingCount(prev => prev + 1);
        
        if (response.status === 404) {
          toast.error(`Tidak ada antrian yang menunggu di Loket ${loketId}`);
        } else {
          toast.error('Gagal memanggil antrian: ' + data.error);
        }
        return;
      }
      
      // Sync with actual data from server
      console.log('API call successful, syncing data...');
      setCurrentTicket(data.ticket);
      
      // Fetch queue in background to ensure consistency
      fetchQueue();
      
    } catch (error) {
      // Rollback on error
      console.error('Error calling next, rolling back:', error);
      setCurrentTicket(previousTicket);
      setWaitingQueue(prev => [nextInQueue, ...prev]);
      setWaitingCount(prev => prev + 1);
      toast.error('Terjadi kesalahan saat memanggil antrian');
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatCall = () => {
    if (!currentTicket) {
      toast.error('Belum ada antrian yang dipanggil');
      return;
    }
    announceQueue(currentTicket.queue_number, loketId);
    broadcastQueueCall(currentTicket);
    toast.info(`Mengulangi panggilan antrian ${currentTicket.queue_number}`);
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
      loket_id: loketId,
      timestamp: Date.now(),
    };
    localStorage.setItem('queueCalled', JSON.stringify(callData));
    window.dispatchEvent(new CustomEvent('queueCalled', { detail: callData }));
  };

  const handleOpenRegistration = () => {
    if (!currentTicket) {
      toast.error('Silakan panggil antrian terlebih dahulu');
      return;
    }
    setShowSearchModal(true);
  };

  const handlePatientSelected = (patient: any) => {
    console.log('[LoketInterface] Patient selected:', patient);
    setSelectedPatient(patient);
    setShowSearchModal(false);
    setShowVisitModal(true);
    console.log('[LoketInterface] showVisitModal set to true');
  };

  const handleCreateNewPatient = () => {
    setShowSearchModal(false);
    // Redirect to create patient form with returnTo parameter
    router.push(`/counter/patients/create?returnTo=/counter/loket-${loketId}`);
  };

  const handleSaveVisit = async (visitData: any) => {
    if (!selectedPatient || !currentTicket) {
      console.error('Missing data:', { selectedPatient, currentTicket });
      toast.error('Data tidak lengkap');
      return;
    }

    console.log('Saving visit with data:', {
      ticket_id: currentTicket.id,
      patient_id: selectedPatient.id,
      visitData
    });

    try {
      const response = await fetch('/api/counter/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: currentTicket.id,
          patient_id: selectedPatient.id,
          poli_id: visitData.poliId,
          dokter_id: visitData.dokterId,
          penjamin_id: visitData.penjaminId,
          keluhan: visitData.keluhan,
          harga: visitData.harga,
          kunjungan_ke: visitData.kunjunganKe,
        }),
      });

      const data = await response.json();
      console.log('API Response:', { status: response.status, data });

      if (!response.ok) {
        console.error('API Error:', data);
        if (data.quota_status === 'full') {
          toast.error(data.message);
        } else {
          toast.error('Gagal menyimpan registrasi: ' + (data.error || data.message));
        }
        return;
      }

      toast.success('Registrasi berhasil!');
      
      // Simpan data untuk ticket modal
      setSavedVisitData({
        queueNumber: currentTicket.queue_number.toString(),
        registrationNo: data.visit?.no_reg || 'N/A',
        nrm: selectedPatient.nrm,
        patientName: selectedPatient.nama || selectedPatient.name,
        poliName: visitData.poliName,
        doctorName: visitData.dokterName,
        paymentMethod: visitData.penjaminName,
        price: visitData.harga,
        bpjsNumber: selectedPatient.bpjs_number,
        insuranceNumber: selectedPatient.insurance_number
      });
      
      setShowVisitModal(false);
      setShowTicketModal(true);
      setSelectedPatient(null);
      setCurrentTicket(null);
      await fetchQueue();
      await fetchVisits(activeTab);
    } catch (error: any) {
      console.error('Error saving visit:', error);
      toast.error('Gagal menyimpan registrasi: ' + error.message);
    }
  };

  const handlePrintTicket = (visit: any) => {
    // Check if visit is from today
    const visitDate = new Date(visit.created_at).toDateString();
    const today = new Date().toDateString();
    
    if (visitDate !== today) {
      toast.error('Hanya dapat print untuk kunjungan hari ini!');
      return;
    }

    // Prepare data for ticket modal
    const ticketData = {
      queueNumber: visit.queue_tickets?.queue_number?.toString() || '-',
      registrationNo: visit.no_reg || 'N/A',
      nrm: visit.patient?.nrm || '-',
      patientName: visit.patient?.nama || visit.patient?.name || '-',
      poliName: visit.poli?.nama || '-',
      doctorName: visit.doctor?.nama || '-',
      paymentMethod: visit.penjamin?.nama || 'UMUM',
      price: visit.harga || 0,
      bpjsNumber: visit.patient?.bpjs_number || '',
      insuranceNumber: visit.patient?.insurance_number || ''
    };
    
    setSavedVisitData(ticketData);
    setShowTicketModal(true);
  };

  // Check if a visit is from today
  const isVisitToday = (visit: any) => {
    const visitDate = new Date(visit.created_at).toDateString();
    const today = new Date().toDateString();
    return visitDate === today;
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (visits.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    try {
      // Dynamic import xlsx
      const { utils, writeFile } = require('xlsx');

      // Prepare data
      const data = visits.map((visit, idx) => ({
        'NO': idx + 1,
        'NO. REG': visit.no_reg,
        'TANGGAL': new Date(visit.created_at).toLocaleDateString('id-ID'),
        'NRM': visit.patient?.nrm || '-',
        'NAMA PASIEN': visit.patient?.nama || '-',
        'JK': visit.patient?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        'POLIKLINIK': visit.poli?.nama || '-',
        'DOKTER': visit.doctor?.nama || '-',
        'CARA BAYAR': visit.penjamin?.nama || 'UMUM',
        'HARGA': visit.harga || 0,
        'STATUS': visit.status === 'pending' || visit.status === 'menunggu' ? 'Terdaftar' :
                  visit.status === 'processed' ? 'Ditangani' :
                  (visit.status === 'completed' || visit.status === 'selesai') ? 'Selesai' :
                  visit.status || 'Terdaftar'
      }));

      // Create workbook
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Kunjungan');

      // Set column widths
      const colWidths = [
        { wch: 5 },   // NO
        { wch: 15 },  // NO. REG
        { wch: 12 },  // TANGGAL
        { wch: 12 },  // NRM
        { wch: 25 },  // NAMA PASIEN
        { wch: 12 },  // JK
        { wch: 18 },  // POLIKLINIK
        { wch: 18 },  // DOKTER
        { wch: 15 },  // CARA BAYAR
        { wch: 12 },  // HARGA
        { wch: 15 },  // STATUS
      ];
      ws['!cols'] = colWidths;

      // Add header styling
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };

      // Apply header styles
      for (let i = 0; i < Object.keys(data[0]).length; i++) {
        const cellRef = utils.encode_col(i) + '1';
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
        }
      }

      // Add borders to all cells
      const range = utils.decode_range(ws['!ref']);
      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellRef = utils.encode_cell({ r, c });
          if (!ws[cellRef]) ws[cellRef] = {};
          ws[cellRef].s = ws[cellRef].s || {};
          ws[cellRef].s.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
          // Alignment
          ws[cellRef].s.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
        }
      }

      // Generate filename
      const fileName = activeTab === 'today' 
        ? `Kunjungan_Hari_Ini_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`
        : `Semua_Kunjungan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`;

      // Write file
      writeFile(wb, fileName);
      toast.success(`Export ${visits.length} data berhasil!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export data');
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

  // Show loading while checking auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg rounded-lg mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Loket {loketId}</h1>
            <p className="text-blue-100 text-sm mt-1">Loket Antrian dan Pendaftaran Pasien</p>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                    />
                    <span className="text-sm text-gray-600 font-medium">s.d.</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={activeTab === 'today'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
                    />
                  </div>
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
                      <option key={pm.id} value={pm.id}>{pm.nama || pm.name}</option>
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
                      <option key={poli.id} value={poli.id}>{poli.nama}</option>
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
                      <option key={doctor.id} value={doctor.id}>{doctor.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search and Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cari NRM, Nama, atau NIK..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                  >
                    Cari
                  </Button>
                  <Button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setFilterPoli('');
                      setFilterDokter('');
                      setFilterPenjamin('');
                      setSearchInput('');
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Queue Display */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg flex flex-col h-full">
              <div className="text-center flex-1 flex items-center justify-center my-4">
                <div className="text-7xl font-black text-blue-600 tracking-wider">
                  {currentTicket ? String(currentTicket.queue_number).padStart(3, '0') : '000'}
                </div>
              </div>

              <div className="flex justify-center gap-4 mb-3">
                <Button
                  onClick={handleRepeatCall}
                  disabled={!currentTicket}
                  variant="outline"
                  className="px-4 py-2 text-sm"
                >
                  <Volume2 className="w-4 h-4 mr-1" />
                  Ulangi
                </Button>
                <Button
                  onClick={handleCallNext}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                >
                  <Users className="w-4 h-4 mr-1" />
                  {loading ? 'Memanggil...' : 'Panggil'}
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 mb-4">
                {currentTicket ? `Dipanggil: ${new Date(currentTicket.called_at).toLocaleTimeString('id-ID')}` : 'Reset otomatis jam 00:00'}
              </div>

              {/* Next Queue List */}
              {waitingQueue.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">Antrian Selanjutnya:</h4>
                  <div className="space-y-1">
                    {waitingQueue.slice(0, 5).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-white/50 rounded px-2 py-1">
                        <span className="font-medium text-gray-700">
                          {index + 1}. Antrian {String(item.queue_number).padStart(3, '0')}
                        </span>
                        <span className="text-gray-500">
                          {new Date(item.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Pasien Terdaftar</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {activeTab === 'today' ? visits.filter(v => v.status === 'pending' || v.status === 'menunggu' || !v.status).length : visits.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Pasien Selesai Penanganan</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {visits.filter(v => v.status === 'selesai' || v.status === 'completed').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Antrian Menunggu</h3>
                    <p className="text-3xl font-bold text-yellow-600">{waitingCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="px-4 py-2 text-sm"
                onClick={handleExportExcel}
              >
                <Download className="w-4 h-4 mr-1" />
                Export Excel
              </Button>
              <Button 
                onClick={handleOpenRegistration}
                disabled={!currentTicket}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Tambah Pendaftaran
              </Button>
            </div>
          </div>

          {/* Data Table */}
          <Card className="border overflow-auto py-0">
            <Table className="min-w-full">
              <TableHeader className="bg-blue-50">
                <TableRow>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-12">NO</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">NO. REG</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">TGL</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-20">NRM</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">NAMA</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-12">JK</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">POLI</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase">DOKTER</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">BAYAR</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase w-24">STATUS</TableHead>
                  <TableHead className="px-2 py-2 text-xs font-bold text-gray-700 uppercase text-center w-20">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingVisits ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      Tidak ada data pasien
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((visit, idx) => (
                    <TableRow key={visit.id} className="text-sm">
                      <TableCell className="px-2 py-2 text-center">{idx + 1}</TableCell>
                      <TableCell className="px-2 py-2 font-semibold text-blue-600 text-xs">
                        {visit.no_reg}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs">
                        {new Date(visit.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-medium text-xs">{visit.patient?.nrm || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.patient?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs">
                        {visit.patient?.jenis_kelamin === 'L' ? 'L' : 'P'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.poli?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.doctor?.nama || '-'}</TableCell>
                      <TableCell className="px-2 py-2 text-xs">{visit.penjamin?.nama || 'UMUM'}</TableCell>
                      <TableCell className="px-2 py-2">
                        {visit.status ? (
                          <span className={`inline-flex items-center gap-1 py-1 px-2 rounded-full text-xs font-medium ${
                            visit.status === 'pending' || visit.status === 'menunggu' ? 'bg-yellow-100 text-yellow-800' :
                            visit.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                            (visit.status === 'completed' || visit.status === 'selesai') ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {visit.status === 'pending' || visit.status === 'menunggu' ? 'Terdaftar' :
                             visit.status === 'processed' ? 'Ditangani' :
                             (visit.status === 'completed' || visit.status === 'selesai') ? 'Selesai' :
                             visit.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 py-1 px-2 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Terdaftar
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1"
                          onClick={() => handlePrintTicket(visit)}
                          disabled={!isVisitToday(visit)}
                          title={!isVisitToday(visit) ? 'Hanya dapat print untuk kunjungan hari ini' : 'Print Struk'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <PatientSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onPatientSelected={handlePatientSelected}
        onCreateNew={handleCreateNewPatient}
      />



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

      {showTicketModal && savedVisitData && (
        <QueueTicketModal
          queueNumber={savedVisitData.queueNumber}
          registrationNo={savedVisitData.registrationNo}
          nrm={savedVisitData.nrm}
          patientName={savedVisitData.patientName}
          poliName={savedVisitData.poliName}
          doctorName={savedVisitData.doctorName}
          paymentMethod={savedVisitData.paymentMethod}
          price={savedVisitData.price}
          bpjsNumber={savedVisitData.bpjsNumber}
          insuranceNumber={savedVisitData.insuranceNumber}
          onClose={() => {
            setShowTicketModal(false);
            setSavedVisitData(null);
          }}
        />
      )}
    </div>
  );
}
